'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/lib/supabase';
import SpotifyWebApi from 'spotify-web-api-node';

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
});

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [setupStatus, setSetupStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback initiated');
        
        // Check for error in URL
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const errorCode = searchParams.get('error_code');
        
        if (errorParam || errorDescription || errorCode) {
          console.error('Auth error in URL:', { errorParam, errorDescription, errorCode });
          
          // Redirect to home with error parameters
          const errorQuery = new URLSearchParams();
          if (errorParam) errorQuery.set('error', errorParam);
          if (errorDescription) errorQuery.set('error_description', errorDescription);
          if (errorCode) errorQuery.set('error_code', errorCode);
          
          router.push(`/?${errorQuery.toString()}`);
          return;
        }
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/?error=session_error&error_description=Error+retrieving+session');
          return;
        }
        
        if (!session) {
          console.error('No session found');
          router.push('/?error=not_authenticated&error_description=No+session+found');
          return;
        }

        console.log('Session retrieved successfully');
        
        // Get the Spotify access token from the session
        const provider_token = session.provider_token;
        const provider_refresh_token = session.provider_refresh_token;
        
        if (!provider_token || !provider_refresh_token) {
          console.error('Spotify tokens not found in session');
          router.push('/?error=missing_tokens&error_description=Spotify+tokens+not+found');
          return;
        }

        console.log('Spotify tokens retrieved successfully');
        
        // Call the setup endpoint to ensure database tables exist
        try {
          setSetupStatus('Setting up database...');
          const setupResponse = await fetch('/api/setup');
          const setupData = await setupResponse.json();
          console.log('Database setup response:', setupData);
          setSetupStatus('Database setup complete');
        } catch (setupError) {
          console.error('Error setting up database:', setupError);
          setSetupStatus('Database setup failed, but continuing...');
        }
        
        // Set the tokens on the Spotify API object
        spotifyApi.setAccessToken(provider_token);
        
        try {
          // Get the user's Spotify profile
          const userProfile = await spotifyApi.getMe();
          console.log('Spotify profile retrieved:', userProfile.body.id);
          
          // First, check if the profiles table exists
          const { error: tableCheckError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
            
          if (tableCheckError) {
            console.error('Error checking profiles table:', tableCheckError);
            // Continue with authentication even if profile check fails
          }
          
          // Update the user's profile with Spotify information
          console.log('Updating profile for user:', session.user.id);
          
          // First, try to insert a new profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              spotify_id: userProfile.body.id,
              display_name: userProfile.body.display_name || 'Spotify User',
              avatar_url: userProfile.body.images?.[0]?.url || null,
              updated_at: new Date().toISOString(),
            })
            .select();
            
          if (insertError) {
            console.log('Insert error (likely profile already exists):', insertError);
            
            // If insert fails (likely because profile already exists), try update
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                spotify_id: userProfile.body.id,
                display_name: userProfile.body.display_name || 'Spotify User',
                avatar_url: userProfile.body.images?.[0]?.url || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', session.user.id);
              
            if (updateError) {
              console.error('Error updating profile:', updateError);
              // Continue with authentication even if profile update fails
            } else {
              console.log('Profile updated successfully');
            }
          } else {
            console.log('Profile created successfully');
          }
        } catch (spotifyError) {
          console.error('Error getting Spotify profile:', spotifyError);
          // Continue with authentication even if Spotify profile retrieval fails
        }
        
        // Calculate the expiration time (typically 1 hour for Spotify)
        const expiresAt = Date.now() + 3600 * 1000;
        
        // Store tokens in localStorage
        localStorage.setItem('spotify_tokens', JSON.stringify({
          access_token: provider_token,
          refresh_token: provider_refresh_token,
          expires_at: expiresAt
        }));
        
        console.log('Authentication completed successfully, redirecting to dashboard');
        
        // Redirect to the dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Error processing callback:', error);
        router.push('/?error=spotify_callback_error&error_description=Error+processing+authentication');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-900 to-purple-900 text-white">
        <div className="bg-red-500 text-white p-4 rounded-md mb-6 max-w-md">
          <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
          <p>{error}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="bg-white text-blue-900 font-bold py-2 px-4 rounded"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-900 to-purple-900 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Authentication</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="mt-4">Please wait while we complete your authentication...</p>
        {setupStatus && <p className="mt-2 text-sm opacity-80">{setupStatus}</p>}
      </div>
    </div>
  );
} 