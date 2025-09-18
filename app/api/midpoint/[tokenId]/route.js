import { NextResponse } from 'next/server';
import polymarketService from '../../../../lib/services/polymarket';

export async function GET(request, { params }) {
  try {
    const { tokenId } = params;

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    const data = await polymarketService.fetchMidpoint(tokenId);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Midpoint API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch midpoint',
        message: error.message,
        tokenId: params.tokenId,
        yesPrice: 0.5,
        noPrice: 0.5,
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}