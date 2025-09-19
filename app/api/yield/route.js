// Mock yield API - in production this would calculate real APY based on vault performance
import { NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';
    const cacheKey = `yield_${userId}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Mock yield data - in production this would be calculated from actual vault performance
    // Base APY calculation (10-20% based on TVL)
    const baseApy = Math.floor(Math.random() * 10 + 10); // 10-20%

    // AI optimization bonus
    const aiBonus = Math.random() > 0.5 ? Math.floor(Math.random() * 3 + 1) : 0;

    const mockYieldData = {
      // Current APY
      apy: baseApy + aiBonus,

      // AI optimized flag
      aiOptimized: aiBonus > 0,

      // AI insight text
      aiInsight: aiBonus > 0
        ? `AI optimized allocation increased APY by +${aiBonus}%`
        : 'Current allocation is performing optimally',

      // Yield breakdown percentages
      breakdown: {
        fees: 60, // 60% from trading fees
        splits: 40, // 40% from profit splits
      },

      // AI recommended breakdown
      aiRecommendations: {
        fees: aiBonus > 0 ? 70 : 60,
        splits: aiBonus > 0 ? 30 : 40,
        description: aiBonus > 0
          ? 'AI recommends 70% low-risk traders, 30% market makers for optimal yield'
          : 'Current allocation is well-balanced for risk-adjusted returns',
      },

      // Chart data for the last 30 days
      chartData: generateChartData(),

      // Last updated timestamp
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result
    cache.set(cacheKey, {
      data: mockYieldData,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (cache.size > 10) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 5).forEach(([key]) => cache.delete(key));
    }

    return NextResponse.json(mockYieldData);

  } catch (error) {
    console.error('Yield API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch yield data',
        message: error.message,
        apy: 12.5,
        aiOptimized: false,
        breakdown: { fees: 60, splits: 40 },
        aiRecommendations: {
          fees: 60,
          splits: 40,
          description: 'Standard allocation recommended',
        },
        chartData: [],
      },
      { status: 500 }
    );
  }
}

// Generate mock chart data for the last 30 days
function generateChartData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const baseYield = Math.random() * 100 + 50;
    const fees = baseYield * 0.6; // 60% fees
    const splits = baseYield * 0.4; // 40% splits

    data.push({
      date: date.toISOString().split('T')[0],
      fees: Math.round(fees * 100) / 100,
      splits: Math.round(splits * 100) / 100,
      total: Math.round(baseYield * 100) / 100,
    });
  }

  return data;
}
