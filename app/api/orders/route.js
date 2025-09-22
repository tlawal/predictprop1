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
    const cacheKey = `orders:${status}:${limit}:${offset}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        plans:plan_id (
          description,
          type
        ),
        users:user_id (
          email,
          wallet
        ),
        affiliates:affiliate_id (
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders', message: error.message },
        { status: 500 }
      );
    }

    // Transform data and format timestamps
    const transformedOrders = orders?.map(order => ({
      id: order.id,
      orderId: order.order_id,
      plan: {
        id: order.plan_id,
        description: order.plans?.description || 'Unknown Plan',
        type: order.plans?.type || 'Unknown'
      },
      user: {
        id: order.user_id,
        email: order.users?.email || 'No email',
        wallet: order.users?.wallet ? `${order.users.wallet.slice(0, 6)}...${order.users.wallet.slice(-4)}` : 'No wallet'
      },
      affiliate: order.affiliate_id ? {
        id: order.affiliate_id,
        name: order.affiliates?.email || 'Unknown'
      } : null,
      addons: order.addons || {},
      amount: order.amount,
      status: order.status,
      paymentMethod: order.payment_method,
      notes: order.notes,
      timestamp: dayjs(order.created_at).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss'),
      createdAt: order.created_at
    })) || [];

    const result = {
      orders: transformedOrders,
      total: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, planId, userId, addons, amount, affiliateId, paymentMethod } = body;

    if (!orderId || !planId || !userId || !amount) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['orderId', 'planId', 'userId', 'amount']
        },
        { status: 400 }
      );
    }

    // Create order in Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_id: orderId,
        plan_id: planId,
        user_id: userId,
        addons: addons || {},
        amount: parseFloat(amount),
        affiliate_id: affiliateId || null,
        status: 'pending',
        payment_method: paymentMethod || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order', message: error.message },
        { status: 500 }
      );
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('Orders POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get current order for logging
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    // Update order
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json(
        { error: 'Failed to update order', message: error.message },
        { status: 500 }
      );
    }

    // Log admin action
    if (currentOrder) {
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: body.adminId, // Should be passed from frontend
          action: 'update_order',
          entity_type: 'order',
          entity_id: id,
          old_values: { status: currentOrder.status, notes: currentOrder.notes },
          new_values: { status, notes },
          notes: `Order ${order.order_id} status updated`
        });
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('Orders PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update order', message: error.message },
      { status: 500 }
    );
  }
}
