import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    requireAdmin();

    const body = await request.json();
    const { commissionId } = body || {};

    if (!commissionId) {
      return NextResponse.json({ error: 'commissionId is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('affiliate_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', commissionId)
      .select('id, status, paid_at')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, commission: data });
  } catch (error) {
    console.error('Commissions pay POST error:', error);
    return NextResponse.json(
      { error: 'Failed to mark commission paid', message: error.message },
      { status: 500 }
    );
  }
}

function requireAdmin() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase admin client is not configured');
  }
}
