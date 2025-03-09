"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BoardGameSearchResult } from '@/types';

export const useBoardGameSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<BoardGameSearchResult | null>(null);

  // Search for board games
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
    refetch,
  } = useQuery({
    queryKey: ['boardGameSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        return [];
      }
      
      const response = await fetch(`/api/boardgame/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search for board games');
      }
      
      return response.json() as Promise<BoardGameSearchResult[]>;
    },
    enabled: !!searchQuery.trim(),
  });

  // Get board game details
  const {
    data: gameDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useQuery({
    queryKey: ['boardGameDetails', selectedGame?.id],
    queryFn: async () => {
      if (!selectedGame?.id) {
        return null;
      }
      
      const response = await fetch(`/api/boardgame/details?id=${selectedGame.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get board game details');
      }
      
      return response.json();
    },
    enabled: !!selectedGame?.id,
  });

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedGame(null);
  };

  // Handle game selection
  const handleSelectGame = (game: BoardGameSearchResult) => {
    setSelectedGame(game);
  };

  return {
    searchQuery,
    searchResults: searchResults || [],
    selectedGame,
    gameDetails,
    isSearching,
    isLoadingDetails,
    searchError,
    detailsError,
    handleSearch,
    handleSelectGame,
    refetchSearch: refetch,
  };
};

export default useBoardGameSearch; 