// Competitions API - manages trading competitions, leaderboards, and prizes
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const competitionId = searchParams.get('competitionId');

    const cacheKey = competitionId ? `competition_${competitionId}` : 'competitions_list';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Return mock data if Supabase is not configured
    if (!isSupabaseConfigured) {
      if (competitionId) {
        // Return specific competition details
        const mockCompetition = {
          id: competitionId,
          title: 'Monthly Trading Championship',
          description: 'Compete for the highest P&L in the monthly trading competition',
          rules: 'Minimum 10 trades, max drawdown 5%, follow all platform rules',
          prizes: [
            { position: 1, prize: '$500 USDC', description: 'First place prize' },
            { position: 2, prize: '$300 USDC', description: 'Second place prize' },
            { position: 3, prize: '$200 USDC', description: 'Third place prize' }
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          participants: Math.floor(Math.random() * 500) + 50,
          isJoined: Math.random() > 0.5,
          leaderboard: [
            { rank: 1, userId: 'user1', username: 'TraderPro', pnl: 1250.50, trades: 45 },
            { rank: 2, userId: 'user2', username: 'MarketMaster', pnl: 1180.25, trades: 52 },
            { rank: 3, userId: 'user3', username: 'RiskManager', pnl: 1050.75, trades: 38 }
          ]
        };
        cache.set(cacheKey, { data: mockCompetition, timestamp: Date.now() });
        return NextResponse.json(mockCompetition);
      } else {
        // Return list of competitions
        const mockCompetitions = [
          {
            id: 'monthly-championship',
            title: 'Monthly Trading Championship',
            description: 'Compete for the highest P&L this month',
            prizePool: '$1000',
            participants: 234,
            daysLeft: 12,
            status: 'active'
          },
          {
            id: 'weekly-sprint',
            title: 'Weekly Risk Management Sprint',
            description: 'Focus on consistent performance with low drawdown',
            prizePool: '$500',
            participants: 89,
            daysLeft: 3,
            status: 'active'
          },
          {
            id: 'beginner-challenge',
            title: 'Beginner Trading Challenge',
            description: 'Perfect for new traders learning the ropes',
            prizePool: '$250',
            participants: 156,
            daysLeft: 8,
            status: 'active'
          }
        ];
        cache.set(cacheKey, { data: mockCompetitions, timestamp: Date.now() });
        return NextResponse.json(mockCompetitions);
      }
    }

    if (competitionId) {
      // Get specific competition details
      const { data: competition, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Competition not found' },
          { status: 404 }
        );
      }

      // Get leaderboard
      const { data: leaderboard } = await supabase
        .from('competition_participants')
        .select(`
          rank,
          pnl,
          trades_count,
          user:user_id (
            id,
            email
          )
        `)
        .eq('competition_id', competitionId)
        .order('rank')
        .limit(10);

      // Check if user is joined
      const { data: participation } = await supabase
        .from('competition_participants')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('user_id', userId)
        .single();

      const responseData = {
        ...competition,
        isJoined: !!participation,
        leaderboard: leaderboard || []
      };

      cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      return NextResponse.json(responseData);
    } else {
      // Get list of active competitions
      const { data: competitions, error } = await supabase
        .from('competitions')
        .select(`
          *,
          participants:competition_participants(count)
        `)
        .eq('status', 'active')
        .order('start_date');

      if (error) {
        console.error('Error fetching competitions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch competitions' },
          { status: 500 }
        );
      }

      const responseData = competitions || [];
      cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      return NextResponse.json(responseData);
    }

  } catch (error) {
    console.error('Competitions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitions', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Successfully joined competition (mock)'
      });
    }

    const body = await request.json();
    const { userId, competitionId, action } = body;

    if (!userId || !competitionId) {
      return NextResponse.json(
        { error: 'userId and competitionId are required' },
        { status: 400 }
      );
    }

    if (action === 'join') {
      // Join competition
      const { error } = await supabase
        .from('competition_participants')
        .insert({
          competition_id: competitionId,
          user_id: userId,
          joined_at: new Date().toISOString()
        });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to join competition' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully joined competition'
      });
    } else if (action === 'leave') {
      // Leave competition
      const { error } = await supabase
        .from('competition_participants')
        .delete()
        .eq('competition_id', competitionId)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to leave competition' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully left competition'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Competitions POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process competition action', message: error.message },
      { status: 500 }
    );
  }
}
