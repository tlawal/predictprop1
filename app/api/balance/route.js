import { NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';

    // Check cache
    const cacheKey = `balance:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Mock balance data - in production this would come from Supabase
    // This represents a user with a $5,000 challenge who has made some profits
    const initialBalance = 5000;
    const currentBalance = 5425; // $425 profit

    const result = {
      userId: userId,
      balance: currentBalance,
      initialBalance: initialBalance,
      totalPnL: currentBalance - initialBalance,
      challengeSize: initialBalance,
      challengeStartDate: '2025-01-01T00:00:00Z',
      lastUpdated: new Date().toISOString(),

      // Demo challenge status
      phase: 1,
      phase1Complete: false,
      phase2Unlocked: false,
      fundedAccount: false,

      // Performance metrics
      totalTrades: 4,
      winningTrades: 3,
      losingTrades: 1,
      winRate: 75,

      // Risk metrics
      maxDrawdown: 125,
      currentDrawdown: 0,
      maxExposure: 550, // Max position value
      currentExposure: 325
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch balance',
        message: error.message,
        balance: 0,
        initialBalance: 5000,
        totalPnL: 0,
        challengeSize: 5000
      },
      { status: 500 }
    );
  }
}
