// Mock vault API - in production this would use ethers v6 to query the actual vault contract
import { NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';
    const cacheKey = `vault_${userId}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Mock vault data - in production this would query the actual vault contract
    const mockVaultData = {
      // Total Value Locked in USDC
      tvl: Math.floor(Math.random() * 500000 + 1000000).toString(),

      // User's USDC balance
      userBalance: Math.floor(Math.random() * 10000 + 1000).toString(),

      // User's ppLP shares
      userShares: Math.floor(Math.random() * 5000 + 1000).toString(),

      // User's total yield earned
      userYield: Math.floor(Math.random() * 500 + 100).toString(),

      // Lock period end timestamp (mock: sometimes locked, sometimes unlocked)
      lockPeriod: Math.random() > 0.5
        ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),

      // Vault contract address
      vaultAddress: '0x1234567890123456789012345678901234567890',

      // Asset token address (USDC)
      assetAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',

      // Last updated timestamp
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result
    cache.set(cacheKey, {
      data: mockVaultData,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (cache.size > 10) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 5).forEach(([key]) => cache.delete(key));
    }

    return NextResponse.json(mockVaultData);

  } catch (error) {
    console.error('Vault API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch vault data',
        message: error.message,
        tvl: '0',
        userBalance: '0',
        userShares: '0',
        userYield: '0',
        lockPeriod: null,
      },
      { status: 500 }
    );
  }
}

// POST endpoint for deposit/withdraw simulations
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, amount, shares } = body;

    // Mock transaction simulation
    const mockTx = {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      action,
      amount: amount || shares,
      gasEstimate: '0.001',
      status: 'success',
      timestamp: new Date().toISOString(),
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      transaction: mockTx,
      message: `${action} transaction simulated successfully`,
    });

  } catch (error) {
    console.error('Vault transaction error:', error);
    return NextResponse.json(
      {
        error: 'Transaction failed',
        message: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
