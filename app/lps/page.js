'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/LPs.module.css';

export default function LiquidityProviders() {
  const [selectedVault, setSelectedVault] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState('vaults');

  const vaults = [
    {
      id: 'conservative',
      name: 'Conservative Vault',
      manager: 'PredictProp Core',
      apy: '12-18%',
      tvl: '$2.4M',
      risk: 'Low',
      strategy: 'Market Making + Arbitrage',
      minDeposit: '1000',
      maxDeposit: '100000',
      performance: '+15.2%',
      color: 'green'
    },
    {
      id: 'balanced',
      name: 'Balanced Vault',
      manager: 'Alpha Traders',
      apy: '18-28%',
      tvl: '$5.8M',
      risk: 'Medium',
      strategy: 'Directional + Market Making',
      minDeposit: '5000',
      maxDeposit: '500000',
      performance: '+22.7%',
      color: 'blue'
    },
    {
      id: 'aggressive',
      name: 'Aggressive Vault',
      manager: 'Elite Market Makers',
      apy: '25-45%',
      tvl: '$1.2M',
      risk: 'High',
      strategy: 'High-Frequency + Volatility',
      minDeposit: '10000',
      maxDeposit: '1000000',
      performance: '+38.4%',
      color: 'purple'
    }
  ];

  const marketMakers = [
    {
      id: 'mm1',
      name: 'PredictProp Core',
      rating: 5.0,
      totalReturn: '+156.7%',
      totalTvl: '$2.4M',
      winRate: '78%',
      maxDrawdown: '-8.2%',
      sharpeRatio: '2.34',
      strategies: ['Market Making', 'Arbitrage', 'Cross-Exchange'],
      verified: true
    },
    {
      id: 'mm2',
      name: 'Alpha Traders',
      rating: 4.8,
      totalReturn: '+234.1%',
      totalTvl: '$5.8M',
      winRate: '72%',
      maxDrawdown: '-12.4%',
      sharpeRatio: '1.98',
      strategies: ['Directional Trading', 'Market Making', 'Event Trading'],
      verified: true
    },
    {
      id: 'mm3',
      name: 'Elite Market Makers',
      rating: 4.9,
      totalReturn: '+189.3%',
      totalTvl: '$1.2M',
      winRate: '81%',
      maxDrawdown: '-15.7%',
      sharpeRatio: '2.12',
      strategies: ['High-Frequency', 'Volatility Trading', 'Cross-Asset'],
      verified: true
    }
  ];

  return (
    <div className={styles.lpPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1>Liquidity Vaults</h1>
            <p>Stake USDC and earn yield from professional market makers trading prediction markets</p>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>$9.4M</span>
                <span className={styles.statLabel}>Total Value Locked</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>18.7%</span>
                <span className={styles.statLabel}>Average APY</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>1,247</span>
                <span className={styles.statLabel}>Active Depositors</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className={styles.tabsSection}>
        <div className={styles.container}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'vaults' ? styles.active : ''}`}
              onClick={() => setActiveTab('vaults')}
            >
              Vaults
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'marketmakers' ? styles.active : ''}`}
              onClick={() => setActiveTab('marketmakers')}
            >
              Market Makers
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Create Vault
            </button>
          </div>
        </div>
      </section>

      {/* Vaults Tab */}
      {activeTab === 'vaults' && (
        <section className={styles.vaultsSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Available Vaults</h2>
              <p>Choose from professionally managed liquidity vaults with different risk profiles</p>
            </div>
            
            <div className={styles.vaultsGrid}>
              {vaults.map((vault) => (
                <div key={vault.id} className={`${styles.vaultCard} ${styles[vault.color]}`}>
                  <div className={styles.vaultHeader}>
                    <div className={styles.vaultInfo}>
                      <h3>{vault.name}</h3>
                      <p className={styles.manager}>by {vault.manager}</p>
                    </div>
                    <div className={styles.vaultApy}>
                      <span className={styles.apyValue}>{vault.apy}</span>
                      <span className={styles.apyLabel}>APY</span>
                    </div>
                  </div>
                  
                  <div className={styles.vaultStats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>TVL</span>
                      <span className={styles.statValue}>{vault.tvl}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Risk</span>
                      <span className={`${styles.riskBadge} ${styles[vault.risk.toLowerCase()]}`}>
                        {vault.risk}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Performance</span>
                      <span className={styles.performance}>{vault.performance}</span>
                    </div>
                  </div>
                  
                  <div className={styles.vaultDetails}>
                    <p className={styles.strategy}>{vault.strategy}</p>
                    <p className={styles.depositRange}>
                      Min: ${vault.minDeposit} • Max: ${vault.maxDeposit}
                    </p>
                  </div>
                  
                  <button 
                    className={styles.stakeButton}
                    onClick={() => setSelectedVault(vault)}
                  >
                    Stake USDC
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Market Makers Tab */}
      {activeTab === 'marketmakers' && (
        <section className={styles.marketMakersSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Market Makers</h2>
              <p>Top-performing market makers managing liquidity vaults</p>
            </div>
            
            <div className={styles.mmGrid}>
              {marketMakers.map((mm) => (
                <div key={mm.id} className={styles.mmCard}>
                  <div className={styles.mmHeader}>
                    <div className={styles.mmInfo}>
                      <h3>{mm.name}</h3>
                      {mm.verified && <span className={styles.verifiedBadge}>✓ Verified</span>}
                    </div>
                    <div className={styles.rating}>
                      <span className={styles.ratingValue}>{mm.rating}</span>
                      <div className={styles.stars}>★★★★★</div>
                    </div>
                  </div>
                  
                  <div className={styles.mmStats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Total Return</span>
                      <span className={styles.statValue}>{mm.totalReturn}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>TVL Managed</span>
                      <span className={styles.statValue}>{mm.totalTvl}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Win Rate</span>
                      <span className={styles.statValue}>{mm.winRate}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Max Drawdown</span>
                      <span className={styles.statValue}>{mm.maxDrawdown}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Sharpe Ratio</span>
                      <span className={styles.statValue}>{mm.sharpeRatio}</span>
                    </div>
                  </div>
                  
                  <div className={styles.strategies}>
                    <h4>Strategies</h4>
                    <div className={styles.strategyTags}>
                      {mm.strategies.map((strategy, index) => (
                        <span key={index} className={styles.strategyTag}>{strategy}</span>
                      ))}
                    </div>
                  </div>
                  
                  <button className={styles.viewVaultsButton}>
                    View Vaults
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Create Vault Tab */}
      {activeTab === 'create' && (
        <section className={styles.createVaultSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Create Your Vault</h2>
              <p>Bootstrap capital as a market maker and earn depositors yield from your trading</p>
            </div>
            
            <div className={styles.createVaultForm}>
              <div className={styles.formSection}>
                <h3>Vault Configuration</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Vault Name</label>
                    <input type="text" placeholder="e.g., My Trading Vault" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Strategy Type</label>
                    <select>
                      <option>Market Making</option>
                      <option>Directional Trading</option>
                      <option>Arbitrage</option>
                      <option>High-Frequency</option>
                      <option>Volatility Trading</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Risk Level</label>
                    <select>
                      <option>Conservative</option>
                      <option>Balanced</option>
                      <option>Aggressive</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Management Fee (%)</label>
                    <input type="number" placeholder="2.0" step="0.1" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Performance Fee (%)</label>
                    <input type="number" placeholder="20.0" step="1" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Minimum Deposit (USDC)</label>
                    <input type="number" placeholder="1000" />
                  </div>
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h3>Initial Capital</h3>
                <div className={styles.capitalInput}>
                  <label>Your Initial USDC Deposit</label>
                  <div className={styles.inputGroup}>
                    <input type="number" placeholder="10000" />
                    <span className={styles.currency}>USDC</span>
                  </div>
                  <p className={styles.helpText}>
                    Minimum $10,000 required to create a vault. This demonstrates your commitment and provides initial liquidity.
                  </p>
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h3>Terms & Conditions</h3>
                <div className={styles.terms}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" />
                    <span>I understand the risks of market making and prediction market trading</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" />
                    <span>I agree to the vault creation terms and fee structure</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" />
                    <span>I will maintain professional trading standards and risk management</span>
                  </label>
                </div>
              </div>
              
              <button className={styles.createVaultButton}>
                Create Vault
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Stake Modal */}
      {selectedVault && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Stake in {selectedVault.name}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedVault(null)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.vaultSummary}>
                <div className={styles.summaryItem}>
                  <span>Expected APY</span>
                  <span>{selectedVault.apy}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>Risk Level</span>
                  <span>{selectedVault.risk}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>Strategy</span>
                  <span>{selectedVault.strategy}</span>
                </div>
              </div>
              
              <div className={styles.stakeForm}>
                <label>Amount to Stake (USDC)</label>
                <div className={styles.inputGroup}>
                  <input 
                    type="number" 
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="1000"
                  />
                  <span className={styles.currency}>USDC</span>
                </div>
                <div className={styles.amountButtons}>
                  <button onClick={() => setStakeAmount('1000')}>$1K</button>
                  <button onClick={() => setStakeAmount('5000')}>$5K</button>
                  <button onClick={() => setStakeAmount('10000')}>$10K</button>
                  <button onClick={() => setStakeAmount('50000')}>$50K</button>
                </div>
              </div>
              
              <div className={styles.stakeSummary}>
                <h4>Stake Summary</h4>
                <div className={styles.summaryRow}>
                  <span>Amount</span>
                  <span>${stakeAmount || '0'} USDC</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Expected Annual Yield</span>
                  <span>${stakeAmount ? (parseFloat(stakeAmount) * 0.18).toFixed(0) : '0'} USDC</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Management Fee</span>
                  <span>2% annually</span>
                </div>
              </div>
              
              <button className={styles.confirmStakeButton}>
                Confirm Stake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
