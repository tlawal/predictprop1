// AI-powered risk API with ML model predictions
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Model paths
const RISK_MODEL_PATH = path.join(process.cwd(), 'models', 'risk_model.json');

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
