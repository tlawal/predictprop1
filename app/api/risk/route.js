// AI-powered risk API with ML model predictions and real-time safeguards
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { ethers } from 'ethers';
import WebSocket from 'ws';
import { supabase } from '../../../lib/supabase';

// Global WebSocket connection for real-time price monitoring
let priceWebSocket = null;
const activeAlerts = new Map(); // Track active risk alerts

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Model paths
const RISK_MODEL_PATH = path.join(process.cwd(), 'models', 'risk_model.json');

// SAFEGUARD 3: WebSocket price monitoring and auto-close functionality
function initializePriceMonitoring() {
  if (priceWebSocket) return; // Already initialized

  try {
    priceWebSocket = new WebSocket('wss://clob.polymarket.com/ws');

    priceWebSocket.on('open', () => {
      console.log('🔔 Risk monitoring WebSocket connected');

      // Subscribe to price updates for active positions
      const subscriptionMessage = {
        type: 'subscribe',
        channel: 'price_updates',
        // In production, subscribe to specific market IDs from active trades
        markets: ['0x1234567890123456789012345678901234567890'] // Placeholder
      };

      priceWebSocket.send(JSON.stringify(subscriptionMessage));
    });

    priceWebSocket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'price_change') {
          await handlePriceChange(message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    priceWebSocket.on('error', (error) => {
      console.error('Risk monitoring WebSocket error:', error);
      // Attempt reconnection after delay
      setTimeout(() => {
        priceWebSocket = null;
        initializePriceMonitoring();
      }, 5000);
    });

    priceWebSocket.on('close', () => {
      console.log('🔔 Risk monitoring WebSocket disconnected');
      priceWebSocket = null;

      // Attempt reconnection
      setTimeout(() => {
        initializePriceMonitoring();
      }, 5000);
    });

  } catch (error) {
    console.error('Failed to initialize price monitoring:', error);
  }
}

// Handle price change events and trigger auto-close if needed
async function handlePriceChange(priceData) {
  try {
    // Find positions affected by this price change
    const { data: affectedTrades, error } = await supabase
      .from('trades')
      .select(`
        *,
        challenges (
          balance,
          user_id,
          status
        )
      `)
      .eq('market_id', priceData.marketId)
      .eq('resolved', false)
      .eq('challenges.status', 'active');

    if (error || !affectedTrades?.length) {
      return; // No active positions for this market
    }

    // Calculate drawdown for each affected challenge
    for (const trade of affectedTrades) {
      const challenge = trade.challenges;
      if (!challenge) continue;

      // Get all trades for this challenge
      const { data: allTrades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('challenge_id', trade.challenge_id)
        .eq('resolved', false);

      if (tradesError) continue;

      // Calculate cluster drawdown
      const clusterAnalysis = calculateClusterDrawdown(allTrades);

      if (clusterAnalysis.drawdownPercent > 5) { // 5% threshold
        console.log(`🚨 Auto-close triggered for challenge ${trade.challenge_id}: ${clusterAnalysis.drawdownPercent}% drawdown`);

        // Trigger auto-close
        await triggerAutoClose(trade.challenge_id, clusterAnalysis);

        // Send alert email
        await sendRiskAlertEmail(challenge.user_id, 'auto_close', clusterAnalysis);
      }
    }

  } catch (error) {
    console.error('Error handling price change:', error);
  }
}

// Calculate cluster drawdown for risk assessment
function calculateClusterDrawdown(trades) {
  const clusters = {};

  // Group trades by end date (clustered risk)
  trades.forEach(trade => {
    // In production, get end date from market data
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days from now
    if (!clusters[endDate]) clusters[endDate] = [];
    clusters[endDate].push(trade);
  });

  let maxDrawdown = 0;
  let maxDrawdownDate = null;
  let clusterSize = 0;

  Object.entries(clusters).forEach(([date, clusterTrades]) => {
    const clusterPnL = clusterTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const clusterValue = clusterTrades.reduce((sum, trade) =>
      sum + (trade.amount * trade.entry_price), 0
    );

    if (clusterPnL < 0 && clusterValue > 0) {
      const drawdownPercent = Math.abs(clusterPnL) / clusterValue * 100;
      if (drawdownPercent > maxDrawdown) {
        maxDrawdown = drawdownPercent;
        maxDrawdownDate = date;
        clusterSize = clusterTrades.length;
      }
    }
  });

  return {
    drawdownPercent: Math.round(maxDrawdown * 100) / 100,
    date: maxDrawdownDate,
    clusterSize
  };
}

// Trigger auto-close using smart contract
async function triggerAutoClose(challengeId, clusterAnalysis) {
  try {
    // In production, this would interact with the ERC4626 vault contract
    // For now, we'll mark positions as resolved with losses

    console.log(`🔒 Executing auto-close for challenge ${challengeId}`);

    // Get all open trades for this challenge
    const { data: openTrades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('resolved', false);

    if (error || !openTrades?.length) {
      console.error('No open trades found for auto-close');
      return;
    }

    // Calculate forced closure P&L (simplified - in production use real prices)
    const closureUpdates = openTrades.map(trade => ({
      id: trade.id,
      pnl: -(trade.amount * trade.entry_price * 0.1), // 10% loss on auto-close
      resolved: true
    }));

    // Update trades in database
    for (const update of closureUpdates) {
      await supabase
        .from('trades')
        .update({
          pnl: update.pnl,
          resolved: true
        })
        .eq('id', update.id);
    }

    // In production, call vault contract:
    // const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
    // await vault.forceClose(challengeId, closureUpdates);

    console.log(`✅ Auto-close completed for ${closureUpdates.length} positions`);

  } catch (error) {
    console.error('Auto-close execution failed:', error);
  }
}

// Send risk alert email
async function sendRiskAlertEmail(userId, alertType, details) {
  try {
    // Trigger email notification
    await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'breach_alert',
        userId,
        breachType: alertType,
        breachValue: details.drawdownPercent,
        challengeId: 'auto-triggered'
      })
    });
  } catch (error) {
    console.error('Failed to send risk alert email:', error);
  }
}

