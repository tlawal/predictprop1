import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

const TIER_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedTierMap = null;
let cachedTierMapFetchedAt = 0;

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    // PRODUCTION: Verify webhook signature
    /*
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }
    */

    // CURRENT STUB: Parse event without verification for development
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('Failed to parse webhook body:', err);
      return NextResponse.json({ error: 'Invalid webhook body' }, { status: 400 });
    }

    console.log('Received Stripe webhook:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.warn('Supabase not configured, skipping payment success handling');
      return;
    }

    const { planId, userId, type, affiliateId: rawAffiliateId } = paymentIntent.metadata || {};

    console.log('Processing successful payment:', {
      paymentIntentId: paymentIntent.id,
      planId,
      userId,
      type,
      amount: paymentIntent.amount
    });

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .upsert({
        stripe_payment_intent_id: paymentIntent.id,
        user_id: userId,
        plan_id: planId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'completed',
        type: type || 'evaluation_fee',
        completed_at: new Date().toISOString(),
        metadata: paymentIntent.metadata
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error updating payment record:', paymentError);
      return;
    }

    if (type === 'evaluation_fee' || !type) {
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('Error fetching plan:', planError);
        return;
      }

      const planParams = plan.params || {};
      const startingBalance = planParams.starting_balance ?? plan.size;

      const { data: challenge, error: challengeError } = await supabaseAdmin
        .from('challenges')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          plan_type: plan.type,
          balance: startingBalance,
          params: planParams.metrics || planParams,
          status: 'active',
          payment_id: payment.id,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (challengeError) {
        console.error('Error creating challenge:', challengeError);
        return;
      }

      try {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'challenge_started',
            userId,
            planType: plan.type,
            amount: plan.fee
          }),
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }

      console.log('Challenge created successfully:', challenge.id);
    }

    await processAffiliateEarnings({
      payment,
      stripePaymentIntentId: paymentIntent.id,
      affiliateId: rawAffiliateId,
      amountCents: paymentIntent.amount,
      userId
    });

    await supabaseAdmin
      .from('admin_logs')
      .insert({
        action: 'payment_completed',
        entity_type: 'payment',
        entity_id: payment.id,
        notes: `Payment of $${payment.amount} completed for user ${userId}`
      });
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return;
    }
    console.log('Processing failed payment:', paymentIntent.id);

    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: paymentIntent.last_payment_error?.message
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    const { userId } = paymentIntent.metadata || {};
    if (userId) {
      try {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_failed',
            userId,
            amount: paymentIntent.amount / 100
          }),
        });
      } catch (emailError) {
        console.error('Error sending payment failure email:', emailError);
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePayoutPaid(payout) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return;
    }
    console.log('Processing successful payout:', payout.id);

    await supabaseAdmin
      .from('payouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_payout_id: payout.id
      })
      .eq('stripe_payout_id', payout.id);

    const { data: payoutRecord } = await supabaseAdmin
      .from('payouts')
      .select('user_id, amount')
      .eq('stripe_payout_id', payout.id)
      .single();

    if (payoutRecord) {
      try {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payout_completed',
            userId: payoutRecord.user_id,
            amount: payoutRecord.amount
          }),
        });
      } catch (emailError) {
        console.error('Error sending payout completion email:', emailError);
      }
    }
  } catch (error) {
    console.error('Error handling payout success:', error);
  }
}

async function handlePayoutFailed(payout) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return;
    }
    console.log('Processing failed payout:', payout.id);

    await supabaseAdmin
      .from('payouts')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: payout.failure_message
      })
      .eq('stripe_payout_id', payout.id);
  } catch (error) {
    console.error('Error handling payout failure:', error);
  }
}

async function handleChargeDispute(dispute) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return;
    }
    console.log('Processing charge dispute:', dispute.id);

    await supabaseAdmin
      .from('admin_logs')
      .insert({
        action: 'charge_dispute',
        entity_type: 'payment',
        entity_id: dispute.payment_intent,
        notes: `Charge dispute created: ${dispute.reason}. Amount: $${dispute.amount / 100}`
      });

    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin_notification',
          subject: 'Charge Dispute Alert',
          message: `A charge dispute has been created for payment ${dispute.payment_intent}. Amount: $${dispute.amount / 100}. Reason: ${dispute.reason}`
        }),
      });
    } catch (emailError) {
      console.error('Error sending dispute notification:', emailError);
    }
  } catch (error) {
    console.error('Error handling charge dispute:', error);
  }
}

