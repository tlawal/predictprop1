'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/Leaderboard.module.css';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all-time');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For now, we'll use mock data since Polymarket doesn't have a public leaderboard API
        // In a real implementation, you'd call your backend API that aggregates P&L data
        const mockLeaderboard = [
          {
            rank: 1,
            username: 'CryptoOracle',
            address: '0x1234...5678',
            totalPnL: 125000,
            winRate: 78.5,
            totalTrades: 1247,
            avgReturn: 12.3,
            bestTrade: 45000,
            worstTrade: -8500,
            joinDate: '2023-01-15',
            verified: true
          },
          {
            rank: 2,
            username: 'MarketMaster',
            address: '0x2345...6789',
            totalPnL: 98000,
            winRate: 72.1,
            totalTrades: 892,
            avgReturn: 9.8,
            bestTrade: 32000,
            worstTrade: -12000,
            joinDate: '2023-03-22',
            verified: true
          },
          {
            rank: 3,
            username: 'PredictionPro',
            address: '0x3456...7890',
            totalPnL: 87000,
            winRate: 69.8,
            totalTrades: 1156,
            avgReturn: 8.9,
            bestTrade: 28000,
            worstTrade: -9500,
            joinDate: '2023-02-08',
            verified: true
          },
          {
            rank: 4,
            username: 'ElectionExpert',
            address: '0x4567...8901',
            totalPnL: 75000,
            winRate: 75.2,
            totalTrades: 634,
            avgReturn: 11.2,
            bestTrade: 25000,
            worstTrade: -6800,
            joinDate: '2023-04-12',
            verified: false
          },
          {
            rank: 5,
            username: 'SportsAnalyst',
            address: '0x5678...9012',
            totalPnL: 68000,
            winRate: 71.5,
            totalTrades: 789,
            avgReturn: 9.5,
            bestTrade: 22000,
            worstTrade: -7800,
            joinDate: '2023-01-28',
            verified: true
          },
          {
            rank: 6,
            username: 'MacroTrader',
            address: '0x6789...0123',
            totalPnL: 62000,
            winRate: 68.9,
            totalTrades: 923,
            avgReturn: 8.2,
            bestTrade: 19000,
            worstTrade: -11000,
            joinDate: '2023-03-05',
            verified: false
          },
          {
            rank: 7,
            username: 'CryptoWhale',
            address: '0x7890...1234',
            totalPnL: 58000,
            winRate: 73.1,
            totalTrades: 445,
            avgReturn: 12.8,
            bestTrade: 18000,
            worstTrade: -5500,
            joinDate: '2023-02-18',
            verified: true
          },
          {
            rank: 8,
            username: 'DataDriven',
            address: '0x8901...2345',
            totalPnL: 52000,
            winRate: 70.3,
            totalTrades: 678,
            avgReturn: 8.7,
            bestTrade: 16000,
            worstTrade: -8200,
            joinDate: '2023-04-03',
            verified: false
          },
          {
            rank: 9,
            username: 'TrendFollower',
            address: '0x9012...3456',
            totalPnL: 48000,
            winRate: 67.8,
            totalTrades: 812,
            avgReturn: 7.9,
            bestTrade: 15000,
            worstTrade: -9200,
            joinDate: '2023-01-10',
            verified: true
          },
          {
            rank: 10,
            username: 'RiskManager',
            address: '0x0123...4567',
            totalPnL: 45000,
            winRate: 76.4,
            totalTrades: 356,
            avgReturn: 11.9,
            bestTrade: 14000,
            worstTrade: -4200,
            joinDate: '2023-03-15',
            verified: false
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLeaderboard(mockLeaderboard);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getPnLColor = (pnl) => {
    return pnl >= 0 ? '#10b981' : '#ef4444';
  };

  return (
    <div className={styles.leaderboardPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1>Top Traders Leaderboard</h1>
            <p>See the best performing traders on Polymarket and get inspired by their strategies</p>
            
            <div className={styles.timeframeSelector}>
              <button 
                className={`${styles.timeframeButton} ${timeframe === 'all-time' ? styles.active : ''}`}
                onClick={() => setTimeframe('all-time')}
              >
                All Time
              </button>
              <button 
                className={`${styles.timeframeButton} ${timeframe === '30d' ? styles.active : ''}`}
                onClick={() => setTimeframe('30d')}
              >
                30 Days
              </button>
              <button 
                className={`${styles.timeframeButton} ${timeframe === '7d' ? styles.active : ''}`}
                onClick={() => setTimeframe('7d')}
              >
                7 Days
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className={styles.leaderboardSection}>
        <div className={styles.container}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading leaderboard...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Error loading leaderboard: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className={styles.leaderboardTable}>
              <div className={styles.tableHeader}>
                <div className={styles.headerCell}>Rank</div>
                <div className={styles.headerCell}>Trader</div>
                <div className={styles.headerCell}>Total P&L</div>
                <div className={styles.headerCell}>Win Rate</div>
                <div className={styles.headerCell}>Trades</div>
                <div className={styles.headerCell}>Avg Return</div>
                <div className={styles.headerCell}>Best Trade</div>
                <div className={styles.headerCell}>Worst Trade</div>
              </div>

              {leaderboard.map((trader) => (
                <div key={trader.rank} className={styles.tableRow}>
                  <div className={styles.rankCell}>
                    <span className={styles.rankIcon}>{getRankIcon(trader.rank)}</span>
                  </div>
                  
                  <div className={styles.traderCell}>
                    <div className={styles.traderInfo}>
                      <div className={styles.traderName}>
                        {trader.username}
                        {trader.verified && <span className={styles.verifiedBadge}>✓</span>}
                      </div>
                      <div className={styles.traderAddress}>{trader.address}</div>
                    </div>
                  </div>
                  
                  <div className={styles.pnlCell}>
                    <span 
                      className={styles.pnlValue}
                      style={{ color: getPnLColor(trader.totalPnL) }}
                    >
                      {formatCurrency(trader.totalPnL)}
                    </span>
                  </div>
                  
                  <div className={styles.winRateCell}>
                    <span className={styles.winRateValue}>{formatPercentage(trader.winRate)}</span>
                  </div>
                  
                  <div className={styles.tradesCell}>
                    <span className={styles.tradesValue}>{trader.totalTrades.toLocaleString()}</span>
                  </div>
                  
                  <div className={styles.avgReturnCell}>
                    <span 
                      className={styles.avgReturnValue}
                      style={{ color: getPnLColor(trader.avgReturn) }}
                    >
                      {formatPercentage(trader.avgReturn)}
                    </span>
                  </div>
                  
                  <div className={styles.bestTradeCell}>
                    <span 
                      className={styles.bestTradeValue}
                      style={{ color: getPnLColor(trader.bestTrade) }}
                    >
                      {formatCurrency(trader.bestTrade)}
                    </span>
                  </div>
                  
                  <div className={styles.worstTradeCell}>
                    <span 
                      className={styles.worstTradeValue}
                      style={{ color: getPnLColor(trader.worstTrade) }}
                    >
                      {formatCurrency(trader.worstTrade)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <div className={styles.ctaSection}>
            <h2>Ready to Join the Leaderboard?</h2>
            <p>Start your trading journey and compete with the best traders on Polymarket</p>
            <div className={styles.ctaButtons}>
              <Link href="/traders" className={styles.ctaButton}>
                Start Trading Challenge
              </Link>
              <Link href="/lps" className={`${styles.ctaButton} ${styles.secondary}`}>
                Become a Market Maker
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
