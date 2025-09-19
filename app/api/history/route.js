import { NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Mock trade history data
const mockTrades = [
  {
    id: 'trade_001',
    marketId: '16548',
    clobTokenId: '72694124641274932882200626543149578267721455356147469534844974829144359265969',
    question: 'Will US government shutdown in 2025?',
    side: 'Yes',
    shares: 100,
    entryPrice: 0.55,
    entryTimestamp: '2025-01-15T10:30:00Z',
    endDate: '2025-12-31T12:00:00Z',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/us-government-shutdown-in-2025-MSsPGy_9Bzvg.jpg',
    status: 'open',
    pnl: 625, // (0.615 - 0.55) * 100
    currentPrice: 0.615,
    umaResolutionStatus: null,
    outcome: null,
    resolved: false
  },
  {
    id: 'trade_002',
    marketId: '22448',
    clobTokenId: '72122482770569588499506755542531317316214547923366033552728295449545343415738',
    question: 'Taylor Swift pregnant in 2025?',
    side: 'No',
    shares: 50,
    entryPrice: 0.15,
    entryTimestamp: '2025-02-20T14:15:00Z',
    endDate: '2025-12-31T12:00:00Z',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/taylor-swift-pregnant-in-2025-5cpC3Ir4u5Pd.jpg',
    status: 'open',
    pnl: -181, // (0.114 - 0.15) * 50
    currentPrice: 0.114,
    umaResolutionStatus: null,
    outcome: null,
    resolved: false
  },
  {
    id: 'trade_003',
    marketId: '16108',
    clobTokenId: '15974786252393396629980467963784550802583781222733347534844974829144359265969',
    question: 'Russia x Ukraine ceasefire in 2025?',
    side: 'Yes',
    shares: 200,
    entryPrice: 0.48,
    entryTimestamp: '2025-03-10T09:45:00Z',
    endDate: '2025-12-31T12:00:00Z',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/russia-x-ukraine-ceasefire-in-2025-w2voYOygx80B.jpg',
    status: 'resolved',
    pnl: 800, // (1.0 - 0.48) * 200 (won)
    currentPrice: 1.0,
    umaResolutionStatus: 'Yes',
    outcome: 'Yes',
    resolved: true,
    resolvedTimestamp: '2025-06-15T16:30:00Z'
  },
  {
    id: 'trade_004',
    marketId: '17505',
    clobTokenId: '107871556080406103665029740738143572273133644015273359659942266346671062091117',
    question: 'Jerome Powell out as Fed Chair in 2025?',
    side: 'No',
    shares: 75,
    entryPrice: 0.08,
    entryTimestamp: '2025-04-05T11:20:00Z',
    endDate: '2025-12-31T12:00:00Z',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/will-trump-remove-jerome-powell-njJA1TCPwhmt.jpg',
    status: 'open',
    pnl: -227, // (0.05 - 0.08) * 75
    currentPrice: 0.05,
    umaResolutionStatus: null,
    outcome: null,
    resolved: false
  },
  {
    id: 'trade_005',
    marketId: '19876',
    clobTokenId: '81234567890123456789012345678901234567890123456789012345678901234567890123456',
    question: 'Will Tesla stock exceed $500 in 2025?',
    side: 'Yes',
    shares: 150,
    entryPrice: 0.45,
    entryTimestamp: '2025-05-12T13:10:00Z',
    endDate: '2025-10-31T12:00:00Z',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/tesla-stock-500-in-2025-abc123.jpg',
    status: 'resolved',
    pnl: -675, // (0.0 - 0.45) * 150 (lost)
    currentPrice: 0.0,
    umaResolutionStatus: 'No',
    outcome: 'No',
    resolved: true,
    resolvedTimestamp: '2025-08-20T14:45:00Z'
  }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';
    const status = searchParams.get('status'); // 'open', 'resolved', or null for all

    // Check cache
    const cacheKey = `history:${userId}:${status}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Filter trades by status if specified
    let filteredTrades = mockTrades;
    if (status === 'open') {
      filteredTrades = mockTrades.filter(trade => trade.status === 'open');
    } else if (status === 'resolved') {
      filteredTrades = mockTrades.filter(trade => trade.status === 'resolved');
    }

    // Get resolved market IDs for fetching outcomes
    const resolvedMarketIds = filteredTrades
      .filter(trade => trade.resolved)
      .map(trade => trade.marketId);

    // In production, fetch resolved outcomes from Gamma API
    // For demo, we'll use the mock data

    // Sort by entry timestamp (newest first)
    const sortedTrades = filteredTrades.sort((a, b) =>
      new Date(b.entryTimestamp) - new Date(a.entryTimestamp)
    );

    // Calculate running equity (starting from $5,000)
    const initialBalance = 5000;
    let runningEquity = initialBalance;
    const equityHistory = [];

    sortedTrades.forEach(trade => {
      if (trade.resolved) {
        runningEquity += trade.pnl;
      } else {
        // For open trades, use current P&L
        runningEquity += trade.pnl;
      }

      equityHistory.push({
        timestamp: trade.entryTimestamp,
        equity: runningEquity,
        pnlDelta: trade.pnl,
        tradeId: trade.id
      });
    });

    const result = {
      trades: sortedTrades,
      equityHistory: equityHistory,
      summary: {
        totalTrades: sortedTrades.length,
        openTrades: sortedTrades.filter(t => t.status === 'open').length,
        resolvedTrades: sortedTrades.filter(t => t.status === 'resolved').length,
        winningTrades: sortedTrades.filter(t => t.resolved && t.pnl > 0).length,
        losingTrades: sortedTrades.filter(t => t.resolved && t.pnl < 0).length,
        totalPnL: sortedTrades.reduce((sum, t) => sum + t.pnl, 0),
        winRate: sortedTrades.filter(t => t.resolved).length > 0 ?
          (sortedTrades.filter(t => t.resolved && t.pnl > 0).length / sortedTrades.filter(t => t.resolved).length) * 100 : 0
      },
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch trade history',
        message: error.message,
        trades: [],
        equityHistory: [],
        summary: {
          totalTrades: 0,
          openTrades: 0,
          resolvedTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalPnL: 0,
          winRate: 0
        }
      },
      { status: 500 }
    );
  }
}
