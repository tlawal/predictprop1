// Affiliates API - manages referral codes, payouts, and custom URLs
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const TIER_LABELS = ['bronze', 'silver', 'gold', 'platinum'];
const ADMIN_STATUS_FILTERS = ['approved', 'pending', 'rejected', 'revoked'];
const DEFAULT_LIST_LIMIT = 25;
const ADMIN_SORTABLE_FIELDS = ['created_at', 'referrals_count', 'current_tier'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (userId) {
    try {
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

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({
      affiliates: [],
      metrics: {
        totalAffiliates: 0,
        totalReferrals: 0,
        totalEarned: 0,
        totalPendingPayout: 0,
        totalApproved: 0,
        totalPending: 0
      },
      pagination: {
        limit: DEFAULT_LIST_LIMIT,
        offset: 0,
        total: 0,
        hasMore: false
      },
      settings: {
        autoApproveAffiliates: false,
        autoCreateContract: false
      }
    });
  }

  try {
    const response = await fetchAdminAffiliateList(searchParams);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin affiliates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load affiliates', message: error.message },
      { status: error.statusCode || 500 }
    );
  }
}

async function fetchAdminAffiliateList(searchParams) {
  ensureSupabase();

  const limit = clampListLimit(searchParams.get('limit'));
  const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;
  const statusParam = (searchParams.get('status') || 'all').toLowerCase();
  const sortParam = (searchParams.get('sort') || 'created_at').toLowerCase();
  const directionParam = (searchParams.get('direction') || 'desc').toLowerCase();
  const searchTerm = searchParams.get('search');

  const sortField = ADMIN_SORTABLE_FIELDS.includes(sortParam) ? sortParam : 'created_at';
  const ascending = directionParam === 'asc';

  let query = supabaseAdmin
    .from('affiliates')
    .select(
      `
        id,
        user_id,
        affiliate_id,
        custom_name,
        notes,
        name,
        email,
        phone,
        referrals_count,
        current_tier,
        website,
        promotion_method,
        custom_url,
        contract_status,
        created_at,
        approved_at,
        updated_at,
        payout_email,
        auto_withdraw_email,
        withdrawal_delay,
        withdrawal_threshold
      `,
      { count: 'exact' }
    );

  if (statusParam !== 'all' && ADMIN_STATUS_FILTERS.includes(statusParam)) {
    query = query.eq('contract_status', statusParam);
  }

  if (searchTerm) {
    const term = `%${searchTerm}%`;
    query = query.or(
      [
        `affiliate_id.ilike.${term}`,
        `custom_name.ilike.${term}`,
        `email.ilike.${term}`,
        `notes.ilike.${term}`,
        `name.ilike.${term}`
      ].join(',')
    );
  }

  query = query.order(sortField, { ascending, nullsFirst: ascending }).range(offset, offset + limit - 1);

  let affiliatesResult;
  try {
    affiliatesResult = await query;
  } catch (fetchError) {
    const error = fetchError || new Error('Failed to load affiliates');
    error.stage = 'affiliates';
    error.statusCode = error.statusCode || 500;
    throw error;
  }

  const { data, error, count } = affiliatesResult;

  if (error) {
    error.statusCode = 500;
    error.stage = 'affiliates';
    throw error;
  }

  const affiliateRows = data || [];
  const userIds = Array.from(new Set(affiliateRows.map((row) => row.user_id).filter(Boolean)));

  let usersById = new Map();
  if (userIds.length) {
    try {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, customer_number, full_name')
        .in('id', userIds);

      if (usersError) {
        if (usersError.code === '22P02') {
          console.warn('Skipping user hydration due to UUID mismatch in affiliates admin list');
        } else {
          usersError.statusCode = 500;
          usersError.stage = 'users';
          throw usersError;
        }
      }

      if (usersData) {
        usersById = new Map(usersData.map((user) => [user.id, user]));
      }
    } catch (usersQueryError) {
      const error = usersQueryError || new Error('Failed to load users');
      error.stage = error.stage || 'users';
      error.statusCode = error.statusCode || 500;
      throw error;
    }
  }

  const affiliateIds = affiliateRows.map((row) => row.id);

  const [commissionsRes, referralsRes, settings] = await Promise.all([
    affiliateIds.length
      ? supabaseAdmin
          .from('commissions')
          .select('id, affiliate_id, amount, status, manual, order_id, note, created_at')
          .in('affiliate_id', affiliateIds)
      : Promise.resolve({ data: [] }),
    affiliateIds.length
      ? supabaseAdmin
          .from('affiliate_referrals')
          .select(
            `
              id,
              affiliate_id,
              amount,
              level,
              created_at,
              referred_user:users!affiliate_referrals_referred_user_id_fkey(email)
            `
          )
          .in('affiliate_id', affiliateIds)
      : Promise.resolve({ data: [] }),
    loadAffiliateSettings()
  ]);

  if (commissionsRes.error) {
    commissionsRes.error.statusCode = 500;
    commissionsRes.error.stage = 'commissions';
    throw commissionsRes.error;
  }

  if (referralsRes.error) {
    referralsRes.error.statusCode = 500;
    referralsRes.error.stage = 'referrals';
    throw referralsRes.error;
  }

  const commissionStats = aggregateCommissions(commissionsRes.data || []);
  const referralStats = aggregateReferrals(referralsRes.data || []);

  const affiliates = affiliateRows.map((row) => {
    const relatedUser = usersById.get(row.user_id) || null;
    const commissions = commissionStats.get(row.id) || emptyCommissionStats();
    const referrals = referralStats.get(row.id) || emptyReferralStats();
    const tierLevel = Number(row.current_tier || 1);
    const tierLabel = TIER_LABELS[tierLevel - 1] || `tier_${tierLevel}`;

    return {
      id: row.id,
      userId: row.user_id,
      affiliateCode: row.affiliate_id,
      customerNumber: relatedUser?.customer_number || null,
      customerName: relatedUser?.full_name || row.name || null,
      email: row.email || relatedUser?.email || null,
      customName: row.custom_name || '',
      notes: row.notes || '',
      name: row.name || '',
      phone: row.phone || '',
      tier: {
        level: tierLevel,
        label: tierLabel
      },
      totals: {
        referrals: referrals.totalReferrals,
        activeReferrals: referrals.activeReferrals,
        totalEarned: commissions.totalEarned,
        pendingPayout: commissions.pendingPayout,
        manualCommissionTotal: commissions.manualTotal,
        lastReferralAt: referrals.lastReferralAt,
        lastCommissionAt: commissions.lastCommissionAt
      },
      payoutEmail: row.payout_email,
      autoWithdrawEmail: row.auto_withdraw_email,
      withdrawalThreshold: row.withdrawal_threshold,
      withdrawalDelay: row.withdrawal_delay,
      website: row.website,
      promotionMethod: row.promotion_method,
      customUrl: row.custom_url,
      contractStatus: row.contract_status,
      createdAt: row.created_at,
      approvedAt: row.approved_at,
      metadata: {
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      recentCommissions: commissions.recentCommissions,
      recentReferrals: referrals.recentReferrals
    };
  });

  const metrics = affiliates.reduce(
    (acc, affiliate) => {
      acc.totalAffiliates += 1;
      acc.totalReferrals += affiliate.totals.referrals;
      acc.totalEarned += affiliate.totals.totalEarned;
      acc.totalPendingPayout += affiliate.totals.pendingPayout;
      if (affiliate.contractStatus === 'approved') acc.totalApproved += 1;
      if (affiliate.contractStatus === 'pending') acc.totalPending += 1;
      return acc;
    },
    { totalAffiliates: 0, totalReferrals: 0, totalEarned: 0, totalPendingPayout: 0, totalApproved: 0, totalPending: 0 }
  );

  return {
    affiliates,
    metrics,
    pagination: {
      limit,
      offset,
      total: count || affiliates.length,
      hasMore: offset + limit < (count || 0)
    },
    settings
  };
}

function aggregateCommissions(records) {
  const stats = new Map();

  records.forEach((record) => {
    const affiliateId = record.affiliate_id;
    if (!affiliateId) return;

    const entry = stats.get(affiliateId) || emptyCommissionStats();
    const amount = Number(record.amount ?? 0);

    entry.totalEarned += amount;
    if (record.status === 'pending') {
      entry.pendingPayout += amount;
    }
    if (record.manual) {
      entry.manualTotal += amount;
    }

    const createdAtIso = record.created_at ? new Date(record.created_at).toISOString() : null;
    if (createdAtIso && (!entry.lastCommissionAt || createdAtIso > entry.lastCommissionAt)) {
      entry.lastCommissionAt = createdAtIso;
    }

    entry.recentCommissions = [...entry.recentCommissions, record]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    stats.set(affiliateId, entry);
  });

  return stats;
}

function aggregateReferrals(records) {
  const stats = new Map();

  records.forEach((record) => {
    const affiliateId = record.affiliate_id;
    if (!affiliateId) return;

    const entry = stats.get(affiliateId) || emptyReferralStats();

    entry.totalReferrals += 1;
    const amount = Number(record.amount ?? 0);
    if (amount > 0) {
      entry.activeReferrals += 1;
    }

    const createdAtIso = record.created_at ? new Date(record.created_at).toISOString() : null;
    if (createdAtIso && (!entry.lastReferralAt || createdAtIso > entry.lastReferralAt)) {
      entry.lastReferralAt = createdAtIso;
    }

    entry.recentReferrals = [...entry.recentReferrals, record]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    stats.set(affiliateId, entry);
  });

  return stats;
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

async function handleAdminStatusUpdate(payload) {
  ensureSupabase();

  const { affiliateId, status, message } = payload || {};

  if (!affiliateId || !status) {
    return NextResponse.json({ error: 'affiliateId and status are required' }, { status: 400 });
  }

  const normalizedStatus = status.toLowerCase();
  if (!ADMIN_STATUS_FILTERS.includes(normalizedStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed values: ${ADMIN_STATUS_FILTERS.join(', ')}` },
      { status: 400 }
    );
  }

  const updatePayload = {
    contract_status: normalizedStatus,
    approved_at: normalizedStatus === 'approved' ? new Date().toISOString() : null
  };

  const { data: updatedAffiliate, error } = await supabaseAdmin
    .from('affiliates')
    .update(updatePayload)
    .eq('id', affiliateId)
    .select('id, user_id, affiliate_id, contract_status')
    .single();

  if (error) {
    console.error('Failed to update affiliate status:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate status', message: error.message },
      { status: 500 }
    );
  }

  invalidateCache(updatedAffiliate.user_id);

  let autoContract = { autoCreated: false };
  if (normalizedStatus === 'approved') {
    autoContract = await maybeCreateAffiliateContract(updatedAffiliate);
  }

  try {
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: 'system',
      action: 'affiliate_status_update',
      entity_type: 'affiliate',
      entity_id: affiliateId,
      new_values: { status: normalizedStatus },
      notes: message || null
    });
  } catch (logError) {
    console.error('Failed logging affiliate status update:', logError);
  }

  return NextResponse.json({ success: true, affiliate: updatedAffiliate, autoContract });
}

async function handleAdminFieldUpdate(payload) {
  ensureSupabase();

  const { affiliateId, customName, notes, website, promotionMethod, customUrl, name, email, phone } = payload || {};

  if (!affiliateId) {
    return NextResponse.json({ error: 'affiliateId is required' }, { status: 400 });
  }

  const updates = {};
  if (typeof customName === 'string') updates.custom_name = customName.trim() || null;
  if (typeof notes === 'string') updates.notes = notes.trim() || null;
  if (typeof website === 'string') updates.website = website.trim() || null;
  if (typeof promotionMethod === 'string') updates.promotion_method = promotionMethod.trim() || null;
  if (typeof customUrl === 'string') updates.custom_url = customUrl.trim() || null;
  if (typeof name === 'string') updates.name = name.trim() || null;
  if (typeof email === 'string') updates.email = email.trim() || null;
  if (typeof phone === 'string') updates.phone = phone.trim() || null;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No updates supplied' }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('affiliates')
    .update(updates)
    .eq('id', affiliateId)
    .select('id, user_id, custom_name, notes, website, promotion_method, custom_url, name, email, phone')
    .single();

  if (error) {
    console.error('Failed updating affiliate fields:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate', message: error.message },
      { status: 500 }
    );
  }

  invalidateCache(updated.user_id);

  return NextResponse.json({ success: true, affiliate: updated });
}

async function handleAffiliateSettingsUpdate(payload) {
  ensureSupabase();

  const { autoApproveAffiliates, autoCreateContract } = payload || {};

  const updates = [];
  if (typeof autoApproveAffiliates === 'boolean') {
    updates.push({ key: 'auto_approve_affiliates', value: autoApproveAffiliates });
  }
  if (typeof autoCreateContract === 'boolean') {
    updates.push({ key: 'auto_create_contract', value: autoCreateContract });
  }

  if (!updates.length) {
    return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
  }

  const operations = updates.map((entry) =>
    supabaseAdmin
      .from('settings')
      .upsert({ key: entry.key, value: entry.value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  );

  const results = await Promise.all(operations);
  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    console.error('Failed updating affiliate settings:', firstError);
    return NextResponse.json(
      { error: 'Failed to update affiliate settings', message: firstError.message },
      { status: 500 }
    );
  }

  const settings = await loadAffiliateSettings();
  return NextResponse.json({ success: true, settings });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body || {};

    if (action === 'update_status') {
      return handleAdminStatusUpdate(body);
    }

    if (action === 'update_fields') {
      return handleAdminFieldUpdate(body);
    }

    if (action === 'update_settings') {
      return handleAffiliateSettingsUpdate(body);
    }

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
      .from('commissions')
      .select('*')
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
    .from('tiers')
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
      .from('commissions')
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

function clampListLimit(rawLimit) {
  const parsed = parseInt(rawLimit || `${DEFAULT_LIST_LIMIT}`, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_LIST_LIMIT;
  }
  return Math.min(parsed, 100);
}

async function loadAffiliateSettings() {
  ensureSupabase();

  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['auto_approve_affiliates', 'auto_create_contract']);

  if (error) {
    console.error('Failed to load affiliate settings:', error);
    return {
      autoApproveAffiliates: false,
      autoCreateContract: false
    };
  }

  const settings = {
    autoApproveAffiliates: false,
    autoCreateContract: false
  };

  (data || []).forEach((row) => {
    if (row.key === 'auto_approve_affiliates') {
      settings.autoApproveAffiliates = parseSettingBoolean(row.value);
    }
    if (row.key === 'auto_create_contract') {
      settings.autoCreateContract = parseSettingBoolean(row.value);
    }
  });

  return settings;
}

function parseSettingBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'object' && value !== null && 'enabled' in value) {
    return Boolean(value.enabled);
  }
  return false;
}

async function maybeCreateAffiliateContract(affiliate) {
  try {
    const settings = await loadAffiliateSettings();
    if (!settings.autoCreateContract) {
      return { autoCreated: false };
    }

    const { data: existingContract } = await supabaseAdmin
      .from('contracts')
      .select('id')
      .eq('user_id', affiliate.user_id)
      .eq('type', 'affiliate_agreement')
      .maybeSingle();

    if (existingContract) {
      return { autoCreated: false, reason: 'already_exists' };
    }

    const { data, error } = await supabaseAdmin
      .from('contracts')
      .insert({
        user_id: affiliate.user_id,
        type: 'affiliate_agreement',
        version: '1.0',
        content: 'Affiliate agreement content pending upload',
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed creating affiliate contract:', error);
      return { autoCreated: false, error: error.message };
    }

    return { autoCreated: true, contractId: data.id };
  } catch (error) {
    console.error('maybeCreateAffiliateContract error:', error);
    return { autoCreated: false, error: error.message };
  }
}

function ensureSupabase() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    const error = new Error('Supabase admin client is not configured');
    error.statusCode = 500;
    throw error;
  }
}