// SAFEGUARD 4: Insurance integration (Nexus Mutual stub)
async function checkInsuranceCoverage(challengeId, riskAmount) {
  try {
    // In production, integrate with Nexus Mutual API
    // For now, return mock coverage status

    const coverageResponse = {
      covered: riskAmount < 1000, // Cover losses up to $1000
      premium: riskAmount * 0.02, // 2% premium
      deductible: 50,
      coverage: Math.min(riskAmount, 1000),
      provider: 'Nexus Mutual'
    };

    console.log(`🛡️ Insurance check for challenge ${challengeId}:`, coverageResponse);
    return coverageResponse;

    // Production implementation:
    // const response = await fetch('https://api.nexusmutual.io/v1/quote', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.NEXUS_API_KEY}` },
    //   body: JSON.stringify({ amount: riskAmount, type: 'trading' })
    // });
    // return await response.json();

  } catch (error) {
    console.error('Insurance check failed:', error);
    return { covered: false, error: error.message };
  }
}

// Initialize monitoring on module load
if (typeof window === 'undefined') { // Only on server-side
  initializePriceMonitoring();
}

// Predict risk using ML model via Python
async function predictRiskWithML(modelData) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(process.cwd(), 'scripts', 'predict_risk.py')
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const prediction = JSON.parse(output.trim());
          resolve({
            alert: prediction.alert,
            message: prediction.message,
            severity: prediction.severity,
            metrics: prediction.metrics,
            recommendations: prediction.recommendations,
            lastUpdated: new Date().toISOString(),
            modelUsed: true
          });
        } catch (parseError) {
          console.error('Failed to parse risk prediction:', parseError);
          resolve(generateRuleBasedRisk());
        }
      } else {
        console.error('Risk ML prediction failed:', errorOutput);
        resolve(generateRuleBasedRisk());
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python process error:', error);
      resolve(generateRuleBasedRisk());
    });
  });
}

