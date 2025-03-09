import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import SpotifyWebApi from 'spotify-web-api-node';
import { getBoardGameDetails, extractGameAttributes, mapGameToMusicParameters } from '@/lib/boardgamegeek';
import { parseStringPromise } from 'xml2js';
import { PlaylistGenerationRequest, PlaylistGenerationResult, SpotifyPlaylist } from '@/types';

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

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await request.json() as PlaylistGenerationRequest;
    const { gameId, gameName, moodSettings, trackCount = 20 } = body;
    
    if (!gameId || !gameName) {
      return NextResponse.json(
        { error: 'Game ID and name are required' },
        { status: 400 }
      );
    }
    
    // Get the access token from the request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }
    
    const accessToken = authHeader.substring(7);
    spotifyApi.setAccessToken(accessToken);
    
    // Get the board game details
    const gameData = await getBoardGameDetails(gameId);
    
    // If no game was found
    if (!gameData) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Parse the game data if it's a string (XML)
    let gameDetails;
    if (typeof gameData === 'string') {
      const parsedData = await parseStringPromise(gameData, {
        explicitArray: false,
        mergeAttrs: true,
      });
      
      // Handle case where the game is not found
      if (!parsedData.items.item) {
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        );
      }
      
      // Handle case where multiple games are returned (we just take the first one)
      gameDetails = Array.isArray(parsedData.items.item)
        ? parsedData.items.item[0]
        : parsedData.items.item;
    } else {
      gameDetails = gameData;
    }
    
    // Extract the game attributes
    const gameAttributes = extractGameAttributes(gameDetails);
    
    // Map the game attributes to music parameters
    const musicParameters = mapGameToMusicParameters(gameAttributes, moodSettings);
    
    // Get the user's Spotify profile
    const userProfile = await spotifyApi.getMe();
    
    // Create a new playlist
    const playlistName = `${gameName} - Board Game Music`;
    const playlistDescription = `A playlist for ${gameName} based on the game's attributes and your mood settings.`;
    
    const playlist = await spotifyApi.createPlaylist(playlistName, {
      description: playlistDescription,
      public: false,
    });
    
    // Get recommendations based on the music parameters
    const recommendations = await spotifyApi.getRecommendations({
      seed_genres: musicParameters.genres.slice(0, 5), // Spotify only allows up to 5 seed genres
      target_energy: musicParameters.energy,
      target_valence: musicParameters.valence,
      target_tempo: musicParameters.tempo,
      target_instrumentalness: musicParameters.instrumentalness,
      target_acousticness: musicParameters.acousticness,
      limit: trackCount,
    });
    
    // Add the tracks to the playlist
    if (recommendations.body.tracks.length > 0) {
      const trackUris = recommendations.body.tracks.map(track => track.uri);
      await spotifyApi.addTracksToPlaylist(playlist.body.id, trackUris);
    }
    
    // Get the updated playlist with tracks
    const updatedPlaylist = await spotifyApi.getPlaylist(playlist.body.id);
    
    // Create the result with simplified playlist data
    const result: PlaylistGenerationResult = {
      playlist: {
        id: updatedPlaylist.body.id,
        name: updatedPlaylist.body.name,
        description: updatedPlaylist.body.description || '',
        images: updatedPlaylist.body.images.map(img => ({
          url: img.url,
          height: img.height || 0,
          width: img.width || 0,
        })),
        external_urls: updatedPlaylist.body.external_urls,
        tracks: {
          total: updatedPlaylist.body.tracks.total,
          items: updatedPlaylist.body.tracks.items?.map(item => {
            if (!item.track) return null;
            return {
              track: {
                id: item.track.id,
                name: item.track.name,
                artists: item.track.artists.map(artist => ({
                  id: artist.id,
                  name: artist.name,
                })),
                album: {
                  id: item.track.album.id,
                  name: item.track.album.name,
                  images: item.track.album.images.map(img => ({
                    url: img.url,
                    height: img.height || 0,
                    width: img.width || 0,
                  })),
                },
                uri: item.track.uri,
                duration_ms: item.track.duration_ms,
                preview_url: item.track.preview_url,
              },
            };
          }).filter(Boolean) as { track: any }[],
        },
        uri: updatedPlaylist.body.uri,
      },
      gameAttributes,
      musicParameters,
      createdAt: new Date().toISOString(),
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    );
  }
} 