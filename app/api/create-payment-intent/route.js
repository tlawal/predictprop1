// This is a stub implementation for Stripe payment intents
// In production, you would integrate with Stripe's API

import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { planId, amount, userId } = body;

    if (!planId || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, amount, userId' },
        { status: 400 }
      );
    }

    // PRODUCTION IMPLEMENTATION: Real Stripe integration
    let paymentIntent, paymentRecord;

    if (process.env.STRIPE_SECRET_KEY && supabase) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      // Get user email for receipt
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      // Create Stripe payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          planId,
          userId,
          type: 'evaluation_fee'
        },
        description: `PolyProp ${planId} Evaluation Fee`,
        receipt_email: user?.email || undefined,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record in database
      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          plan_id: planId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: parseFloat(amount),
          currency: 'usd',
          status: 'pending',
          type: 'evaluation_fee',
          metadata: { planId, userId, type: 'evaluation_fee' }
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Continue anyway - webhook will handle status updates
      }

      paymentRecord = newPayment;

      console.log('Stripe payment intent created:', {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        paymentRecordId: paymentRecord?.id
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentRecordId: paymentRecord?.id
      });
    }

    // FALLBACK: Mock implementation for development
    const mockClientSecret = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create mock payment record
    if (supabase) {
      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          plan_id: planId,
          stripe_payment_intent_id: mockPaymentIntentId,
          amount: parseFloat(amount),
          currency: 'usd',
          status: 'pending',
          type: 'evaluation_fee',
          metadata: { planId, userId, type: 'evaluation_fee' }
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating mock payment record:', paymentError);
      } else {
        paymentRecord = newPayment;
      }
    }

    console.log('Mock payment intent created:', {
      planId,
      userId,
      amount: parseFloat(amount),
      clientSecret: mockClientSecret,
      paymentIntentId: mockPaymentIntentId,
      paymentRecordId: paymentRecord?.id
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      clientSecret: mockClientSecret,
      paymentIntentId: mockPaymentIntentId,
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: 'usd',
      paymentRecordId: paymentRecord?.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent', message: error.message },
      { status: 500 }
    );
  }
}
