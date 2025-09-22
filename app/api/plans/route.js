import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for plans (less critical)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Check cache
    const cacheKey = `plans:${includeInactive}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch plans from Supabase
    let query = supabase
      .from('plans')
      .select('*')
      .order('fee', { ascending: true });

    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plans', message: error.message },
        { status: 500 }
      );
    }

    const result = {
      plans: plans || [],
      total: plans?.length || 0
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Plans API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, description, params, fee } = body;

    if (!type || !description || !params || fee === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['type', 'description', 'params', 'fee']
        },
        { status: 400 }
      );
    }

    // Validate plan type
    if (!['1-step', '2-step'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "1-step" or "2-step"' },
        { status: 400 }
      );
    }

    // Create plan in Supabase
    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        type,
        description,
        params,
        fee: parseFloat(fee),
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return NextResponse.json(
        { error: 'Failed to create plan', message: error.message },
        { status: 500 }
      );
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      plan: plan
    });

  } catch (error) {
    console.error('Plans POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to create plan', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, type, description, params, fee, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Update plan in Supabase
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (params !== undefined) updateData.params = params;
    if (fee !== undefined) updateData.fee = parseFloat(fee);
    if (active !== undefined) updateData.active = active;

    const { data: plan, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      return NextResponse.json(
        { error: 'Failed to update plan', message: error.message },
        { status: 500 }
      );
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      plan: plan
    });

  } catch (error) {
    console.error('Plans PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting active to false
    const { data: plan, error } = await supabase
      .from('plans')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating plan:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate plan', message: error.message },
        { status: 500 }
      );
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      plan: plan
    });

  } catch (error) {
    console.error('Plans DELETE API error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate plan', message: error.message },
      { status: 500 }
    );
  }
}
