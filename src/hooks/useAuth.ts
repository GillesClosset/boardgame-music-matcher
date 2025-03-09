"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import supabase, { getCurrentUser } from '@/lib/supabase';
import { UserProfile, SpotifyTokens } from '@/types';
import React from 'react';

interface AuthContextType {
  user: UserProfile | null;
  spotifyTokens: SpotifyTokens | null;
  isLoading: boolean;
  signInWithSpotify: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSpotifyTokens: () => Promise<SpotifyTokens | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [spotifyTokens, setSpotifyTokens] = useState<SpotifyTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser as UserProfile);

        // Get Spotify tokens from localStorage
        const storedTokens = localStorage.getItem('spotify_tokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens) as SpotifyTokens;
          
          // Check if tokens are expired
          if (tokens.expires_at > Date.now()) {
            setSpotifyTokens(tokens);
          } else {
            // Tokens are expired, try to refresh
            await refreshSpotifyTokens();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user as UserProfile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSpotifyTokens(null);
          localStorage.removeItem('spotify_tokens');
        }
      }
    );

    initAuth();

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with Spotify
  const signInWithSpotify = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          scopes: 'user-read-email playlist-modify-private playlist-modify-public user-read-private streaming',
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
    } catch (error) {
      console.error('Error signing in with Spotify:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Refresh Spotify tokens
  const refreshSpotifyTokens = async (): Promise<SpotifyTokens | null> => {
    try {
      // This would typically call an API endpoint that handles token refresh
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh tokens');
      }
      
      const newTokens = await response.json();
      setSpotifyTokens(newTokens);
      localStorage.setItem('spotify_tokens', JSON.stringify(newTokens));
      return newTokens;
    } catch (error) {
      console.error('Error refreshing Spotify tokens:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    spotifyTokens,
    isLoading,
    signInWithSpotify,
    signOut,
    refreshSpotifyTokens,
  };

  // Use createElement instead of JSX
  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;