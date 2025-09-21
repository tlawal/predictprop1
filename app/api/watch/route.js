import { NextResponse } from 'next/server';

// Simple in-memory cache for watched markets
const watchedMarkets = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request) {
  try {
    const { marketId, question, currentYesProb } = await request.json();

    if (!marketId) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }

    // Mock Supabase insert (in production, use actual Supabase client)
    const watchData = {
      id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      marketId,
      question,
      currentYesProb,
      watchedAt: new Date().toISOString(),
      threshold: 10, // 10% price change threshold
      userId: 'demo_user' // In production, get from auth
    };

    // Store in memory cache (in production, use Supabase)
    watchedMarkets.set(marketId, {
      ...watchData,
      expiresAt: Date.now() + CACHE_TTL
    });

    // Clean up expired entries
    for (const [key, value] of watchedMarkets.entries()) {
      if (value.expiresAt < Date.now()) {
        watchedMarkets.delete(key);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Market added to watchlist',
      watchId: watchData.id
    });

  } catch (error) {
    console.error('Watch market error:', error);
    return NextResponse.json(
      {
        error: 'Failed to watch market',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');

    if (marketId) {
      const watch = watchedMarkets.get(marketId);
      if (!watch || watch.expiresAt < Date.now()) {
        return NextResponse.json({ isWatching: false });
      }
      return NextResponse.json({
        isWatching: true,
        watchData: watch
      });
    }

    // Return all watched markets (for debugging)
    const activeWatches = [];
    for (const [key, value] of watchedMarkets.entries()) {
      if (value.expiresAt > Date.now()) {
        activeWatches.push(value);
      }
    }

    return NextResponse.json({
      watchedMarkets: activeWatches,
      total: activeWatches.length
    });

  } catch (error) {
    console.error('Get watch status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get watch status',
        message: error.message
      },
      { status: 500 }
    );
  }
}
