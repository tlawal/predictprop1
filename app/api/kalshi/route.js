import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch data from Kalshi API
    const response = await fetch('https://api.elections.kalshi.com/trade-api/v2/markets?limit=10', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kalshi API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Format the data for our application
    const markets = data.markets
      .filter(market => market.status === 'active' && market.yes_ask && market.no_ask)
      .slice(0, 5) // Limit to 5 markets
      .map(market => ({
        id: market.id,
        title: market.title,
        ticker: market.ticker,
        yes_ask: market.yes_ask,
        no_ask: market.no_ask,
        yes_bid: market.yes_bid,
        no_bid: market.no_bid,
        status: market.status,
        close_time: market.close_time,
        open_time: market.open_time,
        url: `https://kalshi.com/markets/${market.ticker}`,
      }));

    return NextResponse.json({ markets });
  } catch (error) {
    console.error('Error fetching Kalshi data:', error);
    
    // Return fallback data if API fails
    return NextResponse.json({
      markets: [
        {
          id: 'fallback-kalshi-1',
          title: 'Will the S&P 500 close above 6,000 by end of 2025?',
          ticker: 'SP500-6000-2025',
          yes_ask: 35,
          no_ask: 65,
          yes_bid: 34,
          no_bid: 64,
          status: 'active',
          close_time: '2025-12-31T23:59:59Z',
          open_time: '2025-01-01T00:00:00Z',
          url: 'https://kalshi.com/markets/SP500-6000-2025'
        },
        {
          id: 'fallback-kalshi-2',
          title: 'Will the Federal Reserve cut rates by 0.5% or more in 2025?',
          ticker: 'FED-CUT-2025',
          yes_ask: 45,
          no_ask: 55,
          yes_bid: 44,
          no_bid: 54,
          status: 'active',
          close_time: '2025-12-31T23:59:59Z',
          open_time: '2025-01-01T00:00:00Z',
          url: 'https://kalshi.com/markets/FED-CUT-2025'
        },
        {
          id: 'fallback-kalshi-3',
          title: 'Will there be a recession in 2025?',
          ticker: 'RECESSION-2025',
          yes_ask: 25,
          no_ask: 75,
          yes_bid: 24,
          no_bid: 74,
          status: 'active',
          close_time: '2025-12-31T23:59:59Z',
          open_time: '2025-01-01T00:00:00Z',
          url: 'https://kalshi.com/markets/RECESSION-2025'
        }
      ]
    });
  }
}
