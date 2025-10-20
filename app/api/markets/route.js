import { NextResponse } from 'next/server';
import polymarketService from '../../../lib/services/polymarket';
import { fetchWithBackoff } from '../../../lib/utils/fetchWithBackoff.js';

const METADATA_TTL_SECONDS = 1800; // 30 minutes
const memoryCache = new Map();

function getMemoryCache(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function setMemoryCache(key, value, ttlSeconds) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

function buildCacheKey(params) {
  return `markets:${JSON.stringify(params)}`;
}

async function getCachedValue(key) {
  if (global.redisClient) {
    try {
      const cached = await global.redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis read failed:', error.message);
    }
  }

  return getMemoryCache(key);
}

async function setCachedValue(key, value, ttlSeconds) {
  if (global.redisClient) {
    try {
      await global.redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.warn('Redis write failed:', error.message);
    }
  }

  setMemoryCache(key, value, ttlSeconds);
}

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

    // Advanced filtering parameters
    const minLiquidity = searchParams.get('minLiquidity');
    const maxLiquidity = searchParams.get('maxLiquidity');
    const minVolume = searchParams.get('minVolume');
    const maxVolume = searchParams.get('maxVolume');
    const minVolume24hr = searchParams.get('minVolume24hr');
    const maxVolume24hr = searchParams.get('maxVolume24hr');
    const minSpread = searchParams.get('minSpread');
    const maxSpread = searchParams.get('maxSpread');
    const minProbability = searchParams.get('minProbability');
    const maxProbability = searchParams.get('maxProbability');
    const categories = searchParams.get('categories')?.split(',') || [];
    const tags = searchParams.get('tags')?.split(',') || [];
    const status = searchParams.get('status')?.split(',') || [];
    const featured = searchParams.get('featured') === 'true';
    const restricted = searchParams.get('restricted') === 'true';
    const creator = searchParams.get('creator');
    const createdAfter = searchParams.get('createdAfter');
    const createdBefore = searchParams.get('createdBefore');
    const expiresBefore = searchParams.get('expiresBefore');

    const cacheKey = buildCacheKey({
      q,
      category,
      active,
      closed,
      order,
      limit,
      offset,
      minLiquidity,
      maxLiquidity,
      minVolume,
      maxVolume,
      minVolume24hr,
      maxVolume24hr,
      minSpread,
      maxSpread,
      minProbability,
      maxProbability,
      categories,
      tags,
      status,
      featured,
      restricted,
      creator,
      createdAfter,
      createdBefore,
      expiresBefore,
      ticker: isTicker,
      created_after,
      time_filter
    });

    const cachedResult = await getCachedValue(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
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
      const response = await fetchWithBackoff('https://gamma-api.polymarket.com/events?featured=true&closed=false&limit=40', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PolyProp/1.0'
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
      await setCachedValue(cacheKey, data, METADATA_TTL_SECONDS);

      return NextResponse.json(data);
    }

    // Fetch from Polymarket service for regular requests
    const data = await polymarketService.fetchMarkets({
      ...params,
      fetcher: fetchWithBackoff
    });

    // Apply advanced server-side filtering
    let markets = data.markets || [];

    // Time filtering (legacy)
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
    }

    // Advanced filtering
    markets = markets.filter(market => {
      // Categories filter
      if (categories.length > 0) {
        const marketCategories = [
          ...(market.categories || []),
          ...(market.tags || []),
          market.category
        ].filter(Boolean).map(c => c.toLowerCase());

        const hasMatchingCategory = categories.some(cat =>
          marketCategories.some(marketCat =>
            marketCat.includes(cat.toLowerCase())
          )
        );
        if (!hasMatchingCategory) return false;
      }

      // Tags filter
      if (tags.length > 0) {
        const marketTags = (market.tags || []).map(t => t.toLowerCase());
        const hasMatchingTag = tags.some(tag =>
          marketTags.some(marketTag =>
            marketTag.includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      // Status filter
      if (status.length > 0) {
        const marketStatus = market.closed ? 'closed' : 'open';
        if (!status.includes(marketStatus)) return false;
      }

      // Featured filter
      if (featured && !market.featured) return false;

      // Restricted filter
      if (restricted && !market.restricted) return false;

      // Creator filter
      if (creator && market.creator) {
        const creatorMatch = market.creator.toLowerCase().includes(creator.toLowerCase());
        if (!creatorMatch) return false;
      }

      // Liquidity filter
      if (minLiquidity || maxLiquidity) {
        const liquidity = parseFloat(market.liquidity || market.openInterest || 0);
        if (minLiquidity && liquidity < parseFloat(minLiquidity)) return false;
        if (maxLiquidity && liquidity > parseFloat(maxLiquidity)) return false;
      }

      // Volume filter
      if (minVolume || maxVolume) {
        const volume = parseFloat(market.volume || 0);
        if (minVolume && volume < parseFloat(minVolume)) return false;
        if (maxVolume && volume > parseFloat(maxVolume)) return false;
      }

      // 24h Volume filter
      if (minVolume24hr || maxVolume24hr) {
        const volume24hr = parseFloat(market.volume24hr || market.volume || 0);
        if (minVolume24hr && volume24hr < parseFloat(minVolume24hr)) return false;
        if (maxVolume24hr && volume24hr > parseFloat(maxVolume24hr)) return false;
      }

      // Spread filter (calculate from outcomePrices)
      if (maxSpread) {
        const outcomePrices = market.outcomePrices || [];
        if (outcomePrices.length >= 2) {
          const spread = Math.abs(outcomePrices[0] - outcomePrices[1]) * 100; // Convert to percentage
          if (spread > parseFloat(maxSpread)) return false;
        }
      }

      // Probability filter (Yes probability)
      if (minProbability || maxProbability) {
        const probability = (market.yesOdds || market.outcomePrices?.[0] || 0.5) * 100;
        if (minProbability && probability < parseFloat(minProbability)) return false;
        if (maxProbability && probability > parseFloat(maxProbability)) return false;
      }

      // Date filters
      if (createdAfter) {
        const createdDate = new Date(market.createdAt || market.timestamp);
        if (createdDate < new Date(createdAfter)) return false;
      }

      if (createdBefore) {
        const createdDate = new Date(market.createdAt || market.timestamp);
        if (createdDate > new Date(createdBefore)) return false;
      }

      if (expiresBefore) {
        const endDate = new Date(market.endDate);
        if (endDate > new Date(expiresBefore)) return false;
      }

      return true;
    });

    // Update total count after filtering
    data.total = markets.length;
    data.markets = markets;

    // Ensure volume24hr field is present for sorting
    if (order.includes('volume24hr')) {
      markets.forEach(market => {
        if (market.volume24hr === undefined) {
          market.volume24hr = market.volume || 0;
        }
      });
    }

    await setCachedValue(cacheKey, data, METADATA_TTL_SECONDS);

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