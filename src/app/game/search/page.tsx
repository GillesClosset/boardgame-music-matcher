'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoardGameSearch } from '@/hooks/useBoardGameSearch';
import Link from 'next/link';

export default function GameSearch() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const {
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    handleSearch,
    handleSelectGame,
  } = useBoardGameSearch();

  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      handleSearch(searchInput.trim());
    }
  };

  // Handle game selection
  const handleGameSelect = (gameId: string, gameName: string) => {
    router.push(`/game/${gameId}?name=${encodeURIComponent(gameName)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">
            Board Game Music Matcher
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden md:inline">
                {user.user_metadata?.full_name || user.email}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold mb-6">Search for a Board Game</h1>
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter board game name..."
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={isSearching || !searchInput.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:bg-blue-300"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              Error searching for games: {searchError.message}
            </div>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                No games found matching "{searchQuery}".
              </p>
              <p className="text-gray-500">
                Try a different search term or check the spelling.
              </p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Search Results for "{searchQuery}"
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((game) => (
                  <div
                    key={game.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleGameSelect(game.id, game.name)}
                  >
                    <div className="flex items-start gap-4">
                      {game.thumbnail && (
                        <img
                          src={game.thumbnail}
                          alt={game.name}
                          className="w-20 h-20 object-contain"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{game.name}</h3>
                        {game.yearpublished && (
                          <p className="text-gray-500">
                            Published: {game.yearpublished}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>
            Board Game Music Matcher &copy; {new Date().getFullYear()}. Not
            affiliated with Spotify or BoardGameGeek.
          </p>
        </div>
      </footer>
    </div>
  );
} 