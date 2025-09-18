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
    const active = searchParams.get('active');
    const closed = searchParams.get('closed');
    const order = searchParams.get('order') || 'volume24hr,desc';
    const limit = searchParams.get('limit') || '20'; // Default to 20 markets per page
    const offset = searchParams.get('offset') || '0';
    const isTicker = searchParams.get('ticker') === 'true';

    // Build cache key
    const cacheKey = `markets:${q}:${category}:${active}:${closed}:${order}:${limit}:${offset}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Build parameters for Polymarket service
    const params = {
      q: q || undefined,
      category: category || undefined,
      active: active ? active === 'true' : undefined,
      closed: closed ? closed === 'true' : undefined,
      order: order || undefined,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      tickerMode: isTicker || false
    };

    // Override parameters for ticker data
    if (isTicker) {
      params.limit = 40; // Get 40 featured events for ticker
      params.tickerMode = true;
    }

    // Fetch from Polymarket
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