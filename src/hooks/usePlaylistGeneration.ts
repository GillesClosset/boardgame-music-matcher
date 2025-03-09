"use client";

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MoodSettings } from '@/lib/boardgamegeek';
import { PlaylistGenerationResult, SavedPlaylist } from '@/types';
import { useAuth } from './useAuth';

export const usePlaylistGeneration = () => {
  const { user } = useAuth();
  const [moodSettings, setMoodSettings] = useState<MoodSettings>({
    energy: 0.5,
    valence: 0.5,
    tempo: 120,
    instrumentalness: 0.5,
    acousticness: 0.5,
  });

  // Generate playlist mutation
  const {
    mutate: generatePlaylist,
    data: generatedPlaylist,
    isPending: isGenerating,
    error: generationError,
    reset: resetGeneration,
  } = useMutation({
    mutationFn: async ({
      gameId,
      gameName,
      trackCount = 20,
    }: {
      gameId: string;
      gameName: string;
      trackCount?: number;
    }) => {
      const response = await fetch('/api/playlist/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          gameName,
          moodSettings,
          trackCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }

      return response.json() as Promise<PlaylistGenerationResult>;
    },
  });

  // Get user's saved playlists
  const {
    data: savedPlaylists,
    isLoading: isLoadingSaved,
    error: savedPlaylistsError,
    refetch: refetchSavedPlaylists,
  } = useQuery({
    queryKey: ['savedPlaylists', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const response = await fetch('/api/playlist/saved');

      if (!response.ok) {
        throw new Error('Failed to fetch saved playlists');
      }

      return response.json() as Promise<SavedPlaylist[]>;
    },
    enabled: !!user?.id,
  });

  // Save playlist mutation
  const {
    mutate: savePlaylist,
    isPending: isSaving,
    error: saveError,
  } = useMutation({
    mutationFn: async (playlistResult: PlaylistGenerationResult) => {
      const response = await fetch('/api/playlist/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playlistResult),
      });

      if (!response.ok) {
        throw new Error('Failed to save playlist');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refetch saved playlists after saving
      refetchSavedPlaylists();
    },
  });

  // Delete playlist mutation
  const {
    mutate: deletePlaylist,
    isPending: isDeleting,
    error: deleteError,
  } = useMutation({
    mutationFn: async (playlistId: string) => {
      const response = await fetch(`/api/playlist/${playlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }

      return response.json();
    },
    onSuccess: () => {
      // Refetch saved playlists after deleting
      refetchSavedPlaylists();
    },
  });

  // Update mood settings
  const updateMoodSettings = (newSettings: Partial<MoodSettings>) => {
    setMoodSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  return {
    moodSettings,
    updateMoodSettings,
    generatePlaylist,
    generatedPlaylist,
    isGenerating,
    generationError,
    resetGeneration,
    savedPlaylists: savedPlaylists || [],
    isLoadingSaved,
    savedPlaylistsError,
    savePlaylist,
    isSaving,
    saveError,
    deletePlaylist,
    isDeleting,
    deleteError,
    refetchSavedPlaylists,
  };
};

export default usePlaylistGeneration; 