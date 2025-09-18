import { NextResponse } from 'next/server';

// Mock database - in production, use Supabase or similar
const mockTrades = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { tokenId, side, amount, price, orderType } = body;

    // Validate required fields
    if (!tokenId || !side || !amount || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate side
    if (!['yes', 'no'].includes(side)) {
      return NextResponse.json(
        { error: 'Invalid side. Must be "yes" or "no"' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number' },
        { status: 400 }
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0 || priceNum > 1) {
      return NextResponse.json(
        { error: 'Invalid price. Must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Create mock trade record
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tokenId,
      side,
      amount: amountNum,
      price: priceNum,
      orderType: orderType || 'market',
      timestamp: new Date().toISOString(),
      status: 'pending', // pending, filled, cancelled
      pnl: null, // Profit/Loss - would be calculated when trade is closed
      marketId: tokenId, // For linking to market
    };

    // Store in mock database
    mockTrades.push(trade);

    console.log('Mock trade created:', trade);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update status to filled
    trade.status = 'filled';

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        tokenId: trade.tokenId,
        side: trade.side,
        amount: trade.amount,
        price: trade.price,
        orderType: trade.orderType,
        timestamp: trade.timestamp,
        status: trade.status
      },
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { error: 'Failed to process order', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    // Filter trades by tokenId if provided
    const filteredTrades = tokenId
      ? mockTrades.filter(trade => trade.tokenId === tokenId)
      : mockTrades;

    return NextResponse.json({
      trades: filteredTrades,
      total: filteredTrades.length
    });

  } catch (error) {
    console.error('Get orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', message: error.message },
      { status: 500 }
    );
  }
}