import { NextRequest, NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export async function POST(request: NextRequest) {
  try {
    // Get the refresh token from the request body
    const body = await request.json();
    const refreshToken = body.refresh_token;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Set the refresh token on the Spotify API object
    spotifyApi.setRefreshToken(refreshToken);
    
    // Refresh the access token
    const data = await spotifyApi.refreshAccessToken();
    
    // Get the new tokens
    const accessToken = data.body.access_token;
    const expiresIn = data.body.expires_in;
    
    // Calculate the expiration time
    const expiresAt = Date.now() + expiresIn * 1000;
    
    // Return the new tokens
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken, // The refresh token doesn't change
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
} 