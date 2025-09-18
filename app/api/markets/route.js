import { NextResponse } from 'next/server';
import polymarketService from '../../../lib/services/polymarket';

// Simple in-memory cache (in production, use Redis)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || 'open'; // Default to open/active markets
    const limit = searchParams.get('limit') || '50'; // Default to 50 markets
    const cursor = searchParams.get('cursor') || '';
    const isTicker = searchParams.get('ticker') === 'true';

    // Build cache key
    const cacheKey = `markets:${q}:${category}:${status}:${limit}:${cursor}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch from Polymarket - request more to get better selection
    let params = {
      q: q || undefined,
      category: category || undefined,
      status: status || undefined,
      limit: Math.min(parseInt(limit) || 100, 500), // Request more from Polymarket (up to 500)
      cursor: cursor || undefined
    };

    // Override parameters for ticker data
    if (isTicker) {
      params = {
        ...params,
        limit: 40, // Get 40 featured events
        tickerMode: true // Special flag for ticker filtering
      };
    }

    const data = await polymarketService.fetchMarkets(params);

    // Cache the result
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 20).forEach(([key]) => cache.delete(key));
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Markets API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch markets',
        message: error.message,
        markets: [],
        next: null,
        total: 0
      },
      { status: 500 }
    );
  }
}