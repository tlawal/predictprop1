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
    const order = searchParams.get('order');
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

    // Build parameters for Polymarket service - only include defined values
    const params = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      tickerMode: isTicker || false
    };

    // Add optional parameters only if they have values
    if (q) params.q = q;
    if (category) params.category = category;
    if (active !== null) params.active = active === 'true';
    if (closed !== null) params.closed = closed === 'true';
    if (order) params.order = order;

    // Override parameters for ticker data
    if (isTicker) {
      // For ticker mode, fetch directly from Gamma API events endpoint
      console.log('Fetching ticker data from Gamma API events endpoint');
      const response = await fetch('https://gamma-api.polymarket.com/events?featured=true&closed=false&limit=40', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PredictProp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const events = await response.json();

      // Transform events to our format and return
      const transformedMarkets = events.map(event => ({
        id: event.id,
        slug: event.slug, // Preserve the slug field
        question: event.title || event.question,
        description: event.description,
        yesOdds: parseFloat(event.outcomePrices?.[0] || '0.5'),
        noOdds: parseFloat(event.outcomePrices?.[1] || '0.5'),
        volume: parseFloat(event.volume || 0),
        endDate: event.endDate,
        endDateIso: event.endDate ? new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        category: 'Featured',
        status: event.closed ? 'closed' : 'open',
        source: 'polymarket',
        url: `https://polymarket.com/event/${event.slug || event.id}`,
        featured: true
      }));

      const data = {
        markets: transformedMarkets,
        next: null,
        total: transformedMarkets.length
      };

      // Cache the result
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return NextResponse.json(data);
    }

    // Fetch from Polymarket service for regular requests
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