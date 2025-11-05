import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Affiliate code is required' },
        { status: 400 }
      );
    }

    const validation = await validateAffiliateCode(code);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, valid: false, discount: 0 },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      discount: validation.discount,
      affiliateId: validation.affiliateId,
      affiliateName: validation.affiliateName,
      tier: validation.tier
    });
  } catch (error) {
    console.error('Affiliate validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate affiliate code', message: error.message },
      { status: 500 }
    );
  }
}

async function validateAffiliateCode(code, options = {}) {
  if (!isSupabaseConfigured || (!supabase && !supabaseAdmin)) {
    return mockValidation(code);
  }

  const client = supabaseAdmin || supabase;

  const baseQuery = client
    .from('affiliates')
    .select('id, affiliate_id, custom_name, contract_status, current_tier')
    .eq('affiliate_id', code)
    .maybeSingle();

  if (options.signal) {
    baseQuery.abortSignal(options.signal);
  }

  const { data, error } = await baseQuery;

  if (error) {
    console.error('Affiliate lookup failed:', error);
    return { valid: false, discount: 0 };
  }

  if (!data) {
    return { valid: false, discount: 0 };
  }

  if (data.contract_status !== 'approved') {
    return { valid: false, discount: 0 };
  }

  const tierLevel = data.current_tier || 1;

  const { data: tierData, error: tierError } = await client
    .from('tiers')
    .select('level, payout_percent')
    .eq('level', tierLevel)
    .maybeSingle();

  if (tierError) {
    console.error('Tier lookup failed:', tierError);
  }

  const discount = tierData?.payout_percent ? Number(tierData.payout_percent) : 0;

  return {
    valid: true,
    discount,
    affiliateId: data.id,
    affiliateName: data.custom_name || null,
    tier: tierLevel
  };
}

function mockValidation(code) {
  const isValid = code.length >= 6 && code.length <= 10;
  return {
    valid: isValid,
    discount: isValid ? 5 : 0,
    affiliateId: isValid ? 'mock-affiliate-id' : null,
    affiliateName: isValid ? 'Demo Affiliate' : null,
    tier: isValid ? 1 : null
  };
}