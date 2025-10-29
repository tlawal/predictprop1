// Affiliates API - manages referral codes, payouts, and custom URLs
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const TIER_LABELS = ['bronze', 'silver', 'gold', 'platinum'];

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

    const data = await buildAffiliatePayload(userId, { useCache: true });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Affiliates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, customUrl, payoutEmail, autoWithdrawEmail, withdrawalDelay, withdrawalThreshold, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ success: true, message: 'Mock update successful' });
    }

    const affiliate = await ensureAffiliate(userId);

    const updates = {};
    if (typeof customUrl === 'string') updates.custom_url = customUrl.trim() || null;
    if (typeof payoutEmail === 'string') updates.payout_email = payoutEmail.trim() || null;
    if (typeof autoWithdrawEmail === 'string') updates.auto_withdraw_email = autoWithdrawEmail.trim() || null;
    if (typeof withdrawalDelay === 'number') updates.withdrawal_delay = withdrawalDelay;
    if (typeof withdrawalThreshold === 'number') updates.withdrawal_threshold = withdrawalThreshold;
    if (typeof notes === 'string') updates.notes = notes;

    if (Object.keys(updates).length) {
      const { error: updateError } = await supabaseAdmin
        .from('affiliates')
        .update(updates)
        .eq('id', affiliate.id);

      if (updateError) {
        console.error('Failed updating affiliate settings:', updateError);
        return NextResponse.json(
          { error: 'Failed to update affiliate settings', message: updateError.message },
          { status: 500 }
        );
      }
    }

    invalidateCache(userId);
    const refreshed = await buildAffiliatePayload(userId, { useCache: true });

    return NextResponse.json({ success: true, data: refreshed });
  } catch (error) {
    console.error('Affiliates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate settings', message: error.message },
      { status: 500 }
    );
  }
}

async function buildAffiliatePayload(userId, { useCache = false } = {}) {
  const cacheKey = `affiliate:${userId}`;

  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    const mockData = {
      affiliateCode: `PRED${userId.slice(-4).toUpperCase()}`,
      referralUrl: `https://polyprop.com/join?ref=PRED${userId.slice(-4).toUpperCase()}`,
      customUrl: null,
      tier: 'bronze',
      tierPayout: 5,
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarned: 0,
      pendingPayout: 0,
      tierRequirements: getMockTierRequirements(),
      recentReferrals: []
    };

    if (useCache) {
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
    }
    return mockData;
  }

  const affiliate = await ensureAffiliate(userId);
  const tiers = await fetchAffiliateTiers();
  const tierRequirements = formatTierRequirements(tiers);

  const tierIndex = Math.max(0, Math.min(TIER_LABELS.length - 1, (affiliate?.current_tier || 1) - 1));
  const currentTier = tiers.find(tier => tier.level === (affiliate?.current_tier || 1));
  const tierLabel = TIER_LABELS[tierIndex] || `tier_${affiliate?.current_tier || 1}`;
  const tierPayout = currentTier?.payout_percent ? Number(currentTier.payout_percent) : 0;

  const { totalReferrals, activeReferrals, totalEarned, pendingPayout } = await fetchAffiliateStats(affiliate.id);
  const recentReferrals = await fetchRecentReferrals(affiliate.id);

  const payload = {
    affiliateCode: affiliate.affiliate_id,
    referralUrl: buildReferralUrl(affiliate.affiliate_id, affiliate.custom_url),
    customUrl: affiliate.custom_url,
    tier: tierLabel,
    tierPayout,
    totalReferrals: affiliate.referrals_count ?? totalReferrals,
    activeReferrals,
    totalEarned,
    pendingPayout,
    tierRequirements,
    recentReferrals
  };

  cache.set(cacheKey, { data: payload, timestamp: Date.now() });
  return payload;
}

async function ensureAffiliate(userId) {
  const { data: existing, error } = await supabaseAdmin
    .from('affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (existing) {
    return existing;
  }

  const affiliateId = await generateUniqueAffiliateId();

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('affiliates')
    .insert({
      user_id: userId,
      affiliate_id: affiliateId
    })
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}

async function generateUniqueAffiliateId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `PRED${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const { data } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('affiliate_id', candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique affiliate code');
}

async function fetchAffiliateTiers() {
  const { data, error } = await supabaseAdmin
    .from('affiliate_tiers')
    .select('*')
    .order('level', { ascending: true });

  if (error) {
    console.error('Failed to load affiliate tiers:', error);
    return [];
  }

  return data || [];
}

async function fetchAffiliateStats(affiliateId) {
  const [total, active, commissions] = await Promise.all([
    supabaseAdmin
      .from('affiliate_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId),
    supabaseAdmin
      .from('affiliate_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId)
      .gt('amount', 0),
    supabaseAdmin
      .from('affiliate_commissions')
      .select('amount, status')
      .eq('affiliate_id', affiliateId)
  ]);

  const totalReferrals = total?.count ?? 0;
  const activeReferrals = active?.count ?? 0;

  const totalEarned = (commissions?.data || []).reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const pendingPayout = (commissions?.data || []).reduce((sum, record) => {
    if (record.status === 'pending') {
      return sum + Number(record.amount || 0);
    }
    return sum;
  }, 0);

  return {
    totalReferrals,
    activeReferrals,
    totalEarned,
    pendingPayout
  };
}

async function fetchRecentReferrals(affiliateId) {
  const { data, error } = await supabaseAdmin
    .from('affiliate_referrals')
    .select(`
      id,
      created_at,
      amount,
      level,
      referred_user:users!affiliate_referrals_referred_user_id_fkey(email)
    `)
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Failed to load recent referrals:', error);
    return [];
  }

  return (data || []).map(ref => ({
    id: ref.id,
    email: ref.referred_user?.email || 'Unknown',
    joinedAt: ref.created_at,
    status: Number(ref.amount || 0) > 0 ? 'paid' : 'pending'
  }));
}

function formatTierRequirements(tiers) {
  if (!tiers.length) {
    return getMockTierRequirements();
  }

  return tiers.reduce((acc, tier, idx) => {
    const label = TIER_LABELS[idx] || `tier_${tier.level}`;
    acc[label] = {
      referrals: tier.referral_threshold,
      volume: tier.direct_passup ?? 0
    };
    return acc;
  }, {});
}

function getMockTierRequirements() {
  return {
    bronze: { referrals: 0, volume: 0 },
    silver: { referrals: 5, volume: 0 },
    gold: { referrals: 15, volume: 0 },
    platinum: { referrals: 30, volume: 0 }
  };
}

function buildReferralUrl(affiliateCode, customUrl) {
  if (customUrl) {
    return `https://polyprop.com/${customUrl}`;
  }
  return `https://polyprop.com/join?ref=${affiliateCode}`;
}

function invalidateCache(userId) {
  const cacheKey = `affiliate:${userId}`;
  cache.delete(cacheKey);
}
