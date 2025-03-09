import SpotifyWebApi from 'spotify-web-api-node';

// Initialize the Spotify API client with environment variables
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Helper function to set access token
export const setSpotifyAccessToken = (token: string) => {
  spotifyApi.setAccessToken(token);
};

// Helper function to set refresh token
export const setSpotifyRefreshToken = (token: string) => {
  spotifyApi.setRefreshToken(token);
};

// Helper function to refresh the access token
export const refreshSpotifyAccessToken = async () => {
  try {
    const data = await spotifyApi.refreshAccessToken();
    const accessToken = data.body.access_token;
    
    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(accessToken);
    
    return {
      accessToken,
      expiresIn: data.body.expires_in,
    };
  } catch (error) {
    console.error('Could not refresh access token', error);
    throw error;
  }
};

// Helper function to create a new playlist
export const createPlaylist = async (userId: string, name: string, description: string) => {
  try {
    const response = await spotifyApi.createPlaylist(name, { 
      description, 
      public: false 
    });
    return response.body;
  } catch (error) {
    console.error('Error creating playlist', error);
    throw error;
  }
};

// Helper function to add tracks to a playlist
export const addTracksToPlaylist = async (playlistId: string, trackUris: string[]) => {
  try {
    const response = await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
    return response.body;
  } catch (error) {
    console.error('Error adding tracks to playlist', error);
    throw error;
  }
};

// Helper function to search for tracks
export const searchTracks = async (query: string, limit = 20) => {
  try {
    const response = await spotifyApi.searchTracks(query, { limit });
    return response.body.tracks?.items || [];
  } catch (error) {
    console.error('Error searching tracks', error);
    throw error;
  }
};

// Helper function to get recommendations based on seed tracks, artists, genres
export const getRecommendations = async (options: {
  seed_tracks?: string[];
  seed_artists?: string[];
  seed_genres?: string[];
  target_energy?: number;
  target_valence?: number;
  target_tempo?: number;
  limit?: number;
}) => {
  try {
    const response = await spotifyApi.getRecommendations(options);
    return response.body.tracks;
  } catch (error) {
    console.error('Error getting recommendations', error);
    throw error;
  }
};

// Helper function to get user profile
export const getUserProfile = async () => {
  try {
    const response = await spotifyApi.getMe();
    return response.body;
  } catch (error) {
    console.error('Error getting user profile', error);
    throw error;
  }
};

export default spotifyApi; 