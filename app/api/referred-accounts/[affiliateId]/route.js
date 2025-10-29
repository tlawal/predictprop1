import { NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

export async function GET(request, { params }) {
  try {
    requireAdmin();

    const affiliateId = params?.affiliateId;
    if (!affiliateId) {
      return NextResponse.json({ error: 'affiliateId is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const { data: referrals, error } = await supabaseAdmin
      .from('affiliate_referrals')
      .select(
        `
          id,
          amount,
          level,
          created_at,
          referred_user:users!affiliate_referrals_referred_user_id_fkey (
            id,
            email,
            full_name
          ),
          commission:affiliate_commissions!affiliate_referrals_commission_id_fkey (
            id,
            amount,
            status,
            created_at
          ),
          order:orders!affiliate_referrals_order_id_fkey (
            id,
            order_id,
            amount,
            status,
            created_at,
            plan_id,
            plans:plan_id (
              description
            )
          )
        `
      )
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const filtered = status
      ? (referrals || []).filter((referral) => referral.commission?.status === status)
      : referrals || [];

    const rows = filtered.map((referral) => {
      const order = referral.order;
      const commission = referral.commission;
      const rate = computePayoutPercent(referral);
      const price = Number(order?.amount || 0);
      const commissionAmount = rate != null ? price * (rate / 100) : Number(commission?.amount || 0);

      return {
        id: referral.id,
        createdAt: referral.created_at,
        level: referral.level,
        customer: {
          id: referral.referred_user?.id,
          email: referral.referred_user?.email,
          name: referral.referred_user?.full_name || referral.referred_user?.email?.split('@')[0] || 'Unknown'
        },
        order: order
          ? {
              id: order.id,
              orderNumber: order.order_id,
              status: order.status,
              amount: price,
              plan: order.plans?.description || 'Unknown Plan',
              completedAt:
                order.status === 'completed'
                  ? dayjs(order.created_at).toISOString()
                  : null
            }
          : null,
        commission: commission
          ? {
              id: commission.id,
              status: commission.status,
              amount: Number(commission.amount || 0),
              createdAt: commission.created_at
            }
          : null,
        payoutPercent: rate,
        calculatedCommission: commissionAmount
      };
    });

    return NextResponse.json({ accounts: rows });
  } catch (error) {
    console.error('Referred accounts GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load referred accounts', message: error.message },
      { status: 500 }
    );
  }
}

function requireAdmin() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase admin client is not configured');
  }
}

function computePayoutPercent(referral) {
  if (!referral?.commission?.amount || !referral?.order?.amount) return null;
  const orderAmount = Number(referral.order.amount);
  if (!orderAmount) return null;
  const commissionAmount = Number(referral.commission.amount);
  return (commissionAmount / orderAmount) * 100;
}
