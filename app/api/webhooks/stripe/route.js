import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import crypto from 'crypto';

// PRODUCTION: Verify Stripe webhook signatures
/*
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
*/

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

    // Handle different event types
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
    const { planId, userId, type } = paymentIntent.metadata;

    console.log('Processing successful payment:', {
      paymentIntentId: paymentIntent.id,
      planId,
      userId,
      type,
      amount: paymentIntent.amount
    });

    // Update payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .upsert({
        stripe_payment_intent_id: paymentIntent.id,
        user_id: userId,
        plan_id: planId,
        amount: paymentIntent.amount / 100, // Convert from cents
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

    // If this is an evaluation fee payment, create the challenge
    if (type === 'evaluation_fee' || !type) {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('Error fetching plan:', planError);
        return;
      }

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          user_id: userId,
          plan_type: plan.type,
          balance: plan.params?.starting_balance || 5000,
          params: plan.params,
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

      // Send welcome email
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

    // Log successful payment
    await supabase
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
    console.log('Processing failed payment:', paymentIntent.id);

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: paymentIntent.last_payment_error?.message
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Send failure notification
    const { userId } = paymentIntent.metadata;
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
    console.log('Processing successful payout:', payout.id);

    // Update payout status
    await supabase
      .from('payouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_payout_id: payout.id
      })
      .eq('stripe_payout_id', payout.id);

    // Send completion notification
    const { data: payoutRecord } = await supabase
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
    console.log('Processing failed payout:', payout.id);

    // Update payout status
    await supabase
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
    console.log('Processing charge dispute:', dispute.id);

    // Log dispute for admin review
    await supabase
      .from('admin_logs')
      .insert({
        action: 'charge_dispute',
        entity_type: 'payment',
        entity_id: dispute.payment_intent,
        notes: `Charge dispute created: ${dispute.reason}. Amount: $${dispute.amount / 100}`
      });

    // Send admin notification
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
