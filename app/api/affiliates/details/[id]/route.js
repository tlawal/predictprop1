import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../../lib/supabase';

const DEFAULT_TIERS = [
  { level: 1, referral_threshold: 0, payout_percent: 5, direct_passup: 0, indirect_passup: 0 },
  { level: 2, referral_threshold: 10, payout_percent: 10, direct_passup: 5, indirect_passup: 2 },
  { level: 3, referral_threshold: 50, payout_percent: 15, direct_passup: 10, indirect_passup: 5 },
  { level: 4, referral_threshold: 100, payout_percent: 20, direct_passup: 15, indirect_passup: 10 }
];

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(mockResponse(params?.id));
    }

    ensureSupabase();

    const affiliateId = params?.id;
    if (!affiliateId) {
      return NextResponse.json({ error: 'Affiliate id is required' }, { status: 400 });
    }

async function fetchAffiliateOrders(affiliateId) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_id, amount, status, created_at')
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data || []).map((order) => ({
    id: order.id,
    orderRef: order.order_id || order.id,
    amount: roundCurrency(order.amount || 0),
    status: order.status,
    createdAt: order.created_at
  }));
}

    const affiliate = await fetchAffiliateDetail(affiliateId);
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const [totals, tiers, orders] = await Promise.all([
      computeFinancialMetrics(affiliate),
      buildTierLadder(affiliate),
      fetchAffiliateOrders(affiliate.id)
    ]);

    return NextResponse.json({
      affiliate: {
        ...affiliate,
        totals,
        referralUrls: buildReferralUrls(affiliate.affiliateCode, affiliate.customUrl),
        recentOrders: orders
      },
      tiers
    });
  } catch (error) {
    console.error('Affiliate details GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load affiliate details', message: error.message },
      { status: error.statusCode || 500 }
    );
  }
}

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    const error = new Error('Supabase admin client is not configured');
    error.statusCode = 500;
    throw error;
  }
}

async function fetchAffiliateDetail(affiliateId) {
  const { data, error } = await supabaseAdmin
    .from('affiliates')
    .select(
      `
        id,
        user_id,
        affiliate_id,
        custom_name,
        notes,
        promotion_method,
        promotion_info,
        name,
        email,
        phone,
        payout_email,
        auto_withdraw_email,
        website,
        custom_url,
        current_tier,
        referrals_count,
        contract_status,
        withdrawal_delay,
        withdrawal_threshold,
        custom_commission,
        created_at,
        approved_at,
        users:user_id (
          email,
          full_name,
          customer_number
        )
      `
    )
    .eq('id', affiliateId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    affiliateCode: data.affiliate_id,
    customName: data.custom_name,
    notes: data.notes,
    promotionMethod: data.promotion_method,
    promotionInfo: data.promotion_info,
    name: data.name,
    email: data.email,
    phone: data.phone,
    payoutEmail: data.payout_email,
    autoWithdrawEmail: data.auto_withdraw_email,
    websiteUrl: data.website,
    customUrl: data.custom_url,
    currentTier: data.current_tier,
    referralsCount: data.referrals_count ?? 0,
    contractStatus: data.contract_status,
    withdrawalDelay: safeNumber(data.withdrawal_delay, 0),
    withdrawalThreshold: safeNumber(data.withdrawal_threshold, 0),
    customCommission: data.custom_commission,
    createdAt: data.created_at,
    approvedAt: data.approved_at,
    customer: {
      id: data.user_id,
      email: data.users?.email || null,
      fullName: data.users?.full_name || null,
      customerNumber: data.users?.customer_number || null
    }
  };
}

async function computeFinancialMetrics(affiliate) {
  const commissions = await fetchCommissionRows(affiliate.id);

  let totalEarned = 0;
  let totalPaid = 0;
  let lastPaidAt = null;

  commissions.forEach((commission) => {
    const amount = Number(commission.amount || 0);
    if (commission.status === 'earned') {
      totalEarned += amount;
    }
    if (commission.status === 'paid') {
      totalEarned += amount;
      totalPaid += amount;
      const paidTimestamp = commission.paid_at || commission.created_at;
      if (paidTimestamp && (!lastPaidAt || new Date(paidTimestamp) > new Date(lastPaidAt))) {
        lastPaidAt = paidTimestamp;
      }
    }
  });

  const directRevenue = await sumOrderAmounts(await getUserIdsByLevel(affiliate.userId, 1));
  const downlineRevenue = await sumOrderAmounts(await getUserIdsByLevel(affiliate.userId, 4, { minLevel: 2 }));

  const availablePayout = Math.max(0, totalEarned - totalPaid);
  const nextWithdrawal = resolveNextWithdrawalDate({
    lastPaidAt,
    delayDays: affiliate.withdrawalDelay
  });

  return {
    totalCommissionsEarned: roundCurrency(totalEarned),
    totalPaidOut: roundCurrency(totalPaid),
    availablePayout: roundCurrency(availablePayout),
    revenueGenerated: roundCurrency(directRevenue),
    indirectRevenueGenerated: roundCurrency(downlineRevenue),
    nextAvailableWithdrawalDate: nextWithdrawal
  };
}

