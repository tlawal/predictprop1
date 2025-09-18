import { NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';

    // Check cache
    const cacheKey = `challenge:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Mock challenge data - in production this would come from Supabase
    // This represents a user with a $5,000 challenge
    const challengeSize = 5000;

    // Mock positions data for calculations
    const mockPositions = [
      {
        id: 'pos_1',
        side: 'Yes',
        shares: 100,
        entryPrice: 0.55,
        currentPrice: 0.62,
        pnl: 700,
        status: 'open',
        endDate: '2025-12-31T12:00:00Z'
      },
      {
        id: 'pos_2',
        side: 'No',
        shares: 50,
        entryPrice: 0.15,
        currentPrice: 0.12,
        pnl: 150,
        status: 'open',
        endDate: '2025-12-31T12:00:00Z'
      },
      {
        id: 'pos_3',
        side: 'Yes',
        shares: 200,
        entryPrice: 0.48,
        currentPrice: 0.52,
        pnl: 800,
        status: 'resolved',
        endDate: '2025-12-31T12:00:00Z',
        resolution: 'Yes',
        resolvedOutcome: 'Yes'
      },
      {
        id: 'pos_4',
        side: 'No',
        shares: 75,
        entryPrice: 0.08,
        currentPrice: 0.05,
        pnl: 225,
        status: 'open',
        endDate: '2025-12-31T12:00:00Z'
      }
    ];

    // Calculate challenge metrics
    const openPositions = mockPositions.filter(p => p.status === 'open');
    const resolvedPositions = mockPositions.filter(p => p.status === 'resolved');

    // Phase 1 progress (6% ROI target)
    const phase1Target = challengeSize * 0.06; // $300 for $5k
    const unrealizedPnL = openPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const realizedPnL = resolvedPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const totalPnL = unrealizedPnL + realizedPnL;
    const phase1Progress = Math.max(0, Math.min(totalPnL, phase1Target));

    // Projected ROI (unrealized + realized P&L as % of initial capital)
    const projectedROI = (totalPnL / challengeSize) * 100;

    // Win rate calculation
    const totalResolved = resolvedPositions.length;
    const winningTrades = resolvedPositions.filter(pos => {
      const side = pos.side === 'Yes' ? 1 : 0;
      const outcome = pos.resolvedOutcome === 'Yes' ? 1 : 0;
      return side === outcome;
    }).length;
    const winRate = totalResolved > 0 ? (winningTrades / totalResolved) * 100 : 0;

    // Drawdown calculation - cluster by end date and find max loss
    const positionsByEndDate = {};
    mockPositions.forEach(pos => {
      if (!positionsByEndDate[pos.endDate]) {
        positionsByEndDate[pos.endDate] = [];
      }
      positionsByEndDate[pos.endDate].push(pos);
    });

    let maxDrawdown = 0;
    Object.values(positionsByEndDate).forEach(cluster => {
      const clusterPnL = cluster.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
      if (clusterPnL < 0) {
        maxDrawdown = Math.max(maxDrawdown, Math.abs(clusterPnL));
      }
    });

    const maxDrawdownPercent = (maxDrawdown / challengeSize) * 100;

    // Exposure calculation - max position allocation
    const maxPositionValue = Math.max(...mockPositions.map(pos =>
      Math.abs(pos.shares * pos.entryPrice)
    ));
    const maxExposurePercent = (maxPositionValue / challengeSize) * 100;

    // Challenge status
    const phase1Complete = projectedROI >= 6 && winRate >= 70 && maxDrawdownPercent <= 5;
    const challengeComplete = phase1Complete; // For demo, just Phase 1

    const result = {
      // Phase 1 metrics
      phase1Progress: Math.round(phase1Progress * 100) / 100,
      phase1Target: phase1Target,
      projectedROI: Math.round(projectedROI * 100) / 100,

      // Win rate metrics
      winRate: Math.round(winRate * 100) / 100,
      totalResolved: totalResolved,
      winningTrades: winningTrades,

      // Risk metrics
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
      maxExposure: Math.round(maxPositionValue * 100) / 100,
      maxExposurePercent: Math.round(maxExposurePercent * 100) / 100,

      // Position counts
      resolvedMarkets: totalResolved,
      totalMarkets: mockPositions.length,
      openPositions: openPositions.length,

      // Challenge status
      challengeSize: challengeSize,
      challengeStatus: challengeComplete ? 'completed' : 'active',
      phase1Complete: phase1Complete,

      // P&L breakdown
      realizedPnL: Math.round(realizedPnL * 100) / 100,
      unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,

      // Last updated
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Challenge API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch challenge data',
        message: error.message,
        projectedROI: 0,
        winRate: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        maxExposure: 0,
        maxExposurePercent: 0,
        resolvedMarkets: 0,
        totalMarkets: 0,
        phase1Complete: false,
        challengeStatus: 'error'
      },
      { status: 500 }
    );
  }
}
