import { NextResponse } from 'next/server';

// Simple in-memory cache for recommendations
const recommendationsCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';
    const limit = parseInt(searchParams.get('limit')) || 5;

    // Check cache first
    const cacheKey = `recommend_${userId}_${limit}`;
    const cached = recommendationsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Mock user past trading data (in production, fetch from Supabase)
    const userHistory = await getUserTradingHistory(userId);

    // Mock AI analysis (in production, use LSTM model for drawdown prediction)
    const recommendations = await generateAIRecommendations(userHistory, limit);

    // Cache the result
    recommendationsCache.set(cacheKey, {
      data: recommendations,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    for (const [key, value] of recommendationsCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        recommendationsCache.delete(key);
      }
    }

    return NextResponse.json(recommendations);

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch recommendations',
        message: error.message,
        recommendations: []
      },
      { status: 500 }
    );
  }
}

async function getUserTradingHistory(userId) {
  // Mock user trading history (in production, query Supabase)
  // Based on userId, simulate different trading patterns
  const categories = ['Politics', 'Crypto', 'Sports', 'Economics', 'Tech'];
  const userCategoryIndex = parseInt(userId.slice(-1)) % categories.length;

  return {
    favoriteCategories: [categories[userCategoryIndex], categories[(userCategoryIndex + 1) % categories.length]],
    riskTolerance: userId.includes('conservative') ? 'low' : userId.includes('aggressive') ? 'high' : 'medium',
    pastTrades: [
      { category: categories[userCategoryIndex], pnl: 1250, winRate: 0.75 },
      { category: categories[(userCategoryIndex + 1) % categories.length], pnl: 890, winRate: 0.68 }
    ]
  };
}

async function generateAIRecommendations(userHistory, limit) {
  // Mock AI analysis using LSTM-like logic
  // In production, this would call a trained LSTM model

  const { favoriteCategories, riskTolerance } = userHistory;

  // Mock markets that pass AI filters (<4% predicted drawdown + high volume)
  const mockMarkets = [
    {
      id: 'ai_rec_1',
      question: 'Will US inflation drop below 2% by Q4 2025?',
      yesOdds: 0.65,
      noOdds: 0.35,
      volume24hr: 1250000,
      category: 'Economics',
      endDate: '2025-12-31T23:59:59Z',
      predictedDrawdown: 2.1,
      aiConfidence: 0.89,
      reasoning: 'Low risk, aligns with your economics focus. Strong volume indicates market efficiency.',
      url: 'https://polymarket.com/market/ai_rec_1'
    },
    {
      id: 'ai_rec_2',
      question: 'Will Bitcoin reach $200k by end of 2025?',
      yesOdds: 0.45,
      noOdds: 0.55,
      volume24hr: 2100000,
      category: 'Crypto',
      endDate: '2025-12-31T23:59:59Z',
      predictedDrawdown: 1.8,
      aiConfidence: 0.92,
      reasoning: 'Low risk, aligns with your crypto trading history. High liquidity ensures fair pricing.',
      url: 'https://polymarket.com/market/ai_rec_2'
    },
    {
      id: 'ai_rec_3',
      question: 'Will the Federal Reserve cut rates in 2025?',
      yesOdds: 0.78,
      noOdds: 0.22,
      volume24hr: 890000,
      category: 'Economics',
      endDate: '2025-12-31T23:59:59Z',
      predictedDrawdown: 3.2,
      aiConfidence: 0.85,
      reasoning: 'Low risk, aligns with your economics bets. AI predicts stable market conditions.',
      url: 'https://polymarket.com/market/ai_rec_3'
    },
    {
      id: 'ai_rec_4',
      question: 'Will Ethereum upgrade succeed without major issues?',
      yesOdds: 0.72,
      noOdds: 0.28,
      volume24hr: 1450000,
      category: 'Crypto',
      endDate: '2025-06-30T23:59:59Z',
      predictedDrawdown: 2.8,
      aiConfidence: 0.88,
      reasoning: 'Low risk, aligns with your crypto focus. Strong volume suggests informed market.',
      url: 'https://polymarket.com/market/ai_rec_4'
    },
    {
      id: 'ai_rec_5',
      question: 'Will the next US presidential debate be held?',
      yesOdds: 0.82,
      noOdds: 0.18,
      volume24hr: 675000,
      category: 'Politics',
      endDate: '2025-09-30T23:59:59Z',
      predictedDrawdown: 1.5,
      aiConfidence: 0.91,
      reasoning: 'Low risk, aligns with your politics bets. Very low predicted drawdown.',
      url: 'https://polymarket.com/market/ai_rec_5'
    },
    {
      id: 'ai_rec_6',
      question: 'Will Tesla stock exceed $300 by year-end?',
      yesOdds: 0.58,
      noOdds: 0.42,
      volume24hr: 980000,
      category: 'Economics',
      endDate: '2025-12-31T23:59:59Z',
      predictedDrawdown: 2.9,
      aiConfidence: 0.86,
      reasoning: 'Low risk, aligns with your economics focus. Balanced market with good volume.',
      url: 'https://polymarket.com/market/ai_rec_6'
    }
  ];

  // Filter based on user's preferences and AI criteria
  let filteredMarkets = mockMarkets.filter(market => {
    // AI criteria: <4% predicted drawdown + high volume
    const passesAICriteria = market.predictedDrawdown < 4 && market.volume24hr > 500000;

    // User preference: matches favorite categories
    const matchesUserPrefs = favoriteCategories.includes(market.category);

    // Risk tolerance: adjust filtering based on user risk profile
    const riskMultiplier = riskTolerance === 'low' ? 0.8 : riskTolerance === 'high' ? 1.2 : 1.0;
    const adjustedDrawdown = market.predictedDrawdown * riskMultiplier;

    return passesAICriteria && matchesUserPrefs && adjustedDrawdown < 4;
  });

  // Sort by AI confidence and return top N
  filteredMarkets.sort((a, b) => b.aiConfidence - a.aiConfidence);
  filteredMarkets = filteredMarkets.slice(0, limit);

  return {
    recommendations: filteredMarkets,
    userProfile: {
      favoriteCategories,
      riskTolerance,
      analysisTimestamp: new Date().toISOString()
    },
    metadata: {
      totalFiltered: filteredMarkets.length,
      aiModelVersion: 'LSTM_v2.1',
      lastUpdated: new Date().toISOString()
    }
  };
}
