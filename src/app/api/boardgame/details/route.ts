import { NextRequest, NextResponse } from 'next/server';
import { getBoardGameDetails, extractGameAttributes } from '@/lib/boardgamegeek';
import { parseStringPromise } from 'xml2js';

export async function GET(request: NextRequest) {
  try {
    // Get the game ID from the URL
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }
    
    // Get the board game details
    const gameData = await getBoardGameDetails(id);
    
    // If no game was found
    if (!gameData) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // If the response is a string (XML), parse it
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
      const gameDetails = Array.isArray(parsedData.items.item)
        ? parsedData.items.item[0]
        : parsedData.items.item;
      
      // Extract the game attributes
      const gameAttributes = extractGameAttributes(gameDetails);
      
      return NextResponse.json(gameAttributes);
    }
    
    // If the response is already parsed
    const gameAttributes = extractGameAttributes(gameData);
    
    return NextResponse.json(gameAttributes);
  } catch (error) {
    console.error('Error getting board game details:', error);
    return NextResponse.json(
      { error: 'Failed to get board game details' },
      { status: 500 }
    );
  }
} 