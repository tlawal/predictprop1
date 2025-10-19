import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Affiliate code is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would validate the affiliate code against your database
    // For now, we'll return a mock response
    const mockValidation = {
      isValid: code.length >= 6 && code.length <= 10,
      discount: code.length >= 6 && code.length <= 10 ? 5 : 0,
      affiliateName: code.length >= 6 && code.length <= 10 ? 'Demo Affiliate' : null,
    };

    return NextResponse.json({
      success: true,
      ...mockValidation
    });

  } catch (error) {
    console.error('Affiliate validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate affiliate code', message: error.message },
      { status: 500 }
    );
  }
}