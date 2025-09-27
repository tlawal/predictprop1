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
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const isTicker = searchParams.get('ticker') === 'true';
    const created_after = searchParams.get('created_after');
    const time_filter = searchParams.get('time_filter');

    // Build cache key
    const cacheKey = `markets:${q}:${category}:${active}:${closed}:${order}:${limit}:${offset}:${created_after}:${time_filter}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Build parameters for Polymarket service
    const params = {
      limit,
      offset,
      tickerMode: isTicker || false
    };

    // Add optional parameters only if they have values
    if (q) params.q = q;
    if (category) params.category = category;
    if (active !== null) params.active = active === 'true';
    if (closed !== null) params.closed = closed === 'true';
    if (order) params.order = order;
    if (created_after) params.created_after = created_after;

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
        volume24hr: parseFloat(event.volume24hr || 0),
        endDate: event.endDate,
        endDateIso: event.endDate ? new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        category: 'Featured',
        status: event.closed ? 'closed' : 'open',
        source: 'polymarket',
        url: `https://polymarket.com/event/${event.slug || event.id}`,
        featured: true,
        icon: event.iconOptimized?.imageUrlOptimized || event.icon || event.imageOptimized?.imageUrlOptimized
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

    // Apply client-side time filtering if needed
    let markets = data.markets || [];
    if (time_filter) {
      const now = new Date();
      markets = markets.filter(market => {
        if (!market.endDate) return false;
        const endDate = new Date(market.endDate);
        const daysDiff = (endDate - now) / (1000 * 60 * 60 * 24);

        switch (time_filter) {
          case 'upcoming_1wk':
            return daysDiff >= 0 && daysDiff <= 7;
          case '1_4wk':
            return daysDiff > 7 && daysDiff <= 28;
          default:
            return true;
        }
      });

      // Update total count after filtering
      data.total = markets.length;
      data.markets = markets;
    }

    // Ensure volume24hr field is present for sorting
    if (order.includes('volume24hr')) {
      markets.forEach(market => {
        if (market.volume24hr === undefined) {
          market.volume24hr = market.volume || 0;
        }
      });
    }

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