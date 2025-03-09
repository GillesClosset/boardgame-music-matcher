'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePlaylistGeneration } from '@/hooks/usePlaylistGeneration';
import Link from 'next/link';
import { GameAttributes, MoodSettings } from '@/lib/boardgamegeek';

export default function GameDetails({ params }: { params: { id: string } }) {
  const { user, isLoading: authLoading, spotifyTokens } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameName = searchParams.get('name') || 'Board Game';
  
  const [gameDetails, setGameDetails] = useState<GameAttributes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    moodSettings,
    updateMoodSettings,
    generatePlaylist,
    generatedPlaylist,
    isGenerating,
    generationError,
  } = usePlaylistGeneration();

  // Fetch game details
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/boardgame/details?id=${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch game details');
        }
        
        const data = await response.json();
        setGameDetails(data);
      } catch (error) {
        console.error('Error fetching game details:', error);
        setError('Failed to load game details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [params.id]);

  // Redirect to playlist page when playlist is generated
  useEffect(() => {
    if (generatedPlaylist) {
      router.push(`/playlist/${generatedPlaylist.playlist.id}`);
    }
  }, [generatedPlaylist, router]);

  // Handle playlist generation
  const handleGeneratePlaylist = async () => {
    if (!spotifyTokens) {
      setError('Spotify authentication required. Please sign in again.');
      return;
    }
    
    try {
      await generatePlaylist({
        gameId: params.id,
        gameName: gameName,
        trackCount: 20,
      });
    } catch (error) {
      console.error('Error generating playlist:', error);
      setError('Failed to generate playlist. Please try again.');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">
            Board Game Music Matcher
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/game/search"
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded transition-colors"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {generationError && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            Error generating playlist: {generationError.message}
          </div>
        )}

        {gameDetails && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-2/3">
                <h1 className="text-3xl font-bold mb-2">{gameDetails.name}</h1>
                
                {gameDetails.yearPublished > 0 && (
                  <p className="text-gray-500 mb-4">
                    Published: {gameDetails.yearPublished}
                  </p>
                )}
                
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">About this Game</h2>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: gameDetails.description }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold mb-1">Players</h3>
                    <p>{gameDetails.minPlayers} - {gameDetails.maxPlayers}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">Playing Time</h3>
                    <p>{gameDetails.playingTime} minutes</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">Complexity</h3>
                    <p>{gameDetails.weight.toFixed(1)} / 5</p>
                  </div>
                </div>
                
                {gameDetails.categories.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-1">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {gameDetails.categories.map((category, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {gameDetails.mechanics.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">Mechanics</h3>
                    <div className="flex flex-wrap gap-2">
                      {gameDetails.mechanics.map((mechanic, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                        >
                          {mechanic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="md:w-1/3">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Mood Settings</h2>
                  <p className="text-gray-600 mb-6">
                    Adjust these settings to match your desired mood for the playlist.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block mb-2 font-medium">
                        Energy Level: {(moodSettings.energy * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={moodSettings.energy}
                        onChange={(e) => updateMoodSettings({ energy: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Calm</span>
                        <span>Energetic</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-2 font-medium">
                        Mood: {(moodSettings.valence * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={moodSettings.valence}
                        onChange={(e) => updateMoodSettings({ valence: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Melancholic</span>
                        <span>Happy</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-2 font-medium">
                        Instrumentalness: {(moodSettings.instrumentalness * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={moodSettings.instrumentalness}
                        onChange={(e) => updateMoodSettings({ instrumentalness: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Vocal</span>
                        <span>Instrumental</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-2 font-medium">
                        Acousticness: {(moodSettings.acousticness * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={moodSettings.acousticness}
                        onChange={(e) => updateMoodSettings({ acousticness: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Electronic</span>
                        <span>Acoustic</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleGeneratePlaylist}
                      disabled={isGenerating}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-green-300"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Playlist'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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