import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

export const runtime = 'edge';

export async function POST(request) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const payload = await request.json();

    if (payload?.type !== 'user.created') {
      return NextResponse.json({ received: true });
    }

    const user = payload?.data;
    const referralCode = user?.public_metadata?.referral_code || user?.unsafe_metadata?.referral_code;

    if (!referralCode) {
      return NextResponse.json({ success: true });
    }

    const normalizedCode = String(referralCode).trim();
    if (!normalizedCode) {
      return NextResponse.json({ success: true });
    }

    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('id, user_id')
      .eq('affiliate_id', normalizedCode)
      .maybeSingle();

    if (affiliateError || !affiliate) {
      console.warn('Affiliate code not found for referral:', normalizedCode, affiliateError);
      return NextResponse.json({ success: false, message: 'affiliate not found' }, { status: 200 });
    }

    const supabaseUserId = user?.id;
    if (!supabaseUserId) {
      return NextResponse.json({ success: false, message: 'user id missing' }, { status: 200 });
    }

    if (affiliate.user_id === supabaseUserId) {
      return NextResponse.json({ success: false, message: 'self referral ignored' }, { status: 200 });
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('referrer_id')
      .eq('id', supabaseUserId)
      .maybeSingle();

    if (existingUser?.referrer_id) {
      return NextResponse.json({ success: true, message: 'referrer already set' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ referrer_id: affiliate.user_id })
      .eq('id', supabaseUserId);

    if (updateError) {
      console.error('Failed setting referrer_id for user', supabaseUserId, updateError);
      return NextResponse.json({ success: false, message: 'update failed' }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    return NextResponse.json({ error: 'webhook processing failed' }, { status: 500 });
  }
}
