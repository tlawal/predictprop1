import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { PLAN_DEFINITIONS } from '../../../lib/planConstants';

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

    const resultPlans = (plans || []).map((plan) => {
      const params = plan.params || {};
      const startingBalance = params.starting_balance ?? plan.size;
      const basePlan = PLAN_DEFINITIONS.find((base) => base.id === plan.id);
      const accuracyTarget = params.accuracy_target ?? params.win_rate ?? 0;

      const buildMetrics = () => {
        if (plan.type === '1-step') {
          return {
            profit_target: params.profit_target,
            drawdown_max: params.drawdown_max,
            exposure_cap: params.exposure_cap,
            min_days: params.min_days,
            accuracy_target: accuracyTarget
          };
        }

        return {
          accuracy_target: accuracyTarget,
          phases: params.phases
        };
      };

      return {
        ...plan,
        size: startingBalance,
        description: plan.description || basePlan?.description,
        params: {
          ...params,
          accuracy_target: accuracyTarget,
          metrics: buildMetrics()
        }
      };
    });

    const result = {
      plans: resultPlans,
      total: resultPlans.length
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
    const { type, size, params, fee } = body;

    if (!type || !size || !params || fee === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['type', 'size', 'params', 'fee']
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
        size: parseInt(size),
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
    const { id, type, size, params, fee, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Update plan in Supabase
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (size !== undefined) updateData.size = parseInt(size);
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
