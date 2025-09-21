import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check Redis cache first
    let cachedData = null;
    if (global.redisClient) {
      try {
        cachedData = await global.redisClient.get('markets_categories');
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

    // Extract unique categories from the markets data
    const categorySet = new Set();

    marketsData.forEach(market => {
      // Check for categories in different possible fields
      if (market.categories && Array.isArray(market.categories)) {
        market.categories.forEach(category => {
          if (category && typeof category === 'string') {
            categorySet.add(category.toLowerCase());
          }
        });
      }

      // Check for tags
      if (market.tags && Array.isArray(market.tags)) {
        market.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            categorySet.add(tag.toLowerCase());
          }
        });
      }

      // Check for category field
      if (market.category && typeof market.category === 'string') {
        categorySet.add(market.category.toLowerCase());
      }

      // Check for sport field (common in prediction markets)
      if (market.sport && typeof market.sport === 'string') {
        categorySet.add(market.sport.toLowerCase());
      }
    });

    // Convert to sorted array and capitalize first letter
    const categories = Array.from(categorySet)
      .sort()
      .map(category => category.charAt(0).toUpperCase() + category.slice(1));

    const responseData = {
      categories,
      count: categories.length,
      lastUpdated: new Date().toISOString(),
    };

    // Cache in Redis for 1 hour (3600 seconds)
    if (global.redisClient) {
      try {
        await global.redisClient.setex('markets_categories', 3600, JSON.stringify(responseData));
      } catch (redisError) {
        console.warn('Redis cache write failed:', redisError.message);
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching markets categories:', error);

    // Return cached data if available, otherwise return error
    if (global.redisClient) {
      try {
        const cachedData = await global.redisClient.get('markets_categories');
        if (cachedData) {
          return NextResponse.json(JSON.parse(cachedData));
        }
      } catch (redisError) {
        console.warn('Redis cache fallback read failed:', redisError.message);
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
