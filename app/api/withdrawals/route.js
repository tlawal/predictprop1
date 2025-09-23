import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Check cache
    const cacheKey = `withdrawals:${status}:${limit}:${offset}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // For now, return mock withdrawal data
    // In production, this would query a withdrawals table
    const mockWithdrawals = generateMockWithdrawals(limit, offset, status);

    const result = {
      withdrawals: mockWithdrawals,
      total: 25, // Mock total
      pagination: {
        limit,
        offset,
        hasMore: (offset + limit) < 25
      }
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Withdrawals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, adminId } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, status' },
        { status: 400 }
      );
    }

    // In production, this would update a withdrawals table
    // For now, just log the action and return success

    console.log(`Withdrawal ${id} status updated to ${status} by admin ${adminId}`);

    // Log admin action
    if (adminId) {
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: adminId,
          action: 'process_withdrawal',
          entity_type: 'withdrawal',
          entity_id: id,
          old_values: { status: 'pending' },
          new_values: { status },
          notes: `Withdrawal ${id} processed with status: ${status}`
        });
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${id} updated to ${status}`
    });

  } catch (error) {
    console.error('Withdrawals PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal', message: error.message },
      { status: 500 }
    );
  }
}

function generateMockWithdrawals(limit, offset, statusFilter) {
  const statuses = ['pending', 'processing', 'completed', 'cancelled'];
  const challengeTypes = ['1-Step', '2-Step'];
  const traderNames = ['Alice Chen', 'Bob Wilson', 'Charlie Brown', 'Diana Ross', 'Edward Norton'];

  const withdrawals = [];

  for (let i = offset; i < offset + limit && i < 25; i++) {
    const status = statusFilter || statuses[Math.floor(Math.random() * statuses.length)];
    const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    const traderName = traderNames[Math.floor(Math.random() * traderNames.length)];
    const amount = 1000 + Math.random() * 9000; // $1000-$10000

    withdrawals.push({
      id: `withdrawal_${i + 1}`,
      traderName,
      wallet: '0x' + Math.random().toString(16).substr(2, 40),
      challengeType,
      amount,
      status,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
    });
  }

  return withdrawals.filter(w => !statusFilter || w.status === statusFilter);
}
