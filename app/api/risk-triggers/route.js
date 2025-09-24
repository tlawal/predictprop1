// Risk Triggers API - manages risk monitoring thresholds and configurations
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  try {
    const cacheKey = 'risk_triggers';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Return mock data if Supabase is not configured
    if (!isSupabaseConfigured) {
      const mockData = {
        thresholds: {
          drawdownPercent: 5,
          exposurePercent: 15,
          dailyLossPercent: 5,
          maxTradesPerDay: 50,
          alertEmail: 'admin@polyprop.com',
          autoCloseEnabled: true,
          emailAlertsEnabled: true,
          smsAlertsEnabled: false
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      };

      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Get risk thresholds from Supabase
    const { data: thresholds, error } = await supabase
      .from('risk_thresholds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching risk thresholds:', error);
    }

    const responseData = thresholds || {
      thresholds: {
        drawdownPercent: 5,
        exposurePercent: 15,
        dailyLossPercent: 5,
        maxTradesPerDay: 50,
        alertEmail: 'admin@polyprop.com',
        autoCloseEnabled: true,
        emailAlertsEnabled: true,
        smsAlertsEnabled: false
      },
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system'
    };

    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Risk triggers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk triggers', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, message: 'Risk thresholds updated (mock)' });
    }

    const body = await request.json();
    const { adminId, thresholds } = body;

    if (!adminId || !thresholds) {
      return NextResponse.json(
        { error: 'adminId and thresholds are required' },
        { status: 400 }
      );
    }

    // Save risk thresholds to Supabase
    const { error } = await supabase
      .from('risk_thresholds')
      .insert({
        admin_id: adminId,
        thresholds: thresholds,
        created_at: new Date().toISOString()
      });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save risk thresholds' },
        { status: 500 }
      );
    }

    // Clear cache
    cache.delete('risk_triggers');

    return NextResponse.json({
      success: true,
      message: 'Risk thresholds updated successfully'
    });

  } catch (error) {
    console.error('Risk triggers POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update risk thresholds', message: error.message },
      { status: 500 }
    );
  }
}
