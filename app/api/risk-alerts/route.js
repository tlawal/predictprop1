// Risk Alerts API - manages risk alerts, notifications, and monitoring events
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds for alerts (frequent updates needed)

export async function GET(request) {
  try {
    const cacheKey = 'risk_alerts';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Return mock data if Supabase is not configured
    if (!isSupabaseConfigured) {
      const mockData = {
        alerts: [
          {
            id: 'alert1',
            title: 'High Drawdown Alert',
            message: 'User has exceeded 4.5% drawdown on open positions ending November 2025',
            severity: 'high',
            userId: 'user123',
            userEmail: 'trader@example.com',
            triggeredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            status: 'active'
          },
          {
            id: 'alert2',
            title: 'Exposure Limit Warning',
            message: 'User approaching 12% exposure limit (current: 11.8%)',
            severity: 'medium',
            userId: 'user456',
            userEmail: 'investor@example.com',
            triggeredAt: new Date(Date.now() - 300000).toISOString(),
            createdAt: new Date(Date.now() - 300000).toISOString(),
            status: 'active'
          }
        ],
        recentEvents: [
          {
            description: 'Auto-closed position due to drawdown',
            userId: 'user123',
            userEmail: 'trader@example.com',
            type: 'auto_close',
            value: '$250.00 loss',
            timestamp: new Date().toISOString()
          },
          {
            description: 'Trade blocked due to exposure limit',
            userId: 'user789',
            userEmail: 'trader2@example.com',
            type: 'exposure_block',
            value: '15.2% exposure',
            timestamp: new Date(Date.now() - 600000).toISOString()
          },
          {
            description: 'Daily loss limit reached',
            userId: 'user456',
            userEmail: 'investor@example.com',
            type: 'daily_limit',
            value: '5.1% loss',
            timestamp: new Date(Date.now() - 900000).toISOString()
          }
        ],
        summary: {
          totalAlerts: 2,
          criticalAlerts: 0,
          highAlerts: 1,
          mediumAlerts: 1,
          lowAlerts: 0
        }
      };

      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Get active alerts from Supabase
    const { data: alerts, error: alertsError } = await supabase
      .from('risk_alerts')
      .select(`
        *,
        user:user_id (
          email
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching risk alerts:', alertsError);
    }

    // Get recent risk events
    const { data: events, error: eventsError } = await supabase
      .from('risk_events')
      .select(`
        *,
        user:user_id (
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      console.error('Error fetching risk events:', eventsError);
    }

    // Calculate summary
    const alertCounts = (alerts || []).reduce((acc, alert) => {
      acc[`${alert.severity}Alerts`] = (acc[`${alert.severity}Alerts`] || 0) + 1;
      return acc;
    }, { totalAlerts: alerts?.length || 0 });

    const responseData = {
      alerts: (alerts || []).map(alert => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        userId: alert.user_id,
        userEmail: alert.user?.email,
        triggeredAt: alert.triggered_at,
        createdAt: alert.created_at,
        status: alert.status
      })),
      recentEvents: (events || []).map(event => ({
        description: event.description,
        userId: event.user_id,
        userEmail: event.user?.email,
        type: event.event_type,
        value: event.value,
        timestamp: event.created_at
      })),
      summary: alertCounts
    };

    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Risk alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk alerts', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, message: 'Alert updated (mock)' });
    }

    const body = await request.json();
    const { alertId, action, adminId } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'alertId and action are required' },
        { status: 400 }
      );
    }

    let updateData = {
      updated_at: new Date().toISOString()
    };

    if (action === 'dismiss') {
      updateData.status = 'dismissed';
      updateData.dismissed_by = adminId;
      updateData.dismissed_at = new Date().toISOString();
    } else if (action === 'acknowledge') {
      updateData.status = 'acknowledged';
      updateData.acknowledged_by = adminId;
      updateData.acknowledged_at = new Date().toISOString();
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "dismiss" or "acknowledge"' },
        { status: 400 }
      );
    }

    // Update alert status
    const { error } = await supabase
      .from('risk_alerts')
      .update(updateData)
      .eq('id', alertId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      );
    }

    // Clear cache
    cache.delete('risk_alerts');

    return NextResponse.json({
      success: true,
      message: `Alert ${action}d successfully`
    });

  } catch (error) {
    console.error('Risk alerts PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, message: 'Alert created (mock)' });
    }

    const body = await request.json();
    const { userId, title, message, severity, adminId } = body;

    if (!userId || !title || !message || !severity) {
      return NextResponse.json(
        { error: 'userId, title, message, and severity are required' },
        { status: 400 }
      );
    }

    // Create new alert
    const { error } = await supabase
      .from('risk_alerts')
      .insert({
        user_id: userId,
        title,
        message,
        severity,
        status: 'active',
        created_by: adminId,
        created_at: new Date().toISOString()
      });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create alert' },
        { status: 500 }
      );
    }

    // Clear cache
    cache.delete('risk_alerts');

    return NextResponse.json({
      success: true,
      message: 'Risk alert created successfully'
    });

  } catch (error) {
    console.error('Risk alerts POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert', message: error.message },
      { status: 500 }
    );
  }
}
