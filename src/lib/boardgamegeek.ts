/**
 * BoardGameGeek API Client
 * 
 * This module provides functions to interact with the BoardGameGeek XML API.
 * https://boardgamegeek.com/wiki/page/BGG_XML_API2
 */

import { parseStringPromise } from 'xml2js';

// Base URL for the BoardGameGeek API
const BGG_API_BASE_URL = 'https://boardgamegeek.com/xmlapi2';

// Helper function to parse XML response
const parseXMLResponse = async (xml: string) => {
  try {
    const result = await parseStringPromise(xml, {
      explicitArray: false,
      mergeAttrs: true,
    });
    return result;
  } catch (error) {
    console.error('Error parsing XML', error);
    throw error;
  }
};

// Function to search for board games
export const searchBoardGames = async (query: string) => {
  try {
    const response = await fetch(`${BGG_API_BASE_URL}/search?query=${encodeURIComponent(query)}&type=boardgame`);
    const xml = await response.text();
    const data = await parseXMLResponse(xml);
    
    // Handle case where no items are found
    if (!data.items.item) {
      return [];
    }
    
    // Handle case where only one item is found (not returned as array)
    const items = Array.isArray(data.items.item) ? data.items.item : [data.items.item];
    return items;
  } catch (error) {
    console.error('Error searching board games', error);
    throw error;
  }
};

// Function to get detailed information about a board game
export const getBoardGameDetails = async (gameId: string) => {
  try {
    const response = await fetch(`${BGG_API_BASE_URL}/thing?id=${gameId}&stats=1`);
    const xml = await response.text();
    const data = await parseXMLResponse(xml);
    
    // Handle case where the game is not found
    if (!data.items.item) {
      return null;
    }
    
    // Handle case where multiple games are returned (we just take the first one)
    const gameData = Array.isArray(data.items.item) ? data.items.item[0] : data.items.item;
    return gameData;
  } catch (error) {
    console.error('Error getting board game details', error);
    throw error;
  }
};

// Interface for game attributes
export interface GameAttributes {
  name: string;
  description: string;
  categories: string[];
  mechanics: string[];
  themes: string[];
  weight: number; // Complexity rating (1-5)
  yearPublished: number;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
}

// Function to extract game attributes for music matching
export const extractGameAttributes = (gameData: any): GameAttributes => {
  // Default attributes
  const attributes: GameAttributes = {
    name: '',
    description: '',
    categories: [],
    mechanics: [],
    themes: [],
    weight: 0, // Complexity rating (1-5)
    yearPublished: 0,
    minPlayers: 0,
    maxPlayers: 0,
    playingTime: 0,
  };
  
  try {
    // Extract basic information
    attributes.name = gameData.name?.value || (Array.isArray(gameData.name) ? gameData.name[0]?.value : '') || '';
    attributes.description = gameData.description || '';
    attributes.yearPublished = parseInt(gameData.yearpublished?.value || '0', 10);
    attributes.minPlayers = parseInt(gameData.minplayers?.value || '0', 10);
    attributes.maxPlayers = parseInt(gameData.maxplayers?.value || '0', 10);
    attributes.playingTime = parseInt(gameData.playingtime?.value || '0', 10);
    
    // Extract weight/complexity
    if (gameData.statistics?.ratings?.averageweight?.value) {
      attributes.weight = parseFloat(gameData.statistics.ratings.averageweight.value);
    }
    
    // Extract categories, mechanics, and themes
    if (gameData.link) {
      // Ensure link is an array
      const links = Array.isArray(gameData.link) ? gameData.link : [gameData.link];
      
      links.forEach((link: any) => {
        const type = link.type;
        const value = link.value;
        
        if (type === 'boardgamecategory') {
          attributes.categories.push(value);
        } else if (type === 'boardgamemechanic') {
          attributes.mechanics.push(value);
        } else if (type === 'boardgamefamily' && value.toLowerCase().includes('theme')) {
          attributes.themes.push(value);
        }
      });
    }
    
    return attributes;
  } catch (error) {
    console.error('Error extracting game attributes', error);
    return attributes;
  }
};

// Interface for music parameters
export interface MusicParameters {
  genres: string[];
  energy: number; // 0.0 to 1.0
  valence: number; // 0.0 to 1.0 (happiness)
  tempo: number; // BPM
  instrumentalness: number; // 0.0 to 1.0
  acousticness: number; // 0.0 to 1.0
}

// Interface for mood settings
export interface MoodSettings {
  energy?: number;
  valence?: number;
  tempo?: number;
  instrumentalness?: number;
  acousticness?: number;
}

// Function to map game attributes to music parameters
export const mapGameToMusicParameters = (gameAttributes: GameAttributes, moodSettings?: MoodSettings): MusicParameters => {
  // Default music parameters
  const musicParams: MusicParameters = {
    genres: [],
    energy: 0.5, // 0.0 to 1.0
    valence: 0.5, // 0.0 to 1.0 (happiness)
    tempo: 120, // BPM
    instrumentalness: 0.5, // 0.0 to 1.0
    acousticness: 0.5, // 0.0 to 1.0
  };
  
  // Map game weight to energy
  musicParams.energy = Math.min(0.9, 0.3 + (gameAttributes.weight / 5) * 0.6);
  
  // Map categories to genres
  const categoryToGenreMap: Record<string, string[]> = {
    'Fantasy': ['fantasy', 'folk', 'celtic'],
    'Science Fiction': ['electronic', 'ambient', 'synth-pop'],
    'Economic': ['classical', 'jazz', 'lounge'],
    'Wargame': ['rock', 'metal', 'orchestral'],
    'Adventure': ['soundtrack', 'world', 'folk'],
    'Fighting': ['rock', 'metal', 'electronic'],
    'Medieval': ['classical', 'folk', 'world'],
    'Civilization': ['world', 'classical', 'new-age'],
    'Horror': ['dark-ambient', 'industrial', 'experimental'],
    'Party Game': ['pop', 'dance', 'funk'],
    'Puzzle': ['ambient', 'classical', 'jazz'],
    'Abstract Strategy': ['minimal', 'ambient', 'classical'],
    'Dice': ['jazz', 'funk', 'pop'],
    'Card Game': ['acoustic', 'folk', 'pop'],
  };
  
  // Add genres based on categories
  gameAttributes.categories.forEach(category => {
    const matchedCategory = Object.keys(categoryToGenreMap).find(
      key => category.toLowerCase().includes(key.toLowerCase())
    );
    
    if (matchedCategory) {
      musicParams.genres.push(...categoryToGenreMap[matchedCategory]);
    }
  });
  
  // Remove duplicates
  musicParams.genres = [...new Set(musicParams.genres)];
  
  // Apply mood settings (if provided)
  if (moodSettings) {
    if (typeof moodSettings.energy === 'number') {
      musicParams.energy = moodSettings.energy;
    }
    
    if (typeof moodSettings.valence === 'number') {
      musicParams.valence = moodSettings.valence;
    }
    
    if (typeof moodSettings.tempo === 'number') {
      musicParams.tempo = moodSettings.tempo;
    }
    
    if (typeof moodSettings.instrumentalness === 'number') {
      musicParams.instrumentalness = moodSettings.instrumentalness;
    }
    
    if (typeof moodSettings.acousticness === 'number') {
      musicParams.acousticness = moodSettings.acousticness;
    }
  }
  
  return musicParams;
};

export default {
  searchBoardGames,
  getBoardGameDetails,
  extractGameAttributes,
  mapGameToMusicParameters,
}; 