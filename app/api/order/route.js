import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, challengeId, marketId, side, amount, price, orderType } = body;

    // Validate required fields
    if (!userId || !challengeId || !marketId || !side || !amount || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, challengeId, marketId, side, amount, price' },
        { status: 400 }
      );
    }

    // Validate side
    if (!['Yes', 'No'].includes(side)) {
      return NextResponse.json(
        { error: 'Invalid side. Must be "Yes" or "No"' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number' },
        { status: 400 }
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0 || priceNum > 1) {
      return NextResponse.json(
        { error: 'Invalid price. Must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Verify challenge exists and is active
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, balance, status')
      .eq('id', challengeId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Invalid or inactive challenge' },
        { status: 400 }
      );
    }

    // SAFEGUARD 1: Real-time exposure validation
    // Query all open positions for this challenge to calculate total exposure
    const { data: existingTrades, error: exposureError } = await supabase
      .from('trades')
      .select('amount, entry_price')
      .eq('challenge_id', challengeId)
      .eq('resolved', false);

    if (exposureError) {
      console.error('Error fetching existing trades:', exposureError);
      return NextResponse.json(
        { error: 'Failed to validate exposure limits' },
        { status: 500 }
      );
    }

    // Calculate current total exposure (sum of all position values)
    const currentExposure = existingTrades?.reduce((sum, trade) =>
      sum + (trade.amount * trade.entry_price), 0
    ) || 0;

    // Calculate new position value
    const newPositionValue = amountNum * priceNum;

    // Check if total exposure (current + new) exceeds 15% of balance
    const totalExposure = currentExposure + newPositionValue;
    const maxAllowedExposure = challenge.balance * 0.15; // 15% of challenge balance

    if (totalExposure > maxAllowedExposure) {
      return NextResponse.json(
        {
          error: 'Total exposure exceeds 15% limit',
          details: {
            currentExposure: currentExposure.toFixed(2),
            newPositionValue: newPositionValue.toFixed(2),
            totalExposure: totalExposure.toFixed(2),
            maxAllowed: maxAllowedExposure.toFixed(2),
            limit: '15%'
          }
        },
        { status: 400 }
      );
    }

    // SAFEGUARD 2: Daily trading limits
    // Check trades made today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: todaysTrades, error: dailyLimitError } = await supabase
      .from('trades')
      .select('amount')
      .eq('challenge_id', challengeId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (dailyLimitError) {
      console.error('Error checking daily limits:', dailyLimitError);
      // Continue with order but log the error
    }

    // Calculate today's trading volume
    const todaysVolume = todaysTrades?.reduce((sum, trade) => sum + trade.amount, 0) || 0;
    const dailyLimit = challenge.balance * 0.5; // 50% of balance per day

    if (todaysVolume + amountNum > dailyLimit) {
      return NextResponse.json(
        {
          error: 'Daily trading limit exceeded',
          details: {
            todaysVolume: todaysVolume.toFixed(2),
            attemptedTrade: amountNum.toFixed(2),
            dailyLimit: dailyLimit.toFixed(2),
            remaining: (dailyLimit - todaysVolume).toFixed(2)
          }
        },
        { status: 400 }
      );
    }

    // Create trade record in Supabase
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        challenge_id: challengeId,
        market_id: marketId,
        side: side,
        amount: amountNum,
        entry_price: priceNum,
        pnl: 0, // Initialize P&L as 0
        resolved: false
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Error creating trade:', tradeError);
      return NextResponse.json(
        { error: 'Failed to create trade', message: tradeError.message },
        { status: 500 }
      );
    }

    console.log('Trade created in Supabase:', trade);

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        challengeId: trade.challenge_id,
        marketId: trade.market_id,
        side: trade.side,
        amount: trade.amount,
        entryPrice: trade.entry_price,
        pnl: trade.pnl,
        resolved: trade.resolved,
        createdAt: trade.created_at
      },
      message: 'Order placed successfully'
    });

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { error: 'Failed to process order', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const challengeId = searchParams.get('challengeId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('trades')
      .select(`
        *,
        challenges!inner(user_id, status)
      `)
      .eq('challenges.user_id', userId);

    // Filter by challenge if provided
    if (challengeId) {
      query = query.eq('challenge_id', challengeId);
    }

    const { data: trades, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trades:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trades', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      trades: trades || [],
      total: trades?.length || 0
    });

  } catch (error) {
    console.error('Get orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', message: error.message },
      { status: 500 }
    );
  }
}