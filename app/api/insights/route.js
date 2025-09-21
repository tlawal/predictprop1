import { NextResponse } from 'next/server';

// Simple in-memory cache for insights
const insightsCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId') || searchParams.get('marketId');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID or Market ID is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `insights_${tokenId}`;
    const cached = insightsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Mock insights calculation (in production, calculate from real data)
    const insights = await generateMarketInsights(tokenId);

    // Cache the result
    insightsCache.set(cacheKey, {
      data: insights,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    for (const [key, value] of insightsCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        insightsCache.delete(key);
      }
    }

    return NextResponse.json(insights);

  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch market insights',
        message: error.message
      },
      { status: 500 }
    );
  }
}

async function generateMarketInsights(tokenId) {
  // Mock insights based on tokenId (in production, fetch from Gamma API and calculate real stats)

  // Mock price history for the last 7 days (in production, get from real data)
  const priceHistory = [];
  const basePrice = 0.5 + (parseInt(tokenId.slice(-1)) * 0.1); // Vary based on tokenId

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const priceChange = (Math.random() - 0.5) * 0.1; // Random change
    const price = Math.max(0.01, Math.min(0.99, basePrice + priceChange));

    priceHistory.push({
      date: date.toISOString().split('T')[0],
      yesPrice: price,
      volume: Math.floor(Math.random() * 100000) + 10000
    });
  }

  // Calculate average probability shift
  const avgProbShift = priceHistory.length > 1
    ? priceHistory.reduce((sum, point, index) => {
        if (index === 0) return 0;
        return sum + Math.abs(point.yesPrice - priceHistory[index - 1].yesPrice);
      }, 0) / (priceHistory.length - 1)
    : 0;

  // Mock related markets based on categories (in production, match via Gamma tags)
  const categories = ['Politics', 'Crypto', 'Sports', 'Economics', 'Tech'];
  const currentCategory = categories[parseInt(tokenId.slice(-1)) % categories.length];

  const relatedMarkets = [];
  for (let i = 0; i < 3; i++) {
    const mockId = `related_${tokenId}_${i}`;
    const mockPrice = 0.3 + Math.random() * 0.4;

    relatedMarkets.push({
      id: mockId,
      question: `Related ${currentCategory} market ${i + 1}: ${getMockQuestion(currentCategory, i)}`,
      yesOdds: mockPrice,
      noOdds: 1 - mockPrice,
      volume: Math.floor(Math.random() * 50000) + 5000,
      category: currentCategory,
      endDate: new Date(Date.now() + (30 + i * 7) * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://polymarket.com/market/${mockId}`
    });
  }

  return {
    tokenId,
    insights: {
      averageProbShift: Math.round(avgProbShift * 10000) / 100, // Convert to percentage
      priceHistory: priceHistory.slice(-10), // Last 10 data points
      trend: avgProbShift > 0.02 ? 'increasing' : avgProbShift < -0.02 ? 'decreasing' : 'stable',
      volatility: Math.round((Math.max(...priceHistory.map(p => p.yesPrice)) - Math.min(...priceHistory.map(p => p.yesPrice))) * 100),
      totalVolume7d: priceHistory.reduce((sum, p) => sum + p.volume, 0)
    },
    relatedMarkets,
    analysis: {
      marketMaturity: Math.random() > 0.5 ? 'Early stage - high volatility expected' : 'Mature market - stable pricing',
      liquidityAssessment: Math.random() > 0.3 ? 'Good liquidity for trading' : 'Low liquidity - price slippage possible',
      recommendation: Math.random() > 0.5 ? 'Consider monitoring for entry opportunities' : 'Market showing steady movement'
    },
    lastUpdated: new Date().toISOString()
  };
}

function getMockQuestion(category, index) {
  const questions = {
    Politics: [
      'Will the next election result be contested?',
      'Will a major policy change occur this quarter?',
      'Will there be a government shutdown risk?'
    ],
    Crypto: [
      'Will Bitcoin reach $100k by year end?',
      'Will Ethereum upgrade succeed?',
      'Will a major crypto regulation pass?'
    ],
    Sports: [
      'Will the championship winner be upset?',
      'Will a record be broken this season?',
      'Will there be a major injury controversy?'
    ],
    Economics: [
      'Will inflation drop below 2%?',
      'Will interest rates change this quarter?',
      'Will GDP growth exceed expectations?'
    ],
    Tech: [
      'Will the new AI model launch successfully?',
      'Will there be a major tech acquisition?',
      'Will the stock split occur as planned?'
    ]
  };

  return questions[category]?.[index] || 'Will the outcome be positive?';
}
