import { NextResponse } from 'next/server';

const EMPTY_ORDERBOOK = {
  summary: {
    bestBid: null,
    bestAsk: null,
    midPrice: null,
  },
  bids: [],
  asks: [],
  spread: null,
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  if (!tokenId) {
    return NextResponse.json({ error: 'tokenId query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://clob.polymarket.com/markets/${encodeURIComponent(tokenId)}/orderbook`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PolyProp/1.0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(EMPTY_ORDERBOOK);
    }

    const data = await response.json();
    return NextResponse.json(data ?? EMPTY_ORDERBOOK);
  } catch (error) {
    console.warn('Orderbook fetch failed:', error);
    return NextResponse.json(EMPTY_ORDERBOOK);
  }
}
