import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    // Check if the profiles table exists
    const { error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log('Profiles table does not exist or cannot be accessed:', checkError);
      
      // Create the profiles table
      const createProfilesTable = `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          spotify_id TEXT,
          display_name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
          ON public.profiles 
          FOR SELECT 
          USING (auth.uid() = id);
        
        CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
          ON public.profiles 
          FOR UPDATE 
          USING (auth.uid() = id);
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createProfilesTable });
      
      if (createError) {
        console.error('Error creating profiles table:', createError);
        return NextResponse.json({ error: 'Failed to create profiles table' }, { status: 500 });
      }
      
      // Create the playlists table
      const createPlaylistsTable = `
        CREATE TABLE IF NOT EXISTS public.playlists (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          spotify_playlist_id TEXT,
          board_game_id TEXT NOT NULL,
          board_game_name TEXT NOT NULL,
          board_game_image_url TEXT,
          mood_settings JSONB,
          tracks JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY IF NOT EXISTS "Users can view their own playlists" 
          ON public.playlists 
          FOR SELECT 
          USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can insert their own playlists" 
          ON public.playlists 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can update their own playlists" 
          ON public.playlists 
          FOR UPDATE 
          USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can delete their own playlists" 
          ON public.playlists 
          FOR DELETE 
          USING (auth.uid() = user_id);
      `;
      
      const { error: createPlaylistsError } = await supabase.rpc('exec_sql', { sql: createPlaylistsTable });
      
      if (createPlaylistsError) {
        console.error('Error creating playlists table:', createPlaylistsError);
        return NextResponse.json({ error: 'Failed to create playlists table' }, { status: 500 });
      }
      
      // Create the trigger for new users
      const createTrigger = `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id)
          VALUES (NEW.id);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `;
      
      const { error: createTriggerError } = await supabase.rpc('exec_sql', { sql: createTrigger });
      
      if (createTriggerError) {
        console.error('Error creating trigger:', createTriggerError);
        return NextResponse.json({ error: 'Failed to create trigger' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'Database setup completed successfully' });
    }
    
    return NextResponse.json({ success: true, message: 'Database is already set up' });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ error: 'Failed to set up database' }, { status: 500 });
  }
} 