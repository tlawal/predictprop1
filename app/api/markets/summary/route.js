import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check Redis cache first
    let cachedData = null;
    if (global.redisClient) {
      try {
        cachedData = await global.redisClient.get('markets_summary');
        if (cachedData) {
          return NextResponse.json(JSON.parse(cachedData));
        }
      } catch (redisError) {
        console.warn('Redis cache read failed:', redisError.message);
      }
    }

    // Fetch from Polymarket Gamma API
    const gammaResponse = await fetch('https://gamma-api.polymarket.com/markets?limit=0&closed=false&active=true', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!gammaResponse.ok) {
      throw new Error(`Gamma API error: ${gammaResponse.status}`);
    }

    const marketsData = await gammaResponse.json();

    // Aggregate data
    const totalMarkets = marketsData.length;
    const totalVolume24h = marketsData.reduce((sum, market) => {
      return sum + (market.volume24hr || 0);
    }, 0);

    const summaryData = {
      totalMarkets,
      totalVolume24h,
      lastUpdated: new Date().toISOString(),
    };

    // Cache in Redis for 5 minutes (300 seconds)
    if (global.redisClient) {
      try {
        await global.redisClient.setex('markets_summary', 300, JSON.stringify(summaryData));
      } catch (redisError) {
        console.warn('Redis cache write failed:', redisError.message);
      }
    }

    return NextResponse.json(summaryData);
  } catch (error) {
    console.error('Error fetching markets summary:', error);

    // Return cached data if available, otherwise return error
    if (global.redisClient) {
      try {
        const cachedData = await global.redisClient.get('markets_summary');
        if (cachedData) {
          return NextResponse.json(JSON.parse(cachedData));
        }
      } catch (redisError) {
        console.warn('Redis cache fallback read failed:', redisError.message);
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch markets summary' },
      { status: 500 }
    );
  }
}
