import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // SumSub configuration (replace with your actual values)
    const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN || 'your_sumsub_app_token';
    const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY || 'your_sumsub_secret_key';
    const SUMSUB_BASE_URL = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';

    // Create JWT token for SumSub SDK
    const payload = {
      userId: userId,
      levelName: 'basic-kyc-level', // Configure this in your SumSub dashboard
      ttlInSecs: 600, // Token expires in 10 minutes
    };

    const token = jwt.sign(payload, SUMSUB_SECRET_KEY, {
      algorithm: 'HS256',
      expiresIn: '10m',
    });

    // In production, you might want to store this token or associate it with the user
    // For now, we'll just return it

    return NextResponse.json({
      token,
      userId,
      ttlInSecs: 600,
    });

  } catch (error) {
    console.error('KYC token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate KYC token', message: error.message },
      { status: 500 }
    );
  }
}
