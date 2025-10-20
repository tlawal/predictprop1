import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Mock balance data
    const mockData = {
      balance: Math.floor(Math.random() * 10000) + 1000,
      challengeSize: 5000,
      availableBalance: Math.floor(Math.random() * 5000) + 500,
      lockedBalance: Math.floor(Math.random() * 2000),
      totalPnL: Math.floor(Math.random() * 2000) - 1000,
      dailyPnL: Math.floor(Math.random() * 500) - 250
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', message: error.message },
      { status: 500 }
    );
  }
}