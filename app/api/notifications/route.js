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
        notifications: [
          {
            id: 'demo-1',
            msg: 'Welcome to PolyProp! Start your trading challenge.',
            type: 'info',
            date: new Date().toISOString()
          }
        ],
        unreadCount: 1
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
    const cacheKey = `notifications:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // For now, we'll create mock notifications based on user activity
    // In a real implementation, you'd have a notifications table in Supabase
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (challengesError) {
      console.error('Error fetching challenges for notifications:', challengesError);
      return NextResponse.json({
        notifications: [],
        total: 0
      });
    }

    // Generate notifications based on challenge status and recent activity
    const notifications = [];

    if (challenges && challenges.length > 0) {
      const activeChallenge = challenges.find(c => c.status === 'active');

      if (activeChallenge) {
        // Phase 1 progress notification
        const phase1Target = activeChallenge.balance * (activeChallenge.params?.profit_target || 10) / 100;
        const phase1Complete = activeChallenge.balance >= phase1Target;

        if (phase1Complete) {
          notifications.push({
            id: 'phase1_complete',
            msg: '🎉 Congratulations! You\'ve completed Phase 1 of your challenge.',
            date: new Date().toISOString(),
            type: 'success',
            read: false
          });
        } else {
          notifications.push({
            id: 'phase1_progress',
            msg: `📈 Phase 1 Progress: $${(activeChallenge.balance * 0.06).toFixed(2)} / $${phase1Target.toFixed(2)} profit target`,
            date: new Date().toISOString(),
            type: 'info',
            read: false
          });
        }

        // Risk alert if drawdown is high
        const drawdownLimit = activeChallenge.params?.drawdown_max || 5;
        if (activeChallenge.balance < activeChallenge.balance * (1 - drawdownLimit / 100)) {
          notifications.push({
            id: 'drawdown_alert',
            msg: `⚠️ Risk Alert: Your drawdown exceeds ${drawdownLimit}%. Consider closing some positions.`,
            date: new Date().toISOString(),
            type: 'warning',
            read: false
          });
        }

        // Exposure alert
        const exposureLimit = activeChallenge.params?.exposure_cap || 15;
        notifications.push({
          id: 'exposure_reminder',
          msg: `💡 Remember: Keep your position exposure below ${exposureLimit}% of your challenge balance.`,
          date: new Date().toISOString(),
          type: 'info',
          read: false
        });
      }

      // Welcome message for new users
      const recentChallenge = challenges[0];
      const daysSinceCreated = Math.floor((Date.now() - new Date(recentChallenge.created_at).getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceCreated < 1) {
        notifications.push({
          id: 'welcome',
          msg: '🎊 Welcome to PolyProp! Start trading and track your progress towards passing your challenge.',
          date: new Date().toISOString(),
          type: 'success',
          read: false
        });
      }
    } else {
      // No challenges yet
      notifications.push({
        id: 'no_challenge',
        msg: '📋 Ready to start? Create your first trading challenge to begin your prop trading journey.',
        date: new Date().toISOString(),
        type: 'info',
        read: false
      });
    }

    // System notifications (always shown)
    notifications.push({
      id: 'system_maintenance',
      msg: '🔧 System maintenance scheduled for Sunday 2AM EST. Brief downtime expected.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      type: 'info',
      read: true
    });

    const result = {
      notifications: notifications.sort((a, b) => new Date(b.date) - new Date(a.date)),
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        message: error.message,
        notifications: [],
        total: 0,
        unreadCount: 0
      },
      { status: 500 }
    );
  }
}