// Rule-based risk calculation (fallback)
function generateRuleBasedRisk() {
  // Use the existing LSTM-like calculation
  const mockPositions = [
    {
      id: 'pos_1',
      question: 'Will US government shutdown in 2025?',
      shares: 100,
      entryPrice: 0.55,
      pnl: -125,
      endDate: '2025-12-31T12:00:00Z',
      status: 'open'
    },
    {
      id: 'pos_2',
      question: 'Taylor Swift pregnant in 2025?',
      shares: 50,
      entryPrice: 0.15,
      pnl: -91,
      endDate: '2025-12-31T12:00:00Z',
      status: 'open'
    },
    {
      id: 'pos_3',
      question: 'Jerome Powell out as Fed Chair in 2025?',
      shares: 75,
      entryPrice: 0.08,
      pnl: -114,
      endDate: '2025-12-31T12:00:00Z',
      status: 'open'
    }
  ];

  const lstmResult = calculateLSTMThreshold(mockPositions, []);

  const alert = lstmResult.drawdownPercent > lstmResult.threshold;
  let alertMessage = '';
  let severity = 'low';

  if (alert) {
    alertMessage = `${lstmResult.drawdownPercent}% drawdown on cluster of ${lstmResult.clusterSize} open positions (markets end ${new Date(lstmResult.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;

    if (lstmResult.drawdownPercent > 7) {
      severity = 'high';
    } else if (lstmResult.drawdownPercent > 5) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
  }

  const totalExposure = mockPositions.reduce((sum, pos) =>
    sum + (pos.shares * pos.entryPrice), 0
  );

  const maxSinglePosition = Math.max(...mockPositions.map(pos =>
    pos.shares * pos.entryPrice
  ));

  const concentrationRisk = (maxSinglePosition / totalExposure) * 100;

  return {
    alert,
    message: alertMessage,
    severity,
    metrics: {
      maxDrawdown: lstmResult.drawdownPercent,
      drawdownDate: lstmResult.date,
      clusterSize: lstmResult.clusterSize,
      totalExposure,
      maxSinglePosition,
      concentrationRisk: Math.round(concentrationRisk * 100) / 100,
      threshold: lstmResult.threshold
    },
    recommendations: alert ? [
      "Consider reducing position sizes in clustered markets",
      "Monitor markets ending in the same time period",
      "Diversify across different market categories",
      "Consider taking partial profits if positions are profitable"
    ] : [],
    lastUpdated: new Date().toISOString(),
    modelUsed: false
  };
}

// Mock LSTM-like risk calculation function (kept for fallback)
function calculateLSTMThreshold(positions, history) {
  // Simulate LSTM analysis: cluster positions by end date and calculate drawdown
  const clusters = {};

  positions.forEach(position => {
    const endDate = position.endDate.split('T')[0]; // YYYY-MM-DD format
    if (!clusters[endDate]) {
      clusters[endDate] = [];
    }
    clusters[endDate].push(position);
  });

  let maxDrawdown = 0;
  let maxDrawdownDate = null;
  let clusterSize = 0;

  Object.entries(clusters).forEach(([date, clusterPositions]) => {
    const clusterPnL = clusterPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const clusterValue = clusterPositions.reduce((sum, pos) =>
      sum + (pos.shares * pos.entryPrice), 0
    );

    if (clusterPnL < 0) {
      const drawdownPercent = Math.abs(clusterPnL) / clusterValue * 100;
      if (drawdownPercent > maxDrawdown) {
        maxDrawdown = drawdownPercent;
        maxDrawdownDate = date;
        clusterSize = clusterPositions.length;
      }
    }
  });

  return {
    drawdownPercent: Math.round(maxDrawdown * 100) / 100,
    date: maxDrawdownDate,
    clusterSize,
    threshold: 4.0 // 4% threshold for alerts
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo_user';

    // Check cache
    const cacheKey = `risk:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    let riskData;

    // Try to load and use ML model
    if (fs.existsSync(RISK_MODEL_PATH)) {
      try {
        const modelData = JSON.parse(fs.readFileSync(RISK_MODEL_PATH, 'utf8'));
        riskData = await predictRiskWithML(modelData);
      } catch (modelError) {
        console.warn('Risk ML model error, falling back to rule-based:', modelError.message);
        riskData = generateRuleBasedRisk();
      }
    } else {
      console.warn('Risk ML model not found, using rule-based calculation');
      riskData = generateRuleBasedRisk();
    }

    // Cache the result
    cache.set(cacheKey, {
      data: riskData,
      timestamp: Date.now()
    });

    return NextResponse.json(riskData);

  } catch (error) {
    console.error('Risk API error:', error);
    return NextResponse.json(
      {
        alert: false,
        message: '',
        severity: 'low',
        metrics: {
          maxDrawdown: 0,
          drawdownDate: null,
          clusterSize: 0,
          totalExposure: 0,
          maxSinglePosition: 0,
          concentrationRisk: 0,
          threshold: 4.0
        },
        recommendations: [],
        error: error.message
      },
      { status: 500 }
    );
  }
}
