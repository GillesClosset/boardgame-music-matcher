import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PlaylistGenerationResult } from '@/types';
import { MoodSettings } from '@/lib/boardgamegeek';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const body = await request.json() as PlaylistGenerationResult & { 
      moodSettings?: MoodSettings;
      gameId?: string;
    };
    const { playlist, gameAttributes, musicParameters, moodSettings, gameId } = body;
    
    if (!playlist || !gameAttributes || !musicParameters) {
      return NextResponse.json(
        { error: 'Playlist, game attributes, and music parameters are required' },
        { status: 400 }
      );
    }
    
    // Save the playlist to the database
    const { data: savedPlaylist, error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        spotify_playlist_id: playlist.id,
        game_id: gameId || '',
        game_name: gameAttributes.name,
        mood_settings: moodSettings || {},
        music_parameters: musicParameters,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(savedPlaylist);
  } catch (error) {
    console.error('Error saving playlist:', error);
    return NextResponse.json(
      { error: 'Failed to save playlist' },
      { status: 500 }
    );
  }
} 