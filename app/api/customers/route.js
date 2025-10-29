import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';

const DEFAULT_LIMIT = 25;

export async function GET(request) {
  try {
    requireAdmin();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const limit = clampLimit(searchParams.get('limit'));
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('users')
      .select(
        `
          id,
          email,
          full_name,
          customer_number,
          verified,
          blacklisted,
          notes,
          created_at,
          updated_at,
          affiliates:affiliates!affiliates_user_id_fkey (
            id,
            affiliate_id,
            contract_status,
            current_tier,
            referrals_count,
            payout_email,
            auto_withdraw_email,
            withdrawal_delay,
            withdrawal_threshold,
            promotion_info,
            custom_commission,
            custom_url,
            website
          )
        `,
        { count: 'exact' }
      );

    if (userId) {
      query = query.eq('id', userId).limit(1);
    } else {
      if (search) {
        const term = `%${search}%`;
        query = query.or(`email.ilike.${term},full_name.ilike.${term},customer_number.ilike.${term}`);
      }
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    if (userId) {
      if (!data?.length) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      const detail = await buildCustomerDetail(data[0]);
      return NextResponse.json({ customer: detail });
    }

    const summaries = await buildCustomerSummaries(data || []);
    return NextResponse.json({
      customers: summaries,
      total: count || summaries.length,
      pagination: buildPagination({ count: count || summaries.length, limit, offset })
    });
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load customers', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    requireAdmin();

    const body = await request.json();
    const { id, email, fullName, verified, blacklisted, customerNumber } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'Customer id is required' }, { status: 400 });
    }

    const updates = {};
    if (typeof email === 'string') updates.email = email.trim();
    if (typeof fullName === 'string') updates.full_name = fullName.trim();
    if (typeof verified === 'boolean') updates.verified = verified;
    if (typeof blacklisted === 'boolean') updates.blacklisted = blacklisted;
    if (typeof customerNumber === 'string' || customerNumber === null) updates.customer_number = customerNumber;

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No updates supplied' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, full_name, customer_number, verified, blacklisted, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, customer: data });
  } catch (error) {
    console.error('Customers PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    requireAdmin();

    const body = await request.json();
    const { action } = body || {};

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'update_details':
      case 'toggle_verified':
      case 'toggle_blacklisted':
        return handleCustomerUpdate(body);
      case 'add_prop_account':
        return handleAddPropAccount(body);
      case 'add_note':
        return handleAddNote(body);
      case 'merge_customers':
        return handleMergeCustomers(body);
      case 'revoke_affiliate':
        return handleRevokeAffiliate(body);
      case 'update_affiliate':
        return handleUpdateAffiliate(body);
      case 'add_competition':
        return handleAddCompetition(body);
      case 'impersonate_customer':
        return NextResponse.json({ success: false, message: 'Log in as client is not yet implemented' });
      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Customers POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process customer action', message: error.message },
      { status: 500 }
    );
  }
}

function requireAdmin() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase admin client is not configured');
  }
}

function clampLimit(value) {
  const parsed = parseInt(value || `${DEFAULT_LIMIT}`, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, 100);
}

function buildPagination({ count, limit, offset }) {
  return {
    limit,
    offset,
    total: count,
    hasMore: offset + limit < (count || 0)
  };
}

