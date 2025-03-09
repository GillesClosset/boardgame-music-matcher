import { NextRequest, NextResponse } from 'next/server';
import { searchBoardGames } from '@/lib/boardgamegeek';
import { parseStringPromise } from 'xml2js';
import { BoardGameSearchResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get the search query from the URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Search for board games
    const xmlResponse = await searchBoardGames(query);
    
    // Parse the XML response
    let results: BoardGameSearchResult[] = [];
    
    // If the response is a string (XML), parse it
    if (typeof xmlResponse === 'string') {
      const parsedData = await parseStringPromise(xmlResponse, {
        explicitArray: false,
        mergeAttrs: true,
      });
      
      // Handle case where no items are found
      if (!parsedData.items.item) {
        return NextResponse.json([]);
      }
      
      // Handle case where only one item is found (not returned as array)
      const items = Array.isArray(parsedData.items.item)
        ? parsedData.items.item
        : [parsedData.items.item];
      
      // Map the items to the expected format
      results = items.map((item: any) => ({
        id: item.id,
        name: item.name?.value || item.name || '',
        yearpublished: item.yearpublished?.value || '',
        thumbnail: item.thumbnail || '',
      }));
    } else {
      // If the response is already parsed (array of items)
      results = xmlResponse.map((item: any) => ({
        id: item.id,
        name: item.name?.value || item.name || '',
        yearpublished: item.yearpublished?.value || '',
        thumbnail: item.thumbnail || '',
      }));
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching board games:', error);
    return NextResponse.json(
      { error: 'Failed to search board games' },
      { status: 500 }
    );
  }
} 