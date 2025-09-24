// Affiliates API - manages referral codes, payouts, and custom URLs
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const cacheKey = `affiliates_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Return mock data if Supabase is not configured
    if (!isSupabaseConfigured) {
      const mockData = {
        affiliateCode: `PRED${userId.slice(-4).toUpperCase()}`,
        referralUrl: `https://polyprop.com/join?ref=PRED${userId.slice(-4).toUpperCase()}`,
        customUrl: null,
        tier: 'bronze',
        tierPayout: 5,
        totalReferrals: Math.floor(Math.random() * 50),
        activeReferrals: Math.floor(Math.random() * 20),
        totalEarned: Math.floor(Math.random() * 500),
        pendingPayout: Math.floor(Math.random() * 50),
        tierRequirements: {
          bronze: { referrals: 0, volume: 0 },
          silver: { referrals: 10, volume: 1000 },
          gold: { referrals: 50, volume: 10000 },
          platinum: { referrals: 100, volume: 50000 }
        },
        recentReferrals: [
          { id: 'ref1', email: 'user1@example.com', joinedAt: new Date().toISOString(), status: 'active' },
          { id: 'ref2', email: 'user2@example.com', joinedAt: new Date(Date.now() - 86400000).toISOString(), status: 'active' }
        ]
      };

      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData);
    }

    // Get user affiliate data from Supabase
    const { data: affiliateData, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (affiliateError && affiliateError.code !== 'PGRST116') {
      console.error('Error fetching affiliate data:', affiliateError);
    }

    // Generate affiliate code if it doesn't exist
    let affiliateCode = affiliateData?.code;
    if (!affiliateCode) {
      affiliateCode = `PRED${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Save to database
      const { error: insertError } = await supabase
        .from('affiliates')
        .upsert({
          user_id: userId,
          code: affiliateCode,
          tier: 'bronze',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating affiliate record:', insertError);
      }
    }

    // Calculate tier based on referrals and volume
    const tier = calculateAffiliateTier(affiliateData);

    // Get referral statistics
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:users!referrals_referred_user_id_fkey(email)
      `)
      .eq('referrer_id', userId);

    const totalReferrals = referrals?.length || 0;
    const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0;

    // Calculate earnings (mock calculation)
    const totalEarned = calculateAffiliateEarnings(referrals || [], tier);
    const pendingPayout = Math.floor(totalEarned * 0.1); // 10% pending

    const responseData = {
      affiliateCode,
      referralUrl: `https://polyprop.com/join?ref=${affiliateCode}`,
      customUrl: affiliateData?.custom_url || null,
      tier,
      tierPayout: getTierPayout(tier),
      totalReferrals,
      activeReferrals,
      totalEarned,
      pendingPayout,
      tierRequirements: {
        bronze: { referrals: 0, volume: 0 },
        silver: { referrals: 10, volume: 1000 },
        gold: { referrals: 50, volume: 10000 },
        platinum: { referrals: 100, volume: 50000 }
      },
      recentReferrals: (referrals || []).slice(0, 5).map(ref => ({
        id: ref.id,
        email: ref.referred_user?.email || 'Unknown',
        joinedAt: ref.created_at,
        status: ref.status
      }))
    };

    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Affiliates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, message: 'Mock update successful' });
    }

    const body = await request.json();
    const { userId, customUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Update custom URL
    if (customUrl) {
      const { error } = await supabase
        .from('affiliates')
        .update({ custom_url: customUrl })
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update custom URL' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: customUrl ? 'Custom URL updated successfully' : 'Affiliate settings updated'
    });

  } catch (error) {
    console.error('Affiliates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate settings', message: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateAffiliateTier(affiliateData) {
  if (!affiliateData) return 'bronze';

  const referrals = affiliateData.total_referrals || 0;
  const volume = affiliateData.total_volume || 0;

  if (referrals >= 100 || volume >= 50000) return 'platinum';
  if (referrals >= 50 || volume >= 10000) return 'gold';
  if (referrals >= 10 || volume >= 1000) return 'silver';
  return 'bronze';
}

function getTierPayout(tier) {
  const payouts = {
    bronze: 5,
    silver: 10,
    gold: 15,
    platinum: 20
  };
  return payouts[tier] || 5;
}

function calculateAffiliateEarnings(referrals, tier) {
  const baseRate = getTierPayout(tier) / 100;
  let totalEarned = 0;

  referrals.forEach(ref => {
    if (ref.status === 'active') {
      // Mock earnings calculation based on referred user's activity
      totalEarned += Math.floor(Math.random() * 50) + 10;
    }
  });

  return totalEarned;
}
