import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  try {
    // Return mock data if Supabase is not configured
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        trades: [],
        equityHistory: [],
        summary: {
          totalTrades: 0,
          openTrades: 0,
          resolvedTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalPnL: 0,
          accuracy: 0
        },
        lastUpdated: new Date().toISOString()
      });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'open', 'resolved', or null for all

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `history:${userId}:${status}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch trades from Supabase
    let query = supabase
      .from('trades')
      .select(`
        *,
        challenges!inner(user_id, status)
      `)
      .eq('challenges.user_id', userId);

    // Filter by resolved status if specified
    if (status === 'open') {
      query = query.eq('resolved', false);
    } else if (status === 'resolved') {
      query = query.eq('resolved', true);
    }

    const { data: trades, error: tradesError } = await query
      .order('created_at', { ascending: false });

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json({
        error: 'Failed to fetch trade history',
        message: tradesError.message,
        trades: [],
        equityHistory: [],
        summary: {
          totalTrades: 0,
          openTrades: 0,
          resolvedTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalPnL: 0,
          accuracy: 0
        }
      }, { status: 500 });
    }

    // Get resolved market IDs for fetching outcomes from Gamma API
    const resolvedMarketIds = trades
      .filter(trade => trade.resolved)
      .map(trade => trade.market_id);

    // Fetch resolved outcomes from Gamma API
    let resolvedOutcomes = {};
    if (resolvedMarketIds.length > 0) {
      try {
        const marketsResponse = await fetch(
          `https://gamma-api.polymarket.com/markets?closed=true&condition_ids=${resolvedMarketIds.join(',')}`
        );
        if (marketsResponse.ok) {
          const marketsData = await marketsResponse.json();
          resolvedOutcomes = marketsData.markets?.reduce((acc, market) => {
            acc[market.conditionId] = {
              outcome: market.umaResolutionStatus === '1' ? 'Yes' : 'No',
              resolved: true
            };
            return acc;
          }, {}) || {};
        }
      } catch (error) {
        console.warn('Failed to fetch resolved outcomes from Gamma API:', error);
      }
    }

    // Transform trades data to include market information and calculate P&L
    const transformedTrades = trades.map(trade => {
      const marketOutcome = resolvedOutcomes[trade.market_id];
      let calculatedPnL = trade.pnl;

      // For resolved trades, recalculate P&L based on outcome if needed
      if (trade.resolved && marketOutcome) {
        const outcomeBinary = marketOutcome.outcome === 'Yes' ? 1 : 0;
        const sideBinary = trade.side === 'Yes' ? 1 : 0;
        const isWin = sideBinary === outcomeBinary;
        calculatedPnL = isWin ?
          trade.amount * (1 - trade.entry_price) :
          -trade.amount * trade.entry_price;
      }

      return {
        id: trade.id,
        marketId: trade.market_id,
        question: `Market ${trade.market_id}`, // Would need to fetch from Gamma API
        side: trade.side,
        shares: trade.amount,
        entryPrice: trade.entry_price,
        entryTimestamp: trade.created_at,
        endDate: '2025-12-31T12:00:00Z', // Would need to fetch from market data
        status: trade.resolved ? 'resolved' : 'open',
        pnl: calculatedPnL,
        umaResolutionStatus: marketOutcome?.outcome || null,
        outcome: marketOutcome?.outcome || null,
        resolved: trade.resolved,
        resolvedTimestamp: trade.resolved ? trade.updated_at : null
      };
    });

    // Sort by entry timestamp (newest first)
    const sortedTrades = transformedTrades.sort((a, b) =>
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

    const resolvedTradeCount = sortedTrades.filter(t => t.resolved).length;
    const winningTradeCount = sortedTrades.filter(t => t.resolved && t.pnl > 0).length;
    const accuracy = resolvedTradeCount > 0 ? (winningTradeCount / resolvedTradeCount) * 100 : 0;

    const result = {
      trades: sortedTrades,
      equityHistory: equityHistory,
      summary: {
        totalTrades: sortedTrades.length,
        openTrades: sortedTrades.filter(t => t.status === 'open').length,
        resolvedTrades: resolvedTradeCount,
        winningTrades: winningTradeCount,
        losingTrades: sortedTrades.filter(t => t.resolved && t.pnl < 0).length,
        totalPnL: sortedTrades.reduce((sum, t) => sum + t.pnl, 0),
        accuracy
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
          accuracy: 0
        }
      },
      { status: 500 }
    );
  }
}
