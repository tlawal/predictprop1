import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();
    const normalizedCode = typeof code === 'string' ? code.trim() : '';

    if (!normalizedCode) {
      return NextResponse.json({ success: false, message: 'Missing code' }, { status: 400 });
    }

    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('referrer_id')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Failed loading user for referral link:', userError);
      return NextResponse.json({ error: 'User lookup failed' }, { status: 500 });
    }

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found in Supabase' }, { status: 404 });
    }

    if (userRecord.referrer_id) {
      return NextResponse.json({ success: true, message: 'Referrer already set' });
    }

    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('user_id')
      .eq('affiliate_id', normalizedCode)
      .maybeSingle();

    if (affiliateError || !affiliate) {
      return NextResponse.json({ success: false, message: 'Affiliate not found' }, { status: 404 });
    }

    if (affiliate.user_id === userId) {
      return NextResponse.json({ success: false, message: 'Self referral ignored' }, { status: 200 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ referrer_id: affiliate.user_id })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed setting referrer_id via link endpoint:', updateError);
      return NextResponse.json({ error: 'Failed to set referrer' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Referrer linked' });
  } catch (error) {
    console.error('Referral link error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
