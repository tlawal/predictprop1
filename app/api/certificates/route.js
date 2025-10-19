import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would fetch certificates from a certificates table
    // For now, we'll return mock data
    const certificates = [
      {
        id: 'cert-001',
        userId: userId,
        accountSize: 10000,
        challengeType: '1-step',
        achievedAt: new Date().toISOString(),
        status: 'verified',
        created_at: new Date().toISOString(),
      },
      {
        id: 'cert-002',
        userId: userId,
        accountSize: 5000,
        challengeType: '2-step',
        achievedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'verified',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    return NextResponse.json({
      certificates: certificates,
      total: certificates.length
    });

  } catch (error) {
    console.error('Certificates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates', message: error.message },
      { status: 500 }
    );
  }
}
