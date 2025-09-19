#!/usr/bin/env node

/**
 * PolyProp Trading Simulation Script
 *
 * Generates realistic virtual trades for testing and demonstration:
 * 1. Fetches random markets from Gamma API
 * 2. Creates virtual trades with random parameters
 * 3. Simulates market resolution with random outcomes
 * 4. Calculates cluster drawdown analysis
 * 5. Stores results in Supabase for dashboard display
 *
 * Usage: npm run simulate
 */

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const VIRTUAL_USER_ID = process.env.VIRTUAL_USER_ID || 'virtual-trader-001';
const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch random markets from Gamma API
 * @param {number} limit - Number of markets to fetch
 * @param {number} offset - Random offset for variety
 */
async function fetchRandomMarkets(limit = 50, offset = 0) {
  console.log(`🔍 Fetching ${limit} markets from Gamma API (offset: ${offset})...`);

  try {
    const response = await fetch(`${GAMMA_API_BASE}/markets?limit=${limit}&offset=${offset}&active=true`);
    const data = await response.json();

    if (!data.markets || data.markets.length === 0) {
      throw new Error('No markets found in API response');
    }

    console.log(`✅ Found ${data.markets.length} active markets`);
    return data.markets;
  } catch (error) {
    console.error('❌ Failed to fetch markets:', error.message);
    throw error;
  }
}

/**
 * Generate virtual trades based on available markets
 * @param {Array} markets - Array of market objects
 * @param {number} tradeCount - Number of trades to generate
 */
function generateVirtualTrades(markets, tradeCount = 20) {
  console.log(`🎯 Generating ${tradeCount} virtual trades...`);

  const trades = [];
  const usedMarketIds = new Set();

  for (let i = 0; i < tradeCount; i++) {
    // Select random market, avoiding duplicates for realism
    let market;
    let attempts = 0;
    do {
      market = markets[Math.floor(Math.random() * markets.length)];
      attempts++;
    } while (usedMarketIds.has(market.id) && attempts < 10);

    usedMarketIds.add(market.id);

    // Generate trade parameters
    const trade = {
      id: `virtual-trade-${Date.now()}-${i}`,
      userId: VIRTUAL_USER_ID,
      marketId: market.id,
      marketTitle: market.title || market.question || 'Unknown Market',
      side: Math.random() > 0.5 ? 'Yes' : 'No',
      amount: Math.floor(Math.random() * 450) + 50, // $50-$500 range
      entryPrice: parseFloat(market.outcomePrices?.[0] || Math.random().toFixed(3)),
      entryTimestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      status: 'pending', // Will be updated to resolved
      pnl: 0, // Will be calculated on resolution
    };

    trades.push(trade);
  }

  console.log(`✅ Generated ${trades.length} virtual trades`);
  return trades;
}

/**
 * Simulate CLOB order placement (mock implementation)
 * @param {Object} trade - Trade object
 */
async function simulateCLOBOrder(trade) {
  console.log(`📝 Simulating CLOB order for ${trade.marketTitle.substring(0, 50)}...`);

  // Mock CLOB API call - in production this would call actual CLOB
  const clobOrder = {
    marketId: trade.marketId,
    side: trade.side,
    amount: trade.amount,
    price: trade.entryPrice,
    timestamp: trade.entryTimestamp,
    status: 'filled',
    orderId: `clob-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  console.log(`✅ CLOB order ${clobOrder.orderId} filled`);
  return clobOrder;
}

/**
 * Insert trade into Supabase
 * @param {Object} trade - Trade object
 * @param {Object} clobOrder - CLOB order result
 */
async function insertTradeToSupabase(trade, clobOrder) {
  console.log(`💾 Inserting trade ${trade.id} into Supabase...`);

  try {
    const { data, error } = await supabase
      .from('trades')
      .insert({
        id: trade.id,
        user_id: trade.userId,
        market_id: trade.marketId,
        market_title: trade.marketTitle,
        side: trade.side,
        amount: trade.amount,
        entry_price: trade.entryPrice,
        entry_timestamp: trade.entryTimestamp.toISOString(),
        status: trade.status,
        pnl: trade.pnl,
        clob_order_id: clobOrder.orderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Trade ${trade.id} inserted successfully`);
    return data;
  } catch (error) {
    console.error('❌ Failed to insert trade:', error.message);
    throw error;
  }
}

/**
 * Simulate market resolution with random binary outcomes
 * @param {Array} trades - Array of pending trades
 * @param {Array} markets - Array of market data
 */
