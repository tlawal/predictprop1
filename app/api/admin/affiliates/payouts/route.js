import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../../lib/supabase';

const DEFAULT_LIMIT = 25;
const DEFAULT_SORT_COLUMN = 'requested_at';
const ADMIN_ALLOWED_STATUSES = ['pending', 'approved', 'processing', 'paid', 'rejected', 'failed'];

export async function GET(request) {
  try {
    requireAdmin();

    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');
    const status = searchParams.get('status');
    const sortColumn = searchParams.get('sort') || DEFAULT_SORT_COLUMN;
    const ascending = searchParams.get('direction') === 'asc';
    const limit = clampLimit(searchParams.get('limit'));
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;

    let query = supabaseAdmin
      .from('affiliate_payouts')
      .select(
        `
          id,
          affiliate_id,
          requested_by_user_id,
          amount,
          currency,
          method,
          status,
          requested_at,
          processed_at,
          processed_by,
          notes,
          admin_notes,
          metadata,
          created_at,
          updated_at,
          affiliates:affiliate_id (
            id,
            affiliate_id,
            custom_name,
            name,
            contract_status
          )
        `,
        { count: 'exact' }
      );

    if (affiliateId) {
      query = query.eq('affiliate_id', affiliateId);
    }

    if (status) {
      query = query.eq('status', status.toLowerCase());
    }

    query = query.order(sortColumn, { ascending }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      payouts: data || [],
      total: count || 0,
      pagination: buildPagination({ count: count || 0, limit, offset })
    });
  } catch (error) {
    console.error('Admin affiliate payouts GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load affiliate payouts', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    requireAdmin();

    const payload = await request.json();
    const { id, status, adminId, adminNotes } = payload || {};

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const normalizedStatus = status.toLowerCase();
    if (!ADMIN_ALLOWED_STATUSES.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${ADMIN_ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updatePayload = {
      status: normalizedStatus,
      admin_notes: adminNotes || null,
      processed_at: ['approved', 'processing', 'paid'].includes(normalizedStatus) ? new Date().toISOString() : null,
      processed_by: adminId || null
    };

    const { data: updated, error } = await supabaseAdmin
      .from('affiliate_payouts')
      .update(updatePayload)
      .eq('id', id)
      .select('*, affiliate_id')
      .single();

    if (error) {
      throw error;
    }

    await logAdminAction({
      adminId: adminId || 'system',
      payoutId: id,
      status: normalizedStatus,
      notes: adminNotes || null
    });

    invalidateAffiliateCache(updated?.affiliate_id);

    return NextResponse.json({ success: true, payout: updated });
  } catch (error) {
    console.error('Admin affiliate payouts PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate payout', message: error.message },
      { status: 500 }
    );
  }
}

function clampLimit(value) {
  if (!value) return DEFAULT_LIMIT;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, 100);
}

function buildPagination({ count, limit, offset }) {
  return {
    limit,
    offset,
    hasMore: offset + limit < count
  };
}

async function logAdminAction({ adminId, payoutId, status, notes }) {
  try {
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: adminId,
      action: 'affiliate_payout_status_update',
      entity_type: 'affiliate_payout',
      entity_id: payoutId,
      new_values: { status },
      notes: notes || null
    });
  } catch (error) {
    console.warn('Failed to log affiliate payout action', error);
  }
}

function invalidateAffiliateCache(affiliateId) {
  if (!affiliateId) return;
  // Hook into cache invalidation if needed.
}

function requireAdmin() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase admin client is not configured');
  }
}
