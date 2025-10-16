import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const userId = searchParams.get('userId');

    // Check cache
    const cacheKey = `admin:payments:${status}:${limit}:${offset}:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Build query for payments
    let query = supabase
      .from('payments')
      .select(`
        *,
        users!inner(email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments', message: error.message },
        { status: 500 }
      );
    }

    // Transform data for admin view
    const transformedPayments = payments?.map(payment => ({
      ...payment,
      user: {
        email: payment.users?.email,
        wallet: payment.users?.wallet
      },
      users: undefined // Remove nested users object
    })) || [];

    const result = {
      payments: transformedPayments,
      total: transformedPayments.length,
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
    console.error('Admin payments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, notes, adminId } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Update payment status
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    if (status === 'failed' && !updateData.failed_at) {
      updateData.failed_at = new Date().toISOString();
      updateData.error_message = notes || 'Rejected by admin';
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return NextResponse.json(
        { error: 'Failed to update payment', message: error.message },
        { status: 500 }
      );
    }

    // Log admin action
    if (adminId) {
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: adminId,
          action: 'update_payment_status',
          entity_type: 'payment',
          entity_id: id,
          old_values: { status: 'pending' },
          new_values: { status, notes },
          notes: `Payment status updated to ${status}${notes ? ': ' + notes : ''}`
        });
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      payment: payment,
      message: `Payment status updated to ${status}`
    });

  } catch (error) {
    console.error('Admin payments PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment', message: error.message },
      { status: 500 }
    );
  }
}
