import { NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Mock LSTM-like risk calculation function
function calculateLSTMThreshold(positions, history) {
  // Simulate LSTM analysis: cluster positions by end date and calculate drawdown
  const clusters = {};

  positions.forEach(position => {
    const endDate = position.endDate.split('T')[0]; // YYYY-MM-DD format
    if (!clusters[endDate]) {
      clusters[endDate] = [];
    }
    clusters[endDate].push(position);
  });

  let maxDrawdown = 0;
  let maxDrawdownDate = null;
  let clusterSize = 0;

  Object.entries(clusters).forEach(([date, clusterPositions]) => {
    const clusterPnL = clusterPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const clusterValue = clusterPositions.reduce((sum, pos) =>
      sum + (pos.shares * pos.entryPrice), 0
    );

    if (clusterPnL < 0) {
      const drawdownPercent = Math.abs(clusterPnL) / clusterValue * 100;
      if (drawdownPercent > maxDrawdown) {
        maxDrawdown = drawdownPercent;
        maxDrawdownDate = date;
        clusterSize = clusterPositions.length;
      }
    }
  });

  return {
    drawdownPercent: Math.round(maxDrawdown * 100) / 100,
    date: maxDrawdownDate,
    clusterSize,
    threshold: 4.0 // 4% threshold for alerts
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';

    // Check cache
    const cacheKey = `risk:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Mock positions data (in production, fetch from positions API)
    const mockPositions = [
      {
        id: 'pos_1',
        question: 'Will US government shutdown in 2025?',
        shares: 100,
        entryPrice: 0.55,
        pnl: 625,
        endDate: '2025-12-31T12:00:00Z',
        status: 'open'
      },
      {
        id: 'pos_2',
        question: 'Taylor Swift pregnant in 2025?',
        shares: 50,
        entryPrice: 0.15,
        pnl: -181,
        endDate: '2025-12-31T12:00:00Z',
        status: 'open'
      },
      {
        id: 'pos_3',
        question: 'Jerome Powell out as Fed Chair in 2025?',
        shares: 75,
        entryPrice: 0.08,
        pnl: -227,
        endDate: '2025-12-31T12:00:00Z',
        status: 'open'
      }
    ];

    // Mock history data (in production, fetch from history API)
    const mockHistory = [
      {
        id: 'trade_001',
        pnl: 625,
        resolved: false,
        endDate: '2025-12-31T12:00:00Z'
      },
      {
        id: 'trade_002',
        pnl: -181,
        resolved: false,
        endDate: '2025-12-31T12:00:00Z'
      },
      {
        id: 'trade_003',
        pnl: 800,
        resolved: true,
        endDate: '2025-12-31T12:00:00Z'
      },
      {
        id: 'trade_004',
        pnl: -227,
        resolved: false,
        endDate: '2025-12-31T12:00:00Z'
      }
    ];

    // Calculate LSTM-like risk analysis
    const lstmResult = calculateLSTMThreshold(mockPositions, mockHistory);

    // Determine if alert should be triggered
    const alert = lstmResult.drawdownPercent > lstmResult.threshold;

    // Format the alert message
    let alertMessage = '';
    let severity = 'low';

    if (alert) {
      alertMessage = `${lstmResult.drawdownPercent}% drawdown on cluster of ${lstmResult.clusterSize} open positions (markets end ${new Date(lstmResult.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;

      if (lstmResult.drawdownPercent > 7) {
        severity = 'high';
      } else if (lstmResult.drawdownPercent > 5) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
    }

    // Calculate additional risk metrics
    const totalExposure = mockPositions.reduce((sum, pos) =>
      sum + (pos.shares * pos.entryPrice), 0
    );

    const maxSinglePosition = Math.max(...mockPositions.map(pos =>
      pos.shares * pos.entryPrice
    ));

    const concentrationRisk = (maxSinglePosition / totalExposure) * 100;

    const result = {
      alert: alert,
      message: alertMessage,
      severity: severity,
      metrics: {
        maxDrawdown: lstmResult.drawdownPercent,
        drawdownDate: lstmResult.date,
        clusterSize: lstmResult.clusterSize,
        totalExposure: totalExposure,
        maxSinglePosition: maxSinglePosition,
        concentrationRisk: Math.round(concentrationRisk * 100) / 100,
        threshold: lstmResult.threshold
      },
      recommendations: alert ? [
        "Consider reducing position sizes in clustered markets",
        "Monitor markets ending in the same time period",
        "Diversify across different market categories",
        "Consider taking partial profits if positions are profitable"
      ] : [],
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Risk API error:', error);
    return NextResponse.json(
      {
        alert: false,
        message: '',
        severity: 'low',
        metrics: {
          maxDrawdown: 0,
          drawdownDate: null,
          clusterSize: 0,
          totalExposure: 0,
          maxSinglePosition: 0,
          concentrationRisk: 0,
          threshold: 4.0
        },
        recommendations: [],
        error: error.message
      },
      { status: 500 }
    );
  }
}
