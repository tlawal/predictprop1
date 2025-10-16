import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, challengeId, amount, payoutMethod } = body;

    if (!userId || !challengeId || !amount || !payoutMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, challengeId, amount, payoutMethod' },
        { status: 400 }
      );
    }

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payout amount' },
        { status: 400 }
      );
    }

    // Verify user has sufficient balance and challenge is active
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('balance, status, user_id')
      .eq('id', challengeId)
      .eq('user_id', userId)
      .eq('status', 'passed')
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Invalid challenge or insufficient permissions' },
        { status: 400 }
      );
    }

    // Check if user has sufficient withdrawable balance
    // This would typically be calculated from trades and fees
    const withdrawableBalance = challenge.balance; // Simplified

    if (payoutAmount > withdrawableBalance) {
      return NextResponse.json(
        { error: 'Insufficient withdrawable balance' },
        { status: 400 }
      );
    }

    // Create payout request
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        amount: payoutAmount,
        method: payoutMethod,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      return NextResponse.json(
        { error: 'Failed to create payout request', message: payoutError.message },
        { status: 500 }
      );
    }

    // PRODUCTION IMPLEMENTATION: Process payout based on method
    /*
    let payoutResult;
    switch (payoutMethod) {
      case 'stripe':
        payoutResult = await processStripePayout(payout.id, payoutAmount, userStripeAccount);
        break;
      case 'usdc':
        payoutResult = await processUSDCPayout(payout.id, payoutAmount, userWalletAddress);
        break;
      case 'bank_transfer':
        payoutResult = await processBankTransfer(payout.id, payoutAmount, userBankDetails);
        break;
      default:
        throw new Error('Unsupported payout method');
    }

    // Update payout status
    await supabase
      .from('payouts')
      .update({
        status: payoutResult.success ? 'processing' : 'failed',
        transaction_id: payoutResult.transactionId,
        processed_at: new Date().toISOString(),
        error_message: payoutResult.error
      })
      .eq('id', payout.id);
    */

    // CURRENT STUB: Mock processing
    console.log('Payout request created (stub):', {
      payoutId: payout.id,
      userId,
      challengeId,
      amount: payoutAmount,
      method: payoutMethod
    });

    // Simulate processing delay and update status
    setTimeout(async () => {
      try {
        await supabase
          .from('payouts')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', payout.id);

        console.log(`Payout ${payout.id} marked as completed`);
      } catch (error) {
        console.error('Error updating payout status:', error);
      }
    }, 5000); // Simulate 5-second processing

    // Send notification email
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payout_requested',
          userId,
          amount: payoutAmount,
          method: payoutMethod
        }),
      });
    } catch (emailError) {
      console.error('Error sending payout email:', emailError);
      // Don't fail the payout request for email errors
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount: payout.amount,
        method: payout.method,
        status: payout.status,
        requestedAt: payout.requested_at
      },
      message: 'Payout request submitted successfully. Processing typically takes 24 hours.'
    });

  } catch (error) {
    console.error('Payout API error:', error);
    return NextResponse.json(
      { error: 'Failed to process payout', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `payouts:${userId}:${status}:${limit}:${offset}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    let query = supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payouts, error } = await query;

    if (error) {
      console.error('Error fetching payouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payouts', message: error.message },
        { status: 500 }
      );
    }

    const result = {
      payouts: payouts || [],
      total: payouts?.length || 0,
      pagination: {
        limit,
        offset,
        hasMore: false // Simplified
      }
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Get payouts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts', message: error.message },
      { status: 500 }
    );
  }
}