async function buildCustomerSummaries(users) {
  if (!users.length) return [];

  const userIds = users.map((user) => user.id);
  const affiliateIds = [];
  const affiliateKeyByUser = new Map();

  users.forEach((user) => {
    const affiliate = Array.isArray(user.affiliates) ? user.affiliates[0] : null;
    if (affiliate) {
      affiliateIds.push(affiliate.id);
      affiliateKeyByUser.set(user.id, affiliate.id);
    }
  });

  const [ordersRes, challengesRes, commissionsRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('user_id, amount, status')
      .in('user_id', userIds),
    supabaseAdmin
      .from('challenges')
      .select('user_id')
      .in('user_id', userIds),
    affiliateIds.length
      ? supabaseAdmin
          .from('affiliate_commissions')
          .select('affiliate_id, amount, status')
          .in('affiliate_id', affiliateIds)
      : Promise.resolve({ data: [] })
  ]);

  if (ordersRes.error) throw ordersRes.error;
  if (challengesRes.error) throw challengesRes.error;
  if (commissionsRes.error) throw commissionsRes.error;

  const orderMap = new Map();
  (ordersRes.data || []).forEach((order) => {
    const list = orderMap.get(order.user_id) || [];
    list.push(order);
    orderMap.set(order.user_id, list);
  });

  const challengeCount = new Map();
  (challengesRes.data || []).forEach((challenge) => {
    challengeCount.set(challenge.user_id, (challengeCount.get(challenge.user_id) || 0) + 1);
  });

  const commissionMap = new Map();
  (commissionsRes.data || []).forEach((commission) => {
    const bucket = commissionMap.get(commission.affiliate_id) || { total: 0, paid: 0 };
    const amount = Number(commission.amount || 0);
    bucket.total += amount;
    if (commission.status === 'paid') bucket.paid += amount;
    commissionMap.set(commission.affiliate_id, bucket);
  });

  return users.map((user) => {
    const orders = orderMap.get(user.id) || [];
    const affiliateId = affiliateKeyByUser.get(user.id);
    const affiliate = Array.isArray(user.affiliates) ? user.affiliates[0] : null;
    const commissions = affiliateId ? commissionMap.get(affiliateId) : null;

    const revenue = orders
      .filter((order) => order.status === 'completed')
      .reduce((sum, order) => sum + Number(order.amount || 0), 0);

    return {
      id: user.id,
      name: user.full_name || null,
      email: user.email,
      customerNumber: user.customer_number || null,
      verified: !!user.verified,
      blacklisted: !!user.blacklisted,
      notes: Array.isArray(user.notes) ? user.notes : [],
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      totals: {
        orders: orders.length,
        revenue,
        challenges: challengeCount.get(user.id) || 0,
        commissionsEarned: commissions?.total || 0,
        commissionsPaid: commissions?.paid || 0
      },
      affiliate: affiliate
        ? {
            id: affiliate.id,
            code: affiliate.affiliate_id,
            contractStatus: affiliate.contract_status,
            currentTier: affiliate.current_tier,
            referralsCount: affiliate.referrals_count
          }
        : null
    };
  });
}

