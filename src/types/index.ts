import { User } from '@supabase/supabase-js';
import { GameAttributes, MusicParameters, MoodSettings } from '@/lib/boardgamegeek';

// User-related types
export interface UserProfile extends User {
  spotify_id?: string;
  display_name?: string;
  avatar_url?: string;
}

// Spotify-related types
export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  uri: string;
  duration_ms: number;
  preview_url: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
  tracks: {
    total: number;
    items?: Array<{ track: SpotifyTrack }>;
  };
  uri: string;
}

// Board game search result
export interface BoardGameSearchResult {
  id: string;
  name: string;
  yearpublished?: string;
  thumbnail?: string;
  description?: string;
}

// Playlist generation
export interface PlaylistGenerationRequest {
  gameId: string;
  gameName: string;
  moodSettings: MoodSettings;
  trackCount?: number;
}

export interface PlaylistGenerationResult {
  playlist: SpotifyPlaylist;
  gameAttributes: GameAttributes;
  musicParameters: MusicParameters;
  createdAt: string;
}

// Database models
export interface SavedPlaylist {
  id: string;
  user_id: string;
  spotify_playlist_id: string;
  game_id: string;
  game_name: string;
  mood_settings: MoodSettings;
  music_parameters: MusicParameters;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  favorite_genres: string[];
  default_mood_settings: MoodSettings;
  created_at: string;
  updated_at: string;
} 