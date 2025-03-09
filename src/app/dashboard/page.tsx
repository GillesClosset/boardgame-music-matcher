'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase';

interface Playlist {
  id: string;
  name: string;
  description: string;
  board_game_name: string;
  spotify_playlist_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  board_game_id: string;
  board_game_image_url?: string;
  mood_settings?: Record<string, any>;
  tracks?: Record<string, any>[];
}

interface Profile {
  id: string;
  spotify_id?: string;
  display_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Fetch user profile and playlists
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // Try to create the profile if it doesn't exist
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                display_name: user.email?.split('@')[0] || 'User',
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();
              
            if (createError) {
              console.error('Error creating profile:', createError);
            } else {
              setProfile(newProfile);
            }
          } catch (createProfileError) {
            console.error('Error creating profile:', createProfileError);
          }
        } else {
          setProfile(profileData);
        }

        // Fetch user playlists
        const { data: playlistsData, error: playlistsError } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (playlistsError) {
          console.error('Error fetching playlists:', playlistsError);
          setError('Failed to load playlists');
        } else {
          setPlaylists(playlistsData || []);
        }
      } catch (error) {
        console.error('Error in dashboard data fetching:', error);
        setError('An error occurred while loading your dashboard');
      } finally {
        setIsLoadingPlaylists(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-900 to-purple-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        <p className="mt-4">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Welcome, {profile?.display_name || user?.email || 'User'}</h2>
          <p>
            Create playlists tailored to your board games and mood preferences.
          </p>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => router.push('/game/search')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Find a Game
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Your Saved Playlists</h2>
        
        {isLoadingPlaylists ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
            <p className="mt-2">Loading playlists...</p>
          </div>
        ) : playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist: any) => (
              <div key={playlist.id} className="bg-white/10 rounded-lg overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1">{playlist.name}</h3>
                  <p className="text-sm opacity-80 mb-2">For {playlist.board_game_name}</p>
                  <p className="text-sm mb-4">{playlist.description}</p>
                  <div className="flex justify-between">
                    <button
                      onClick={() => router.push(`/playlist/${playlist.id}`)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      View Details
                    </button>
                    {playlist.spotify_playlist_id && (
                      <a
                        href={`https://open.spotify.com/playlist/${playlist.spotify_playlist_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Open in Spotify
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-8 text-center">
            <p className="mb-4">You haven't created any playlists yet.</p>
            <button
              onClick={() => router.push('/game/search')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Create Your First Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 