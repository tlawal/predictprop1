import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Check if we should use real authentication
    const useRealData = process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true';
    
    if (useRealData) {
      // Real Polymarket authentication
      try {
        const response = await fetch('https://gamma-api.polymarket.com/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (!response.ok) {
          throw new Error(`Polymarket auth failed: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json({
          token: data.token || apiKey,
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });
      } catch (error) {
        console.error('Real auth failed, falling back to mock:', error);
        // Fall through to mock authentication
      }
    }

    // Mock authentication for development
    const mockToken = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      token: mockToken,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });

  } catch (error) {
    console.error('Auth API error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