async function processAffiliateEarnings({ payment, stripePaymentIntentId, affiliateId, amountCents, userId }) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin || !affiliateId || !payment) {
      return;
    }

    const affiliateUuid = await resolveAffiliateId(affiliateId);
    if (!affiliateUuid) {
      console.warn('Affiliate not found for code/ID:', affiliateId);
      return;
    }

    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('*')
      .eq('id', affiliateUuid)
      .single();

    if (affiliateError || !affiliate) {
      console.error('Unable to load affiliate for commission processing:', affiliateError);
      return;
    }

    const commissionAmount = await calculateCommissionAmount({ affiliate, amountCents });
    if (commissionAmount <= 0) {
      return;
    }

    const { data: commission, error: commissionError } = await supabaseAdmin
      .from('commissions')
      .insert({
        affiliate_id: affiliate.id,
        order_id: payment.id,
        amount: commissionAmount,
        status: 'pending',
        manual: false,
        note: `Commission for payment ${stripePaymentIntentId}`
      })
      .select('*')
      .single();

    if (commissionError) {
      console.error('Failed to insert affiliate commission:', commissionError);
      return;
    }

    const { error: referralError } = await supabaseAdmin
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: userId,
        order_id: payment.id,
        level: 1,
        commission_id: commission.id,
        amount: commissionAmount
      });

    if (referralError && referralError.code !== '23505') {
      console.error('Failed to insert affiliate referral:', referralError);
    }

    const { error: updateError } = await supabaseAdmin
      .from('affiliates')
      .update({ referrals_count: (affiliate.referrals_count || 0) + 1 })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('Failed to update affiliate referral count:', updateError);
    }

    await maybeUpgradeAffiliateTier(affiliate.id);
  } catch (error) {
    console.error('Affiliate earnings processing error:', error);
  }
}

async function calculateCommissionAmount({ affiliate, amountCents }) {
  const amount = Number((amountCents || 0) / 100);
  if (amount <= 0) {
    return 0;
  }

  const tierMap = await loadTierLookup();
  const tierConfig = tierMap.get(affiliate.current_tier) || tierMap.get(1);
  const commissionPercent = affiliate.custom_commission?.percent ?? tierConfig?.payout_percent ?? 0;

  return Number(((commissionPercent / 100) * amount).toFixed(2));
}

async function loadTierLookup() {
  const now = Date.now();
  if (cachedTierMap && now - cachedTierMapFetchedAt < TIER_CACHE_TTL_MS) {
    return cachedTierMap;
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return new Map();
  }

  const { data, error } = await supabaseAdmin
    .from('tiers')
    .select('*')
    .order('level', { ascending: true });

  if (error) {
    console.error('Failed to load affiliate tiers:', error);
    return new Map();
  }

  cachedTierMap = new Map((data || []).map(tier => [tier.level, tier]));
  cachedTierMapFetchedAt = now;
  return cachedTierMap;
}

async function resolveAffiliateId(codeOrId) {
  if (!isSupabaseConfigured || !supabaseAdmin || !codeOrId) {
    return null;
  }

  const normalized = String(codeOrId).trim();

  const { data: byUuid } = await supabaseAdmin
    .from('affiliates')
    .select('id')
    .eq('id', normalized)
    .maybeSingle();

  if (byUuid?.id) {
    return byUuid.id;
  }

  const { data: byCode } = await supabaseAdmin
    .from('affiliates')
    .select('id')
    .eq('affiliate_id', normalized)
    .maybeSingle();

  return byCode?.id || null;
}

async function maybeUpgradeAffiliateTier(affiliateId) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return;
  }

  const tierMap = await loadTierLookup();
  if (!tierMap.size) {
    return;
  }

  const tiers = Array.from(tierMap.values()).sort((a, b) => a.level - b.level);

  const { data: affiliate, error } = await supabaseAdmin
    .from('affiliates')
    .select('id, current_tier, referrals_count')
    .eq('id', affiliateId)
    .single();

  if (error || !affiliate) {
    console.error('Failed to load affiliate for tier check:', error);
    return;
  }

  const nextTier = tiers
    .filter(tier => tier.level > affiliate.current_tier)
    .find(tier => affiliate.referrals_count >= tier.referral_threshold);

  if (!nextTier) {
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from('affiliates')
    .update({ current_tier: nextTier.level })
    .eq('id', affiliateId);

  if (updateError) {
    console.error('Failed to update affiliate tier:', updateError);
  }
}
