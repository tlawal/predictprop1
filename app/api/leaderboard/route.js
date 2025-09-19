import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';
import { NextResponse } from 'next/server';

// Simple in-memory cache (in production, use Redis)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Initialize Apollo Client for Polymarket subgraph
const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/polymarket/markets',
  }),
  cache: new InMemoryCache(),
});

// GraphQL query for positions with PnL > 0
const POSITIONS_QUERY = gql`
  query GetPositions($first: Int!, $search: String) {
    positions(
      first: $first
      where: {
        pnl_gt: 0
        trader_contains: $search
      }
      orderBy: pnl
      orderDirection: desc
    ) {
      id
      trader {
        id
      }
      collateral
      resolvedValue
      outcome
      side
      market {
        id
        resolved
      }
    }
  }
`;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';

    // Check cache first
    const cacheKey = `leaderboard_${searchQuery}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch data from Polymarket subgraph
    const { data, error } = await client.query({
      query: POSITIONS_QUERY,
      variables: {
        first: 1000, // Fetch enough data to aggregate top traders
        search: searchQuery || null,
      },
    });

    if (error) {
      throw new Error(`GraphQL query failed: ${error.message}`);
    }

    // Aggregate data by trader
    const traderStats = {};

    data.positions.forEach(position => {
      const traderId = position.trader.id.toLowerCase();

      if (!traderStats[traderId]) {
        traderStats[traderId] = {
          trader: traderId,
          totalPnL: 0,
          wins: 0,
          totalTrades: 0,
          positions: [],
        };
      }

      // Calculate PnL for this position
      const collateral = parseFloat(position.collateral || 0);
      const resolvedValue = parseFloat(position.resolvedValue || 0);
      const pnl = resolvedValue - collateral;

      traderStats[traderId].totalPnL += pnl;
      traderStats[traderId].totalTrades += 1;

      // Count wins (when outcome matches side)
      if (position.outcome && position.side && position.outcome === position.side) {
        traderStats[traderId].wins += 1;
      }

      traderStats[traderId].positions.push(position);
    });

    // Convert to array and calculate win rates
    const traders = Object.values(traderStats).map(trader => ({
      trader: trader.trader,
      pnl: trader.totalPnL,
      wins: trader.wins,
      totalTrades: trader.totalTrades,
      winRate: trader.totalTrades > 0 ? trader.wins / trader.totalTrades : 0,
    }));

    // Sort by PnL descending and take top 20
    const topTraders = traders
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 20);

    // Prepare response
    const result = {
      traders: topTraders,
      totalCount: traders.length,
      searchQuery: searchQuery || null,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (cache.size > 10) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 5).forEach(([key]) => cache.delete(key));
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Leaderboard API error:', error);

    // Return mock data as fallback
    const mockData = {
      traders: [
        {
          trader: '0x1234567890123456789012345678901234567890',
          pnl: 125000,
          wins: 45,
          totalTrades: 67,
          winRate: 0.67,
        },
        {
          trader: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          pnl: 98000,
          wins: 38,
          totalTrades: 52,
          winRate: 0.73,
        },
        {
          trader: '0x1111111111111111111111111111111111111111',
          pnl: 87500,
          wins: 42,
          totalTrades: 58,
          winRate: 0.72,
        },
        {
          trader: '0x2222222222222222222222222222222222222222',
          pnl: 76300,
          wins: 35,
          totalTrades: 49,
          winRate: 0.71,
        },
        {
          trader: '0x3333333333333333333333333333333333333333',
          pnl: 65400,
          wins: 31,
          totalTrades: 44,
          winRate: 0.70,
        },
      ],
      totalCount: 5,
      searchQuery: null,
      lastUpdated: new Date().toISOString(),
      isMockData: true,
    };

    return NextResponse.json(mockData);
  }
}
