import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    ensureSupabase();

    const body = await request.json();
    const { affiliate_id: affiliateId, amount, order_id: orderId, note } = normalizeKeys(body || {});

    if (!affiliateId) {
      return NextResponse.json({ error: 'affiliate_id is required' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'amount must be greater than zero' }, { status: 400 });
    }

    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('id', affiliateId)
      .maybeSingle();

    if (affiliateError) {
      throw affiliateError;
    }

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const insertPayload = {
      affiliate_id: affiliateId,
      amount: numericAmount,
      status: 'pending',
      manual: true,
      order_id: orderId || null,
      note: note ? String(note).trim() || null : null
    };

    const { data, error } = await supabaseAdmin
      .from('commissions')
      .insert(insertPayload)
      .select('id, status, amount, order_id, created_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, commission: data });
  } catch (error) {
    console.error('Manual commission add error:', error);
    return NextResponse.json(
      { error: 'Failed to create manual commission', message: error.message },
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
  const result = { ...payload };
  if ('affiliateId' in payload) result.affiliate_id = payload.affiliateId;
  if ('orderId' in payload) result.order_id = payload.orderId;
  return result;
}
