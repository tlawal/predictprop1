import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

// Simple in-memory cache for affiliate codes
const codeCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Affiliate code is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `affiliate_${code.toUpperCase()}`;
    const cached = codeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Return mock validation for demo purposes
    if (!isSupabaseConfigured) {
      // Mock affiliate codes for testing
      const mockCodes = {
        'POLY10': { valid: true, discount: 10, affiliateId: 'mock-affiliate-1', tier: 'gold' },
        'TRADE15': { valid: true, discount: 15, affiliateId: 'mock-affiliate-2', tier: 'platinum' },
        'PROP20': { valid: true, discount: 20, affiliateId: 'mock-affiliate-3', tier: 'platinum' },
        'DEMO5': { valid: true, discount: 5, affiliateId: 'mock-affiliate-4', tier: 'bronze' }
      };

      const upperCode = code.toUpperCase();
      const result = mockCodes[upperCode] || { valid: false, discount: 0 };

      codeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // Real validation from Supabase
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('id, tier, is_active')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !affiliate) {
      const result = { valid: false, discount: 0 };
      codeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // Check if affiliate is active
    if (!affiliate.is_active) {
      const result = { valid: false, discount: 0, reason: 'Affiliate account is inactive' };
      codeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // Calculate discount based on tier
    const tierDiscounts = {
      bronze: 5,
      silver: 10,
      gold: 15,
      platinum: 20
    };

    const discount = tierDiscounts[affiliate.tier] || 5;

    const result = {
      valid: true,
      discount,
      affiliateId: affiliate.id,
      tier: affiliate.tier
    };

    codeCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);

  } catch (error) {
    console.error('Affiliate validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate affiliate code', message: error.message },
      { status: 500 }
    );
  }
}
