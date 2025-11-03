import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request) {
  try {
    // Return mock data if Supabase is not configured
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        challenge: {
          id: 'demo-challenge',
          status: 'active',
          balance: 5000,
          phase1Progress: 0,
          maxDrawdown: 0,
          maxExposure: 0,
          resolvedMarkets: 0,
          winRate: 0
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `challenge:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Get user's active challenge from Supabase
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({
        error: 'No active challenge found',
        message: challengeError?.message || 'User has no active challenge',
        projectedROI: 0,
        winRate: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        maxExposure: 0,
        maxExposurePercent: 0,
        resolvedMarkets: 0,
        totalMarkets: 0,
        phase1Complete: false,
        challengeStatus: 'not_found'
      });
    }

    const challengeSize = challenge.balance;

    // Get trades for this challenge from Supabase
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('challenge_id', challenge.id)
      .order('created_at', { ascending: false });

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      return NextResponse.json({
        error: 'Failed to fetch trades',
        message: tradesError.message,
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
      }, { status: 500 });
    }

    // For now, we'll use the trades data as positions
    // In a real implementation, you'd need to fetch current market prices
    // and calculate unrealized P&L for open positions
    const positions = trades.map(trade => ({
      id: trade.id,
      side: trade.side,
      shares: trade.amount, // Assuming amount = shares for simplicity
      entryPrice: trade.entry_price,
      pnl: trade.pnl,
      status: trade.resolved ? 'resolved' : 'open',
      endDate: '2025-12-31T12:00:00Z', // This would come from market data
      resolvedOutcome: trade.resolved ? (trade.pnl > 0 ? 'Yes' : 'No') : null
    }));

    // Calculate challenge metrics
    const openPositions = positions.filter(p => p.status === 'open');
    const resolvedPositions = positions.filter(p => p.status === 'resolved');

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
    positions.forEach(pos => {
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
    const maxPositionValue = positions.length > 0 ? Math.max(...positions.map(pos =>
      Math.abs(pos.shares * pos.entryPrice)
    )) : 0;
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
      totalMarkets: positions.length,
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

export async function POST(request) {
  try {
    // Return mock response if Supabase is not configured
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        challenge: {
          id: 'demo-challenge',
          status: 'active',
          balance: 5000
        }
      });
    }

    const body = await request.json();
    const { userId, planId } = body;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'userId and planId are required' },
        { status: 400 }
      );
    }

    // Check if user has an active challenge already
    const { data: existingChallenge } = await supabase
      .from('challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingChallenge) {
      return NextResponse.json(
        { error: 'User already has an active challenge' },
        { status: 409 }
      );
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan not found or inactive', message: planError?.message },
        { status: 404 }
      );
    }

    const params = plan.params || {};
    const balance = params.starting_balance ?? plan.size;

    const baseChallenge = {
      user_id: userId,
      plan_id: plan.id,
      plan_type: plan.type,
      balance,
      status: 'active',
      params: params.metrics || params
    };

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert(baseChallenge)
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge:', error);
      return NextResponse.json(
        { error: 'Failed to create challenge', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      challenge: challenge
    });

  } catch (error) {
    console.error('Challenge POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Return mock response if Supabase is not configured
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        challenge: {
          id: 'demo-challenge',
          status: 'passed'
        }
      });
    }

    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, status' },
        { status: 400 }
      );
    }

    // Update challenge status
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('challenges')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active') // Only update active challenges
      .select()
      .single();

    if (updateError) {
      console.error('Error updating challenge:', updateError);
      return NextResponse.json(
        { error: 'Failed to update challenge', message: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedChallenge) {
      return NextResponse.json(
        { error: 'No active challenge found to update' },
        { status: 404 }
      );
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      challenge: updatedChallenge
    });

  } catch (error) {
    console.error('Challenge PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge', message: error.message },
      { status: 500 }
    );
  }
}