async function simulateMarketResolution(trades, markets) {
  console.log(`🎲 Simulating market resolution for ${trades.length} trades...`);

  const resolvedTrades = [];
  const marketOutcomes = new Map();

  for (const trade of trades) {
    // Find market data
    const market = markets.find(m => m.id === trade.marketId);

    if (!market) {
      console.warn(`⚠️  Market data not found for trade ${trade.id}`);
      continue;
    }

    // Check if market should be resolved (simulate time-based resolution)
    const tradeAge = Date.now() - trade.entryTimestamp.getTime();
    const shouldResolve = tradeAge > (7 * 24 * 60 * 60 * 1000) || Math.random() < 0.3; // 30% chance or 7+ days old

    if (shouldResolve) {
      // Get or generate market outcome
      let outcome;
      if (marketOutcomes.has(trade.marketId)) {
        outcome = marketOutcomes.get(trade.marketId);
      } else {
        outcome = Math.random() > 0.5 ? 1 : 0; // Random binary outcome
        marketOutcomes.set(trade.marketId, outcome);
      }

      // Calculate PnL based on outcome
      const finalPrice = outcome; // 1 for Yes win, 0 for No win
      const pnl = (trade.side === 'Yes' ? finalPrice : (1 - finalPrice)) * trade.amount - trade.amount;

      const resolvedTrade = {
        ...trade,
        status: 'resolved',
        pnl: Math.round(pnl * 100) / 100,
        outcome: outcome,
        resolvedTimestamp: new Date(),
      };

      resolvedTrades.push(resolvedTrade);
      console.log(`✅ Resolved ${trade.marketTitle.substring(0, 40)}... → ${outcome ? 'YES' : 'NO'} (PnL: $${pnl.toFixed(2)})`);
    }
  }

  return resolvedTrades;
}

/**
 * Update resolved trades in Supabase
 * @param {Array} resolvedTrades - Array of resolved trade objects
 */
async function updateResolvedTrades(resolvedTrades) {
  console.log(`🔄 Updating ${resolvedTrades.length} resolved trades in Supabase...`);

  for (const trade of resolvedTrades) {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          status: trade.status,
          pnl: trade.pnl,
          outcome: trade.outcome,
          resolved_timestamp: trade.resolvedTimestamp.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', trade.id);

      if (error) {
        console.error(`❌ Failed to update trade ${trade.id}:`, error.message);
      } else {
        console.log(`✅ Updated trade ${trade.id} with PnL: $${trade.pnl}`);
      }
    } catch (error) {
      console.error(`❌ Error updating trade ${trade.id}:`, error.message);
    }
  }
}

/**
 * Analyze cluster drawdown patterns
 * @param {Array} resolvedTrades - Array of resolved trades
 */
