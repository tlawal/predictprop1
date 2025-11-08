import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';

function buildError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = normalizeString(body?.name);
    const email = normalizeString(body?.email).toLowerCase();
    const socialLinkRaw = normalizeString(body?.social_link);
    const audienceSizeRaw = body?.audience_size;
    const previousPartnership = normalizeString(body?.previous_partnership);
    const promotionMethod = normalizeString(body?.promotion_method);
    const userId = normalizeString(body?.userId);

    if (!name) {
      return buildError('Name is required');
    }

    if (!email) {
      return buildError('Email is required');
    }

    if (!promotionMethod || promotionMethod.length < 100) {
      return buildError('Promotion method must be at least 100 characters long');
    }

    const website = socialLinkRaw || null;

    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.warn('Supabase admin client is not configured. Returning mock success response.');
      return NextResponse.json({
        success: true,
        affiliate: {
          affiliateId: `aff-${randomUUID()}`,
          status: 'pending'
        },
        mock: true
      });
    }

    if (userId) {
      const { data: existingByUser, error: userLookupError } = await supabaseAdmin
        .from('affiliates')
        .select('id, contract_status')
        .eq('user_id', userId)
        .maybeSingle();

      if (userLookupError) {
        console.error('Affiliate lookup by user failed:', userLookupError);
        return buildError('Unable to process application right now.', 500);
      }

      if (existingByUser) {
        return buildError('You already have an affiliate profile under review or approved.', 409);
      }
    }

    const { data: existingByEmail, error: emailLookupError } = await supabaseAdmin
      .from('affiliates')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (emailLookupError) {
      console.error('Affiliate lookup by email failed:', emailLookupError);
      return buildError('Unable to process application right now.', 500);
    }

    if (existingByEmail) {
      return buildError('An affiliate application with this email already exists.', 409);
    }

    const affiliateCode = `aff-${randomUUID()}`;

    const insertPayload = {
      user_id: userId || null,
      name,
      email,
      website,
      promotion_method: promotionMethod,
      affiliate_id: affiliateCode,
      contract_status: 'pending'
    };

    const { data: insertedAffiliate, error: insertError } = await supabaseAdmin
      .from('affiliates')
      .insert(insertPayload)
      .select('id, affiliate_id, contract_status')
      .single();

    if (insertError) {
      console.error('Failed to insert affiliate application:', insertError);
      return buildError('Failed to submit application. Please try again later.', 500);
    }

    // Fire-and-forget confirmation email
    const emailPayload = {
      type: 'affiliate_application_confirmation',
      email,
      applicantName: name
    };

    const emailEndpoint = new URL('/api/email', request.url).toString();

    try {
      const emailResponse = await fetch(emailEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      if (!emailResponse.ok) {
        console.warn('Affiliate confirmation email failed:', await emailResponse.text());
      }
    } catch (emailError) {
      console.error('Error triggering affiliate confirmation email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        affiliate: {
          id: insertedAffiliate.id,
          affiliateId: insertedAffiliate.affiliate_id,
          status: insertedAffiliate.contract_status
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Affiliate application POST error:', error);
    return buildError('Unexpected error processing application.', 500);
  }
}