async function buildCustomerDetail(user) {
  const summary = (await buildCustomerSummaries([user]))[0];
  if (!summary) return null;

  const affiliate = Array.isArray(user.affiliates) ? user.affiliates[0] : null;

  if (!affiliate) {
    return summary;
  }

  const [commissionsRes, referralsRes, referredOrdersRes, tiersRes] = await Promise.all([
    supabaseAdmin
      .from('affiliate_commissions')
      .select('id, amount, status, manual, note, created_at, paid_at, order_id')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('affiliate_referrals')
      .select('id, referred_user_id, amount, level, created_at')
      .eq('affiliate_id', affiliate.id),
    supabaseAdmin
      .from('orders')
      .select('id, user_id, plan_id, amount, status, created_at')
      .eq('affiliate_id', affiliate.id),
    supabaseAdmin
      .from('affiliate_tiers')
      .select('*')
      .order('level', { ascending: true })
  ]);

  if (commissionsRes.error) throw commissionsRes.error;
  if (referralsRes.error) throw referralsRes.error;
  if (referredOrdersRes.error) throw referredOrdersRes.error;
  if (tiersRes.error) throw tiersRes.error;

  const commissions = commissionsRes.data || [];
  const totalCommissions = commissions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalPaid = commissions
    .filter((row) => row.status === 'paid')
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const revenueGenerated = (referredOrdersRes.data || [])
    .filter((order) => order.status === 'completed')
    .reduce((sum, order) => sum + Number(order.amount || 0), 0);

  const indirectRevenue = (referralsRes.data || [])
    .filter((referral) => referral.level > 1)
    .reduce((sum, referral) => sum + Number(referral.amount || 0), 0);

  const latestPaid = commissions
    .filter((row) => row.status === 'paid')
    .map((row) => row.paid_at || row.created_at)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  const nextWithdrawalDate = latestPaid && affiliate.withdrawal_delay
    ? dayjs(latestPaid).add(Number(affiliate.withdrawal_delay || 0), 'day').toISOString()
    : null;

  return {
    ...summary,
    affiliate: {
      ...summary.affiliate,
      payoutEmail: affiliate.payout_email,
      autoWithdrawEmail: affiliate.auto_withdraw_email,
      withdrawalDelay: affiliate.withdrawal_delay,
      withdrawalThreshold: affiliate.withdrawal_threshold,
      promotionInfo: affiliate.promotion_info,
      customCommission: affiliate.custom_commission,
      customUrl: affiliate.custom_url,
      website: affiliate.website,
      metrics: {
        totalCommissionsEarned: totalCommissions,
        totalPaidOut: totalPaid,
        availablePayout: totalCommissions - totalPaid,
        revenueGenerated,
        indirectRevenue,
        nextWithdrawalDate
      },
      tiers: tiersRes.data || [],
      recentCommissions: commissions.slice(0, 5),
      recentReferrals: (referralsRes.data || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    }
  };
}

async function handleCustomerUpdate(payload) {
  const { id, verified, blacklisted, email, fullName, customerNumber } = payload || {};

  if (!id) {
    return NextResponse.json({ error: 'Customer id is required' }, { status: 400 });
  }

  const updates = {};
  if (typeof verified === 'boolean') updates.verified = verified;
  if (typeof blacklisted === 'boolean') updates.blacklisted = blacklisted;
  if (typeof email === 'string') updates.email = email.trim();
  if (typeof fullName === 'string') updates.full_name = fullName.trim();
  if (typeof customerNumber === 'string' || customerNumber === null) updates.customer_number = customerNumber;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('users').update(updates).eq('id', id);

  if (error) {
    console.error('handleCustomerUpdate error:', error);
    return NextResponse.json({ error: 'Failed to update customer', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function handleAddPropAccount(payload) {
  const { userId, planType, balance, params, status } = payload || {};

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const insert = {
    user_id: userId,
    plan_type: planType || '1-step',
    balance: balance != null ? Number(balance) : 0,
    params: params || {
      profit_target: 10,
      drawdown_max: 5,
      exposure_cap: 15
    },
    status: status || 'active'
  };

  const { data, error } = await supabaseAdmin
    .from('challenges')
    .insert(insert)
    .select('id')
    .single();

  if (error) {
    console.error('handleAddPropAccount error:', error);
    return NextResponse.json({ error: 'Failed to add prop account', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, challengeId: data?.id });
}

async function handleAddNote(payload) {
  const { userId, note, author } = payload || {};

  if (!userId || !note) {
    return NextResponse.json({ error: 'userId and note are required' }, { status: 400 });
  }

  const entry = {
    text: note,
    author: author || 'system',
    createdAt: new Date().toISOString()
  };

  const { error } = await supabaseAdmin.rpc('add_customer_note', {
    target_user_id: userId,
    note: entry
  });

  if (error) {
    console.error('handleAddNote error:', error);
    return NextResponse.json({ error: 'Failed to add note', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, note: entry });
}

async function handleMergeCustomers(payload) {
  const { sourceUserId, targetUserId } = payload || {};

  if (!sourceUserId || !targetUserId) {
    return NextResponse.json({ error: 'sourceUserId and targetUserId are required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.rpc('merge_customers', {
    source_user_id: sourceUserId,
    target_user_id: targetUserId
  });

  if (error) {
    console.error('handleMergeCustomers error:', error);
    return NextResponse.json({ error: 'Failed to merge customers', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function handleRevokeAffiliate(payload) {
  const { affiliateId } = payload || {};

  if (!affiliateId) {
    return NextResponse.json({ error: 'affiliateId is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('affiliates')
    .update({ contract_status: 'revoked' })
    .eq('id', affiliateId);

  if (error) {
    console.error('handleRevokeAffiliate error:', error);
    return NextResponse.json({ error: 'Failed to revoke affiliate', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function handleUpdateAffiliate(payload) {
  const {
    affiliateId,
    payoutEmail,
    autoWithdrawEmail,
    websiteUrl,
    withdrawalDelay,
    withdrawalThreshold,
    customCommission,
    promotionInfo,
    customUrl
  } = payload || {};

  if (!affiliateId) {
    return NextResponse.json({ error: 'affiliateId is required' }, { status: 400 });
  }

  const updates = {};
  if (typeof payoutEmail === 'string') updates.payout_email = payoutEmail.trim() || null;
  if (typeof autoWithdrawEmail === 'string') updates.auto_withdraw_email = autoWithdrawEmail.trim() || null;
  if (typeof websiteUrl === 'string') updates.website = websiteUrl.trim() || null;
  if (typeof promotionInfo === 'string') updates.promotion_info = promotionInfo;
  if (typeof withdrawalDelay === 'number') updates.withdrawal_delay = withdrawalDelay;
  if (typeof withdrawalThreshold === 'number') updates.withdrawal_threshold = withdrawalThreshold;
  if (typeof customUrl === 'string') updates.custom_url = customUrl.trim() || null;
  if (customCommission !== undefined) updates.custom_commission = customCommission;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No affiliate updates provided' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('affiliates').update(updates).eq('id', affiliateId);

  if (error) {
    console.error('handleUpdateAffiliate error:', error);
    return NextResponse.json({ error: 'Failed to update affiliate', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function handleAddCompetition(payload) {
  const { userId, competitionId } = payload || {};

  if (!userId || !competitionId) {
    return NextResponse.json({ error: 'userId and competitionId are required' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('competition_participants')
    .select('id')
    .eq('competition_id', competitionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('handleAddCompetition check error:', existingError);
    return NextResponse.json({ error: 'Failed to verify competition entry', message: existingError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ success: true, message: 'Customer already in competition' });
  }

  const { error } = await supabaseAdmin
    .from('competition_participants')
    .insert({ competition_id: competitionId, user_id: userId, joined_at: new Date().toISOString() });

  if (error) {
    console.error('handleAddCompetition error:', error);
    return NextResponse.json({ error: 'Failed to add to competition', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