function analyzeClusterDrawdown(resolvedTrades) {
  console.log(`📊 Analyzing cluster drawdown patterns...`);

  // Group trades by end date (simulated clusters)
  const clusters = {};
  const now = new Date();

  resolvedTrades.forEach(trade => {
    // Simulate cluster based on trade entry time (weekly clusters)
    const clusterKey = Math.floor(trade.entryTimestamp.getTime() / (7 * 24 * 60 * 60 * 1000));
    if (!clusters[clusterKey]) {
      clusters[clusterKey] = [];
    }
    clusters[clusterKey].push(trade);
  });

  console.log(`📈 Found ${Object.keys(clusters).length} trade clusters`);

  let totalDrawdown = 0;
  let maxDrawdown = 0;
  let clusterCount = 0;

  for (const [clusterKey, clusterTrades] of Object.entries(clusters)) {
    const clusterPnL = clusterTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const clusterValue = clusterTrades.reduce((sum, trade) => sum + trade.amount, 0);

    if (clusterPnL < 0) {
      const drawdownPct = Math.abs(clusterPnL) / clusterValue;
      totalDrawdown += drawdownPct;
      maxDrawdown = Math.max(maxDrawdown, drawdownPct);
      clusterCount++;

      console.log(`📉 Cluster ${clusterKey}: ${clusterTrades.length} trades, PnL: $${clusterPnL.toFixed(2)}, Drawdown: ${(drawdownPct * 100).toFixed(2)}%`);
    }
  }

  const avgDrawdown = clusterCount > 0 ? totalDrawdown / clusterCount : 0;

  console.log(`\n📊 Drawdown Analysis Summary:`);
  console.log(`   • Clusters analyzed: ${Object.keys(clusters).length}`);
  console.log(`   • Clusters with losses: ${clusterCount}`);
  console.log(`   • Average drawdown: ${(avgDrawdown * 100).toFixed(2)}%`);
  console.log(`   • Maximum drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);

  return {
    totalClusters: Object.keys(clusters).length,
    lossClusters: clusterCount,
    avgDrawdown: avgDrawdown,
    maxDrawdown: maxDrawdown
  };
}

/**
 * Generate simulation statistics
 * @param {Array} originalTrades - Original generated trades
 * @param {Array} resolvedTrades - Resolved trades
 * @param {Object} drawdownAnalysis - Drawdown analysis results
 */
function generateSimulationStats(originalTrades, resolvedTrades, drawdownAnalysis) {
  const totalVolume = originalTrades.reduce((sum, trade) => sum + trade.amount, 0);
  const totalPnL = resolvedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winRate = resolvedTrades.length > 0 ?
    resolvedTrades.filter(t => t.pnl > 0).length / resolvedTrades.length : 0;

  const stats = {
    simulation_timestamp: new Date().toISOString(),
    total_trades_generated: originalTrades.length,
    trades_resolved: resolvedTrades.length,
    resolution_rate: (resolvedTrades.length / originalTrades.length * 100).toFixed(2) + '%',
    total_volume_usd: totalVolume.toFixed(2),
    total_pnl_usd: totalPnL.toFixed(2),
    win_rate: (winRate * 100).toFixed(2) + '%',
    avg_trade_size: (totalVolume / originalTrades.length).toFixed(2),
    profitable_trades: resolvedTrades.filter(t => t.pnl > 0).length,
    losing_trades: resolvedTrades.filter(t => t.pnl < 0).length,
    drawdown_analysis: {
      clusters_analyzed: drawdownAnalysis.totalClusters,
      loss_clusters: drawdownAnalysis.lossClusters,
      avg_drawdown_pct: (drawdownAnalysis.avgDrawdown * 100).toFixed(2) + '%',
      max_drawdown_pct: (drawdownAnalysis.maxDrawdown * 100).toFixed(2) + '%'
    }
  };

  return stats;
}

/**
 * Log comprehensive simulation statistics
 * @param {Object} stats - Simulation statistics
 */
function logSimulationStats(stats) {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 POLYPROP TRADING SIMULATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`📅 Simulation Time: ${new Date(stats.simulation_timestamp).toLocaleString()}`);
  console.log(`📊 Trades Generated: ${stats.total_trades_generated}`);
  console.log(`✅ Trades Resolved: ${stats.trades_resolved} (${stats.resolution_rate})`);
  console.log(`💰 Total Volume: $${stats.total_volume_usd}`);
  console.log(`📈 Total PnL: $${stats.total_pnl_usd}`);
  console.log(`🎯 Win Rate: ${stats.win_rate}`);
  console.log(`📏 Avg Trade Size: $${stats.avg_trade_size}`);
  console.log(`📈 Profitable Trades: ${stats.profitable_trades}`);
  console.log(`📉 Losing Trades: ${stats.losing_trades}`);
  console.log('\n📊 Cluster Drawdown Analysis:');
  console.log(`   • Clusters Analyzed: ${stats.drawdown_analysis.clusters_analyzed}`);
  console.log(`   • Loss Clusters: ${stats.drawdown_analysis.loss_clusters}`);
  console.log(`   • Average Drawdown: ${stats.drawdown_analysis.avg_drawdown_pct}`);
  console.log(`   • Maximum Drawdown: ${stats.drawdown_analysis.max_drawdown_pct}`);
  console.log('='.repeat(60));
}

/**
 * Main simulation function
 */
async function main() {
  try {
    console.log('🚀 Starting PolyProp Trading Simulation...');
    console.log('=' * 60);

    // Configuration
    const TRADE_COUNT = 20;
    const RANDOM_OFFSET = Math.floor(Math.random() * 100);

    // Step 1: Fetch random markets
    const markets = await fetchRandomMarkets(50, RANDOM_OFFSET);

    // Step 2: Generate virtual trades
    const virtualTrades = generateVirtualTrades(markets, TRADE_COUNT);

    // Step 3: Simulate CLOB orders and insert to Supabase
    console.log('\n📝 Simulating CLOB orders and database insertion...');
    for (const trade of virtualTrades) {
      try {
        const clobOrder = await simulateCLOBOrder(trade);
        await insertTradeToSupabase(trade, clobOrder);
      } catch (error) {
        console.error(`❌ Failed to process trade ${trade.id}:`, error.message);
      }
    }

    // Step 4: Simulate market resolution
    const resolvedTrades = await simulateMarketResolution(virtualTrades, markets);

    // Step 5: Update resolved trades in database
    if (resolvedTrades.length > 0) {
      await updateResolvedTrades(resolvedTrades);
    }

    // Step 6: Analyze cluster drawdown
    const drawdownAnalysis = analyzeClusterDrawdown(resolvedTrades);

    // Step 7: Generate and log statistics
    const stats = generateSimulationStats(virtualTrades, resolvedTrades, drawdownAnalysis);
    logSimulationStats(stats);

    console.log('\n🎉 Simulation completed successfully!');
    console.log(`💾 ${virtualTrades.length} trades created, ${resolvedTrades.length} resolved`);
    console.log('📊 Data available in Supabase for dashboard analysis');

  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fetchRandomMarkets,
  generateVirtualTrades,
  simulateCLOBOrder,
  simulateMarketResolution,
  analyzeClusterDrawdown,
  generateSimulationStats
};
