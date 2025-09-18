import { NextResponse } from 'next/server';

// Mock data - in production this would connect to Supabase
const mockPositions = [
  {
    id: 'pos_1',
    question: 'Will US government shutdown in 2025?',
    side: 'Yes',
    shares: 100,
    entryPrice: 0.55,
    currentPrice: 0.62,
    pnl: 700,
    endDate: '2025-12-31T12:00:00Z',
    status: 'open',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/us-government-shutdown-in-2025-MSsPGy_9Bzvg.jpg',
    clobTokenId: '72694124641274932882200626543149578267721455356147469534844974829144359265969',
    marketId: '16548'
  },
  {
    id: 'pos_2',
    question: 'Taylor Swift pregnant in 2025?',
    side: 'No',
    shares: 50,
    entryPrice: 0.15,
    currentPrice: 0.12,
    pnl: 150,
    endDate: '2025-12-31T12:00:00Z',
    status: 'open',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/taylor-swift-pregnant-in-2025-5cpC3Ir4u5Pd.jpg',
    clobTokenId: '72122482770569588499506755542531317316214547923366033552728295449545343415738',
    marketId: '22448'
  },
  {
    id: 'pos_3',
    question: 'Russia x Ukraine ceasefire in 2025?',
    side: 'Yes',
    shares: 200,
    entryPrice: 0.48,
    currentPrice: 0.52,
    pnl: 800,
    endDate: '2025-12-31T12:00:00Z',
    status: 'resolved',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/russia-x-ukraine-ceasefire-in-2025-w2voYOygx80B.jpg',
    clobTokenId: '15974786252393396629980467963784550802583781222733347534844974829144359265969',
    marketId: '16108',
    resolution: 'Yes' // Mock resolution for resolved market
  },
  {
    id: 'pos_4',
    question: 'Jerome Powell out as Fed Chair in 2025?',
    side: 'No',
    shares: 75,
    entryPrice: 0.08,
    currentPrice: 0.05,
    pnl: 225,
    endDate: '2025-12-31T12:00:00Z',
    status: 'open',
    icon: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/will-trump-remove-jerome-powell-njJA1TCPwhmt.jpg',
    clobTokenId: '107871556080406103665029740738143572273133644015273359659942266346671062091117',
    marketId: '17505'
  }
];

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';

    // Check cache
    const cacheKey = `positions:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // In production, this would query Supabase for user positions
    // For demo purposes, we'll return mock data with some calculated P&L

    // Simulate real-time price updates (in production this would come from WebSocket)
    const positionsWithLivePrices = mockPositions.map(position => {
      if (position.status === 'open') {
        // Add some random price movement for demo
        const priceChange = (Math.random() - 0.5) * 0.02; // ±1% change
        const newPrice = Math.max(0.01, Math.min(0.99, position.currentPrice + priceChange));
        const newPnl = (newPrice - position.entryPrice) * position.shares;

        return {
          ...position,
          currentPrice: parseFloat(newPrice.toFixed(3)),
          pnl: Math.round(newPnl * 100) / 100 // Round to cents
        };
      }
      return position;
    });

    // Calculate P&L for resolved positions based on outcome
    const positionsWithResolvedPnL = positionsWithLivePrices.map(position => {
      if (position.status === 'resolved' && position.resolution) {
        // In a real implementation, this would use the actual market resolution
        const outcome = position.resolution === 'Yes' ? 1 : 0;
        const side = position.side === 'Yes' ? 1 : 0;
        const pnl = side === outcome ? position.shares * (1 - position.entryPrice) : -position.shares * position.entryPrice;

        return {
          ...position,
          pnl: Math.round(pnl * 100) / 100,
          resolvedOutcome: position.resolution
        };
      }
      return position;
    });

    const result = {
      positions: positionsWithResolvedPnL,
      totalPositions: positionsWithResolvedPnL.length,
      openPositions: positionsWithResolvedPnL.filter(p => p.status === 'open').length,
      resolvedPositions: positionsWithResolvedPnL.filter(p => p.status === 'resolved').length,
      totalPnL: positionsWithResolvedPnL.reduce((sum, pos) => sum + (pos.pnl || 0), 0),
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Positions API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        message: error.message,
        positions: [],
        totalPositions: 0,
        openPositions: 0,
        resolvedPositions: 0,
        totalPnL: 0
      },
      { status: 500 }
    );
  }
}

// Mock close position endpoint
export async function POST(request) {
  try {
    const body = await request.json();
    const { tokenId, qty, price } = body;

    // In production, this would:
    // 1. Validate the user has this position
    // 2. Create a sell order on Polymarket
    // 3. Update Supabase with the trade
    // 4. Update user's balance

    console.log('Mock closing position:', { tokenId, qty, price });

    // Mock success response
    return NextResponse.json({
      success: true,
      message: 'Position closed successfully',
      tradeId: `trade_${Date.now()}`,
      pnl: Math.round((price * qty) * 100) / 100
    });

  } catch (error) {
    console.error('Close position error:', error);
    return NextResponse.json(
      {
        error: 'Failed to close position',
        message: error.message
      },
      { status: 500 }
    );
  }
}
