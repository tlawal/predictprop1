import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

const TIER_LABELS = ['bronze', 'silver', 'gold', 'platinum'];
const DEFAULT_LIMIT = 25;

export async function GET(request) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = clampLimit(searchParams.get('limit'));
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;
    const search = searchParams.get('search');

    let baseQuery = supabaseAdmin
      .from('affiliates')
      .select(
        `
          id,
          affiliate_id,
          user_id,
          custom_name,
          custom_url,
          contract_status,
          current_tier,
          referrals_count,
          payout_email,
          auto_withdraw_email,
          withdrawal_delay,
          withdrawal_threshold,
          notes,
          created_at,
          updated_at,
          users:user_id (
            email
          )
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const term = `%${search}%`;
      baseQuery = baseQuery.or(
        `affiliate_id.ilike.${term},custom_name.ilike.${term},users.email.ilike.${term}`
      );
    }

    const { data: affiliates, error, count } = await baseQuery;

    if (error) {
      console.error('Admin affiliates GET error:', error);
      return NextResponse.json(
        { error: 'Failed to load affiliates', message: error.message },
        { status: 500 }
      );
    }

    if (!affiliates?.length) {
      return NextResponse.json({
        affiliates: [],
        metrics: {
          totalAffiliates: count || 0,
          totalPendingPayout: 0,
          totalEarned: 0,
          totalReferrals: 0
        },
        pagination: buildPagination({ count: count || 0, limit, offset })
      });
    }

    const affiliateIds = affiliates.map((affiliate) => affiliate.id);

    const [commissionsRes, referralsRes] = await Promise.all([
      supabaseAdmin
        .from('affiliate_commissions')
        .select('id, affiliate_id, amount, status, manual, created_at, order_id, note')
        .in('affiliate_id', affiliateIds)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('affiliate_referrals')
        .select(
          `
            id,
            affiliate_id,
            amount,
            created_at,
            level,
            referred_user:users!affiliate_referrals_referred_user_id_fkey (email)
          `
        )
        .in('affiliate_id', affiliateIds)
        .order('created_at', { ascending: false })
    ]);

    if (commissionsRes.error) {
      console.error('Failed loading affiliate commissions:', commissionsRes.error);
      return NextResponse.json(
        {
          error: 'Failed to load affiliate commissions',
          message: commissionsRes.error.message
        },
        { status: 500 }
      );
    }

    if (referralsRes.error) {
      console.error('Failed loading affiliate referrals:', referralsRes.error);
      return NextResponse.json(
        {
          error: 'Failed to load affiliate referrals',
          message: referralsRes.error.message
        },
        { status: 500 }
      );
    }

    const commissionStats = aggregateCommissions(commissionsRes.data || []);
    const referralStats = aggregateReferrals(referralsRes.data || []);

    let totalPendingPayout = 0;
    let totalEarned = 0;
    let totalReferrals = 0;

    const responseAffiliates = affiliates.map((affiliate) => {
      const commissions = commissionStats.get(affiliate.id) || emptyCommissionStats();
      const referrals = referralStats.get(affiliate.id) || emptyReferralStats();

      const tierLevel = affiliate.current_tier || 1;
      const tierLabel = TIER_LABELS[tierLevel - 1] || `tier_${tierLevel}`;

      totalPendingPayout += commissions.pendingPayout;
      totalEarned += commissions.totalEarned;
      totalReferrals += referrals.totalReferrals || affiliate.referrals_count || 0;

      return {
        id: affiliate.id,
        affiliateCode: affiliate.affiliate_id,
        userId: affiliate.user_id,
        email: affiliate.users?.email || null,
        customName: affiliate.custom_name,
        customUrl: affiliate.custom_url,
        contractStatus: affiliate.contract_status,
        tier: {
          level: tierLevel,
          label: tierLabel
        },
        totals: {
          referrals: referrals.totalReferrals || affiliate.referrals_count || 0,
          activeReferrals: referrals.activeReferrals,
          totalEarned: commissions.totalEarned,
          pendingPayout: commissions.pendingPayout,
          manualCommissionTotal: commissions.manualTotal,
          lastReferralAt: referrals.lastReferralAt,
          lastCommissionAt: commissions.lastCommissionAt
        },
        payoutEmail: affiliate.payout_email,
        autoWithdrawEmail: affiliate.auto_withdraw_email,
        withdrawalDelay: affiliate.withdrawal_delay,
        withdrawalThreshold: affiliate.withdrawal_threshold,
        notes: affiliate.notes,
        recentReferrals: referrals.recentReferrals,
        recentCommissions: commissions.recentCommissions,
        metadata: {
          createdAt: affiliate.created_at,
          updatedAt: affiliate.updated_at
        }
      };
    });

    return NextResponse.json({
      affiliates: responseAffiliates,
      metrics: {
        totalAffiliates: count || responseAffiliates.length,
        totalPendingPayout,
        totalEarned,
        totalReferrals
      },
      pagination: buildPagination({ count: count || responseAffiliates.length, limit, offset })
    });
  } catch (error) {
    console.error('Admin affiliates handler error:', error);
    return NextResponse.json(
      { error: 'Unexpected error loading affiliates', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { affiliateId, amount, status = 'pending', notes, orderId } = body || {};

    if (!affiliateId || typeof amount !== 'number') {
      return NextResponse.json(
        {
          error: 'affiliateId and numeric amount are required'
        },
        { status: 400 }
      );
    }

    const validatedAmount = Number(amount);
    if (Number.isNaN(validatedAmount) || validatedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('id', affiliateId)
      .maybeSingle();

    if (affiliateError) {
      console.error('Affiliate lookup failed:', affiliateError);
      return NextResponse.json(
        { error: 'Failed to verify affiliate', message: affiliateError.message },
        { status: 500 }
      );
    }

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    const { data: commission, error: insertError } = await supabaseAdmin
      .from('affiliate_commissions')
      .insert({
        affiliate_id: affiliateId,
        amount: validatedAmount,
        status,
        manual: true,
        order_id: orderId || null,
        note: notes || null
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Failed to create manual commission:', insertError);
      return NextResponse.json(
        { error: 'Failed to create manual commission', message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, commission });
  } catch (error) {
    console.error('Admin affiliates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create manual commission', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { commissionId, status, notes } = body || {};

    if (!commissionId || !status) {
      return NextResponse.json(
        { error: 'commissionId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updatePayload = {
      status,
      note: notes ?? null
    };

    if (status === 'paid') {
      updatePayload.paid_at = new Date().toISOString();
    }

    const { data: commission, error: updateError } = await supabaseAdmin
      .from('affiliate_commissions')
      .update(updatePayload)
      .eq('id', commissionId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Failed updating commission:', updateError);
      return NextResponse.json(
        { error: 'Failed to update commission', message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, commission });
  } catch (error) {
    console.error('Admin affiliates PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update commission', message: error.message },
      { status: 500 }
    );
  }
}

function aggregateCommissions(commissions) {
  const map = new Map();

  commissions.forEach((commission) => {
    const bucket = map.get(commission.affiliate_id) || emptyCommissionStats();
    const amount = Number(commission.amount) || 0;

    if (bucket.recentCommissions.length < 5) {
      bucket.recentCommissions.push({
        id: commission.id,
        amount,
        status: commission.status,
        manual: commission.manual,
        createdAt: commission.created_at,
        orderId: commission.order_id,
        note: commission.note
      });
    }

    bucket.totalEarned += amount;

    if (commission.status === 'pending') {
      bucket.pendingPayout += amount;
    }

    if (commission.manual) {
      bucket.manualTotal += amount;
    }

    if (!bucket.lastCommissionAt || new Date(commission.created_at) > new Date(bucket.lastCommissionAt)) {
      bucket.lastCommissionAt = commission.created_at;
    }

    map.set(commission.affiliate_id, bucket);
  });

  return map;
}

function aggregateReferrals(referrals) {
  const map = new Map();

  referrals.forEach((referral) => {
    const bucket = map.get(referral.affiliate_id) || emptyReferralStats();
    const amount = Number(referral.amount) || 0;

    if (bucket.recentReferrals.length < 5) {
      bucket.recentReferrals.push({
        id: referral.id,
        amount,
        level: referral.level,
        email: referral.referred_user?.email || null,
        createdAt: referral.created_at,
        status: amount > 0 ? 'paid' : 'pending'
      });
    }

    bucket.totalReferrals += 1;

    if (amount > 0) {
      bucket.activeReferrals += 1;
    }

    if (!bucket.lastReferralAt || new Date(referral.created_at) > new Date(bucket.lastReferralAt)) {
      bucket.lastReferralAt = referral.created_at;
    }

    map.set(referral.affiliate_id, bucket);
  });

  return map;
}

function emptyCommissionStats() {
  return {
    totalEarned: 0,
    pendingPayout: 0,
    manualTotal: 0,
    lastCommissionAt: null,
    recentCommissions: []
  };
}

function emptyReferralStats() {
  return {
    totalReferrals: 0,
    activeReferrals: 0,
    lastReferralAt: null,
    recentReferrals: []
  };
}

function buildPagination({ count, limit, offset }) {
  const total = Number(count || 0);
  const currentOffset = Number(offset || 0);
  const currentLimit = Number(limit || DEFAULT_LIMIT);

  return {
    limit: currentLimit,
    offset: currentOffset,
    total,
    hasMore: currentOffset + currentLimit < total
  };
}

function clampLimit(rawLimit) {
  const parsed = parseInt(rawLimit || `${DEFAULT_LIMIT}`, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, 100);
}
