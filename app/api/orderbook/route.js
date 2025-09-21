import { NextResponse } from 'next/server';

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

    // Check Redis cache first
    let cachedData = null;
    if (global.redisClient) {
      try {
        cachedData = await global.redisClient.get(`orderbook_${tokenId}`);
        if (cachedData) {
          return NextResponse.json(JSON.parse(cachedData));
        }
      } catch (redisError) {
        console.warn('Redis cache read failed:', redisError.message);
      }
    }

    // Fetch orderbook data from Polymarket CLOB
    const orderbook = await fetchOrderbookFromCLOB(tokenId);

    // Cache in Redis for 60 seconds
    if (global.redisClient) {
      try {
        await global.redisClient.setex(`orderbook_${tokenId}`, 60, JSON.stringify(orderbook));
      } catch (redisError) {
        console.warn('Redis cache write failed:', redisError.message);
      }
    }

    return NextResponse.json(orderbook);

  } catch (error) {
    console.error('Orderbook API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch orderbook',
        message: error.message,
        bids: [],
        asks: [],
        spread: 0,
        lastUpdate: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function fetchOrderbookFromCLOB(tokenId) {
  // Mock CLOB orderbook data
  // In production, this would connect to Polymarket's CLOB WebSocket or REST API

  // Generate realistic orderbook based on tokenId
  const basePrice = 0.5 + (parseInt(tokenId.slice(-1)) * 0.1); // Vary based on tokenId
  const volatility = 0.02 + (Math.random() * 0.03); // 2-5% volatility

  // Generate bid levels (buy orders - below market price)
  const bids = [];
  let currentBidPrice = basePrice - 0.01;

  for (let i = 0; i < 10; i++) {
    const price = Math.max(0.01, currentBidPrice - (Math.random() * volatility * 0.5));
    const size = Math.floor(Math.random() * 500) + 50; // 50-550 shares

    bids.push({
      price: Math.round(price * 10000) / 10000, // Round to 4 decimal places
      size: size,
      total: Math.round(price * size * 100) / 100, // Total value in USD
      orders: Math.floor(Math.random() * 5) + 1 // Number of orders at this level
    });

    currentBidPrice = price - 0.001;
  }

  // Generate ask levels (sell orders - above market price)
  const asks = [];
  let currentAskPrice = basePrice + 0.01;

  for (let i = 0; i < 10; i++) {
    const price = Math.min(0.99, currentAskPrice + (Math.random() * volatility * 0.5));
    const size = Math.floor(Math.random() * 500) + 50; // 50-550 shares

    asks.push({
      price: Math.round(price * 10000) / 10000, // Round to 4 decimal places
      size: size,
      total: Math.round(price * size * 100) / 100, // Total value in USD
      orders: Math.floor(Math.random() * 5) + 1 // Number of orders at this level
    });

    currentAskPrice = price + 0.001;
  }

  // Sort bids descending (highest price first), asks ascending (lowest price first)
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);

  // Calculate spread
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;

  // Calculate market depth
  const bidDepth = bids.reduce((sum, bid) => sum + bid.total, 0);
  const askDepth = asks.reduce((sum, ask) => sum + ask.total, 0);

  return {
    tokenId,
    bids,
    asks,
    spread: {
      absolute: Math.round(spread * 10000) / 10000,
      percentage: Math.round(spreadPercentage * 100) / 100
    },
    depth: {
      bids: Math.round(bidDepth * 100) / 100,
      asks: Math.round(askDepth * 100) / 100,
      ratio: bidDepth > 0 ? Math.round((askDepth / bidDepth) * 100) / 100 : 0
    },
    summary: {
      totalBidOrders: bids.reduce((sum, bid) => sum + bid.orders, 0),
      totalAskOrders: asks.reduce((sum, ask) => sum + ask.orders, 0),
      bestBid,
      bestAsk,
      midPrice: (bestBid + bestAsk) / 2
    },
    lastUpdate: new Date().toISOString(),
    source: 'CLOB'
  };
}
