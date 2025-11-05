import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../../lib/supabase';

export async function POST(request, { params }) {
  try {
    ensureSupabase();

    const affiliateId = params?.id;
    if (!affiliateId) {
      return NextResponse.json({ error: 'Affiliate id is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      payout_email: payoutEmail,
      website_url: websiteUrl,
      auto_withdraw_email: autoWithdrawEmail,
      withdrawal_delay: withdrawalDelay,
      withdrawal_threshold: withdrawalThreshold,
      custom_commission: customCommission,
      promotion_info: promotionInfo,
      custom_affiliate_url: customAffiliateUrl
    } = normalizeKeys(body || {});

    const updates = {};

    if (payoutEmail !== undefined) updates.payout_email = sanitizeString(payoutEmail);
    if (websiteUrl !== undefined) updates.website = sanitizeString(websiteUrl);
    if (autoWithdrawEmail !== undefined) updates.auto_withdraw_email = sanitizeString(autoWithdrawEmail);
    if (promotionInfo !== undefined) updates.promotion_info = sanitizeString(promotionInfo, { allowEmpty: true });
    if (withdrawalDelay !== undefined) updates.withdrawal_delay = toNumber(withdrawalDelay, { allowNull: true, min: 0 });
    if (withdrawalThreshold !== undefined) updates.withdrawal_threshold = toNumber(withdrawalThreshold, { allowNull: true, min: 0 });
    if (customCommission !== undefined) updates.custom_commission = validateCustomCommission(customCommission);

    if (customAffiliateUrl !== undefined) {
      const sanitizedCustomUrl = sanitizeString(customAffiliateUrl, { allowEmpty: true });
      await ensureCustomUrlUnique(affiliateId, sanitizedCustomUrl);
      updates.custom_url = sanitizedCustomUrl || null;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ success: true, message: 'No changes detected' });
    }

    const { data, error } = await supabaseAdmin
      .from('affiliates')
      .update(updates)
      .eq('id', affiliateId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Affiliate update error:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate', message: error.message },
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

function normalizeKeys(payload) {
  if (!payload || typeof payload !== 'object') return {};

  const map = {
    payoutEmail: 'payout_email',
    websiteUrl: 'website_url',
    autoWithdrawEmail: 'auto_withdraw_email',
    withdrawalDelay: 'withdrawal_delay',
    withdrawalThreshold: 'withdrawal_threshold',
    customCommission: 'custom_commission',
    promotionInfo: 'promotion_info',
    customUrl: 'custom_affiliate_url'
  };

  return Object.entries(payload).reduce((acc, [key, value]) => {
    const normalizedKey = map[key] || key;
    acc[normalizedKey] = value;
    return acc;
  }, {});
}

function sanitizeString(value, { allowEmpty = false } = {}) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed && !allowEmpty) return null;
  return trimmed || null;
}

function toNumber(value, { allowNull = false, min = undefined } = {}) {
  if (value === null || value === undefined || value === '') {
    return allowNull ? null : min ?? 0;
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error('Invalid numeric value');
  }
  if (min !== undefined && numberValue < min) {
    throw new Error(`Value must be greater than or equal to ${min}`);
  }
  return numberValue;
}

function validateCustomCommission(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (_error) {
      throw new Error('custom_commission must be valid JSON');
    }
  }

  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('custom_commission must be an object');
  }

  return parsed;
}

async function ensureCustomUrlUnique(affiliateId, customUrl) {
  if (!customUrl) {
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('affiliates')
    .select('id')
    .eq('custom_url', customUrl)
    .neq('id', affiliateId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data) {
    const err = new Error('Custom affiliate URL is already in use');
    err.statusCode = 409;
    throw err;
  }
}
