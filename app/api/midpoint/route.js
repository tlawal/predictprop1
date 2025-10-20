import { NextResponse } from 'next/server';
import polymarketService from '../../../lib/services/polymarket';
import { fetchWithBackoff } from '../../../lib/utils/fetchWithBackoff.js';

const MIDPOINT_TTL_SECONDS = 60;
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
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'ids query parameter is required' }, { status: 400 });
    }

    const tokenIds = idsParam
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (tokenIds.length === 0) {
      return NextResponse.json({ error: 'No valid token ids provided' }, { status: 400 });
    }

    const cacheKey = `midpoints:${tokenIds.sort().join(',')}`;
    const cached = await getCachedValue(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const midpoints = await polymarketService.fetchMultipleMidpoints(
      tokenIds,
      (url, options) => fetchWithBackoff(url, options)
    );

    await setCachedValue(cacheKey, midpoints, MIDPOINT_TTL_SECONDS);

    return NextResponse.json(midpoints);
  } catch (error) {
    console.error('Midpoint batch API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch midpoints',
        message: error.message
      },
      { status: 500 }
    );
  }
}
