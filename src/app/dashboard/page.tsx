'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Handle token extraction from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const expiresAt = urlParams.get('expires_at');

    if (accessToken && refreshToken && expiresAt) {
      // Store tokens in localStorage
      localStorage.setItem(
        'spotify_tokens',
        JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
        })
      );

      // Remove tokens from URL
      router.replace('/dashboard');
    }
  }, [router]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold">Board Game Music Matcher</h1>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="hidden md:inline">
                  Hello, {user.user_metadata?.full_name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Playlist</h2>
            <p className="mb-6 text-gray-600">
              Search for a board game, adjust your mood settings, and generate a custom playlist.
            </p>
            <Link
              href="/game/search"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block transition-colors"
            >
              Get Started
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Your Saved Playlists</h2>
            <p className="mb-6 text-gray-600">
              View and play your previously generated playlists.
            </p>
            <Link
              href="/playlist/history"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg inline-block transition-colors"
            >
              View Playlists
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="font-bold mb-2">Search for a Game</h3>
              <p className="text-gray-600">
                Find your favorite board game from our extensive database.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="font-bold mb-2">Adjust Your Mood</h3>
              <p className="text-gray-600">
                Set the energy level, emotional tone, and other parameters.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="font-bold mb-2">Enjoy Your Playlist</h3>
              <p className="text-gray-600">
                Get a custom Spotify playlist that matches your game and mood.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>
            Board Game Music Matcher &copy; {new Date().getFullYear()}. Not affiliated with Spotify or BoardGameGeek.
          </p>
        </div>
      </footer>
    </div>
  );
} 