async function fetchCommissionRows(affiliateId) {
  const { data, error } = await supabaseAdmin
    .from('commissions')
    .select('amount, status, paid_at, created_at')
    .eq('affiliate_id', affiliateId);

  if (error) {
    throw error;
  }

  return data || [];
}

async function getUserIdsByLevel(rootUserId, maxDepth, options = {}) {
  const { minLevel = 1 } = options;
  const visited = new Set([rootUserId]);
  const results = new Set();

  let frontier = [rootUserId];

  for (let level = 1; level <= maxDepth && frontier.length; level += 1) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .in('referrer_id', frontier);

    if (error) {
      throw error;
    }

    const childIds = (data || [])
      .map((row) => row.id)
      .filter((id) => id && !visited.has(id));

    childIds.forEach((id) => visited.add(id));

    if (level >= minLevel) {
      childIds.forEach((id) => results.add(id));
    }

    frontier = childIds;
  }

  return Array.from(results);
}

async function sumOrderAmounts(userIds) {
  if (!userIds.length) {
    return 0;
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('amount, status')
    .in('user_id', userIds)
    .eq('status', 'completed');

  if (error) {
    throw error;
  }

  return (data || []).reduce((sum, order) => sum + Number(order.amount || 0), 0);
}

async function buildTierLadder(affiliate) {
  const { data, error } = await supabaseAdmin
    .from('tiers')
    .select('level, referral_threshold, payout_percent, direct_passup, indirect_passup')
    .order('level', { ascending: true });

  if (error) {
    throw error;
  }

  const base = (data && data.length ? data : DEFAULT_TIERS);
  const overrides = parseCustomCommission(affiliate.customCommission);

  return base.map((tier) => {
    const override = overrides?.[tier.level];
    return {
      level: tier.level,
      referralThreshold: safeNumber(override?.referral_threshold, tier.referral_threshold),
      payoutPercent: safeNumber(override?.payout_percent, tier.payout_percent),
      directPassup: safeNumber(override?.direct_passup, tier.direct_passup),
      indirectPassup: safeNumber(override?.indirect_passup, tier.indirect_passup)
    };
  });
}

function parseCustomCommission(customValue) {
  if (!customValue) return null;
  try {
    if (typeof customValue === 'string') {
      return JSON.parse(customValue);
    }
    return customValue;
  } catch (error) {
    console.warn('Failed to parse custom_commission JSON:', error);
    return null;
  }
}

function buildReferralUrls(affiliateCode, customUrl) {
  const baseDomain = 'https://polyprop.com';
  return {
    defaultUrl: `${baseDomain}/?aff=${affiliateCode}`,
    customUrl: customUrl ? `${baseDomain}/${customUrl}` : null
  };
}

function resolveNextWithdrawalDate({ lastPaidAt, delayDays }) {
  if (delayDays == null) {
    return null;
  }
  const delay = Number(delayDays) || 0;
  const base = lastPaidAt ? dayjs(lastPaidAt) : dayjs();
  return base.add(delay, 'day').toISOString();
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function mockResponse(affiliateId) {
  const totals = {
    totalCommissionsEarned: 0,
    totalPaidOut: 0,
    availablePayout: 0,
    revenueGenerated: 0,
    indirectRevenueGenerated: 0,
    nextAvailableWithdrawalDate: null
  };

  return {
    affiliate: {
      id: affiliateId || 'mock-affiliate-id',
      userId: 'mock-user-id',
      affiliateCode: 'AFF-MOCK',
      customName: 'Demo Affiliate',
      notes: '',
      promotionMethod: null,
      promotionInfo: null,
      name: 'Mock Affiliate',
      email: 'affiliate@example.com',
      phone: null,
      payoutEmail: 'payout@example.com',
      autoWithdrawEmail: null,
      websiteUrl: 'https://example.com',
      customUrl: null,
      currentTier: 1,
      referralsCount: 0,
      contractStatus: 'pending',
      withdrawalDelay: 7,
      withdrawalThreshold: 100,
      customCommission: null,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      customer: {
        id: 'mock-user-id',
        email: 'customer@example.com',
        fullName: 'Mock Customer',
        customerNumber: '0000'
      },
      totals,
      referralUrls: buildReferralUrls('AFF-MOCK', null),
      recentOrders: []
    },
    tiers: DEFAULT_TIERS.map((tier) => ({
      level: tier.level,
      referralThreshold: tier.referral_threshold,
      payoutPercent: tier.payout_percent,
      directPassup: tier.direct_passup,
      indirectPassup: tier.indirect_passup
    }))
  };
}
