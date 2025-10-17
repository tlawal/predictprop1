import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Check cache
    const cacheKey = `addons:${includeInactive}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch add-ons from Supabase
    let query = supabase
      .from('addons')
      .select('*')
      .order('price', { ascending: true });

    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data: addons, error } = await query;

    if (error) {
      console.error('Error fetching add-ons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch add-ons', message: error.message },
        { status: 500 }
      );
    }

    const result = {
      addons: addons || [],
      total: addons?.length || 0
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Add-ons API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch add-ons', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, price, param_key, param_value } = body;

    if (!name || !description || !param_key || param_value === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['name', 'description', 'param_key', 'param_value']
        },
        { status: 400 }
      );
    }

    // Create add-on in Supabase
    const { data: addon, error } = await supabase
      .from('addons')
      .insert({
        name,
        description,
        price: parseFloat(price) || 0,
        param_key,
        param_value,
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating add-on:', error);
      return NextResponse.json(
        { error: 'Failed to create add-on', message: error.message },
        { status: 500 }
      );
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      addon: addon
    });

  } catch (error) {
    console.error('Add-ons POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to create add-on', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, description, price, param_key, param_value, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Add-on ID is required' },
        { status: 400 }
      );
    }

    // Update add-on in Supabase
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (param_key !== undefined) updateData.param_key = param_key;
    if (param_value !== undefined) updateData.param_value = param_value;
    if (active !== undefined) updateData.active = active;

    const { data: addon, error } = await supabase
      .from('addons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating add-on:', error);
      return NextResponse.json(
        { error: 'Failed to update add-on', message: error.message },
        { status: 500 }
      );
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      addon: addon
    });

  } catch (error) {
    console.error('Add-ons PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update add-on', message: error.message },
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
        { error: 'Add-on ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting active to false
    const { data: addon, error } = await supabase
      .from('addons')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating add-on:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate add-on', message: error.message },
        { status: 500 }
      );
    }

    // Clear cache
    cache.clear();

    return NextResponse.json({
      success: true,
      addon: addon
    });

  } catch (error) {
    console.error('Add-ons DELETE API error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate add-on', message: error.message },
      { status: 500 }
    );
  }
}
