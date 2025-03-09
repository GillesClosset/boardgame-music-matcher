import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import SpotifyWebApi from 'spotify-web-api-node';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(new URL('/?error=missing_code', request.url));
    }
    
    // Exchange the code for access and refresh tokens
    const data = await spotifyApi.authorizationCodeGrant(code);
    
    // Get the tokens
    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;
    const expiresIn = data.body.expires_in;
    
    // Set the tokens on the Spotify API object
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);
    
    // Get the user's Spotify profile
    const userProfile = await spotifyApi.getMe();
    
    // Get the current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(new URL('/?error=not_authenticated', request.url));
    }
    
    // Update the user's profile with Spotify information
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        spotify_id: userProfile.body.id,
        display_name: userProfile.body.display_name,
        avatar_url: userProfile.body.images?.[0]?.url,
        updated_at: new Date().toISOString(),
      });
    
    // Calculate the expiration time
    const expiresAt = Date.now() + expiresIn * 1000;
    
    // Redirect to the dashboard with tokens in the URL
    // These will be extracted by the client and stored in localStorage
    return NextResponse.redirect(
      new URL(
        `/dashboard?access_token=${accessToken}&refresh_token=${refreshToken}&expires_at=${expiresAt}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    return NextResponse.redirect(new URL('/?error=spotify_callback_error', request.url));
  }
} 