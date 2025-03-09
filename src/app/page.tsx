'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading, signInWithSpotify } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Check for error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'missing_code':
          setError('Authentication failed: Missing authorization code');
          break;
        case 'not_authenticated':
          setError('Authentication failed: User not authenticated');
          break;
        case 'spotify_callback_error':
          setError('Authentication failed: Error processing Spotify callback');
          break;
        default:
          setError(`Authentication failed: ${errorParam}`);
      }
    }
  }, []);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Handle Spotify login
  const handleLogin = async () => {
    try {
      await signInWithSpotify();
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to sign in with Spotify');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-900 to-purple-900 text-white">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Board Game Music Matcher
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          Create the perfect Spotify playlist for your board game session based on the game and your mood.
        </p>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors flex items-center"
          >
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                <svg
                  className="w-6 h-6 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Connect with Spotify
              </>
            )}
          </button>

          <div className="mt-8 text-sm opacity-80">
            <p>
              By connecting, you allow this app to create playlists in your Spotify account.
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3">Find Your Game</h2>
            <p>
              Search for any board game from our extensive database powered by BoardGameGeek.
            </p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3">Set Your Mood</h2>
            <p>
              Adjust energy levels, emotional tone, and other parameters to match your desired atmosphere.
            </p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3">Enjoy Your Playlist</h2>
            <p>
              Get a perfectly matched Spotify playlist that enhances your gaming experience.
            </p>
          </div>
        </div>

        <footer className="mt-16 text-sm opacity-70">
          <p>
            Not affiliated with Spotify or BoardGameGeek. Created for board game enthusiasts.
          </p>
        </footer>
      </div>
    </main>
  );
}
