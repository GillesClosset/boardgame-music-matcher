"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

// Define proper types for Spotify Web Playback SDK
declare global {
  interface Window {
    Spotify: {
      Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

// Spotify Player types
interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (callback: (token: string) => void) => void;
  volume: number;
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (state: any) => void) => void;
  removeListener: (event: string, callback: (state: any) => void) => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  setVolume: (volume: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (position: number) => Promise<void>;
}

interface SpotifyPlaybackState {
  context: {
    uri: string;
    metadata: Record<string, unknown>;
  };
  disallows: {
    pausing: boolean;
    skipping_prev: boolean;
    skipping_next: boolean;
  };
  duration: number;
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrack;
    previous_tracks: SpotifyTrack[];
    next_tracks: SpotifyTrack[];
  };
}

interface SpotifyTrack {
  id: string;
  uri: string;
  type: string;
  media_type: string;
  name: string;
  duration_ms: number;
  artists: Array<{
    name: string;
    uri: string;
  }>;
  album: {
    name: string;
    uri: string;
    images: Array<{
      url: string;
    }>;
  };
}

export const useSpotifyPlayback = () => {
  const { spotifyTokens, refreshSpotifyTokens } = useAuth();
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [playerError, setPlayerError] = useState<Error | null>(null);
  const [volume, setVolume] = useState(0.5);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!spotifyTokens?.access_token) return;

    // Load Spotify Web Playback SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize player when SDK is ready
    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Board Game Music Matcher',
        getOAuthToken: async (cb: (token: string) => void) => {
          // Check if token is expired
          if (spotifyTokens.expires_at < Date.now()) {
            const newTokens = await refreshSpotifyTokens();
            if (newTokens) {
              cb(newTokens.access_token);
            }
          } else {
            cb(spotifyTokens.access_token);
          }
        },
        volume: volume / 100,
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
        setPlayerError(new Error(`Initialization error: ${message}`));
      });

      spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        setPlayerError(new Error(`Authentication error: ${message}`));
      });

      spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
        setPlayerError(new Error(`Account error: ${message}`));
      });

      spotifyPlayer.addListener('playback_error', ({ message }: { message: string }) => {
        setPlayerError(new Error(`Playback error: ${message}`));
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify player ready with device ID:', device_id);
        setDeviceId(device_id);
        setPlayerError(null);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device has gone offline:', device_id);
        setDeviceId(null);
      });

      // Player state changed
      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
      });

      // Connect to the player
      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    // Cleanup
    return () => {
      if (player) {
        player.disconnect();
      }
      document.body.removeChild(script);
    };
  }, [spotifyTokens?.access_token, refreshSpotifyTokens]);

  // Play a specific playlist
  const playPlaylist = useCallback(
    async (playlistUri: string, positionMs = 0) => {
      if (!deviceId) return;

      try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${spotifyTokens?.access_token}`,
          },
          body: JSON.stringify({
            context_uri: playlistUri,
            position_ms: positionMs,
          }),
        });
      } catch (error) {
        console.error('Error playing playlist:', error);
        setPlayerError(error instanceof Error ? error : new Error('Failed to play playlist'));
      }
    },
    [deviceId, spotifyTokens?.access_token]
  );

  // Play/pause toggle
  const togglePlay = useCallback(async () => {
    if (!player) return;

    try {
      await player.togglePlay();
    } catch (error) {
      console.error('Error toggling play state:', error);
      setPlayerError(error instanceof Error ? error : new Error('Failed to toggle play state'));
    }
  }, [player]);

  // Skip to next track
  const skipToNext = useCallback(async () => {
    if (!player) return;

    try {
      await player.nextTrack();
    } catch (error) {
      console.error('Error skipping to next track:', error);
      setPlayerError(error instanceof Error ? error : new Error('Failed to skip to next track'));
    }
  }, [player]);

  // Skip to previous track
  const skipToPrevious = useCallback(async () => {
    if (!player) return;

    try {
      await player.previousTrack();
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      setPlayerError(error instanceof Error ? error : new Error('Failed to skip to previous track'));
    }
  }, [player]);

  // Set volume
  const setPlayerVolume = useCallback(
    async (newVolume: number) => {
      if (!player) return;

      try {
        await player.setVolume(newVolume / 100);
        setVolume(newVolume);
      } catch (error) {
        console.error('Error setting volume:', error);
        setPlayerError(error instanceof Error ? error : new Error('Failed to set volume'));
      }
    },
    [player]
  );

  return {
    player,
    deviceId,
    isPlaying,
    currentTrack,
    playerError,
    volume,
    playPlaylist,
    togglePlay,
    skipToNext,
    skipToPrevious,
    setVolume: setPlayerVolume,
  };
};

export default useSpotifyPlayback; 