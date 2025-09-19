'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import useSWR from 'swr';
import Link from 'next/link';
import VaultStatsCard from './components/VaultStatsCard';
import YieldGraph from './components/YieldGraph';
import DepositForm from './components/DepositForm';
import WithdrawForm from './components/WithdrawForm';
import BreakdownModal from './components/BreakdownModal';
import styles from '../styles/LPs.module.css';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function LPsPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  // No longer auth-gated - show placeholder data for non-authenticated users

  // Fetch vault data (always fetch, will show placeholders for non-auth)
  const { data: vaultData, error: vaultError } = useSWR(
    '/api/vault',
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch yield data with 5-minute polling (always fetch)
  const { data: yieldData, error: yieldError } = useSWR(
    '/api/yield',
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  // Placeholder data for non-authenticated users
  const placeholderVaultData = {
    tvl: '2,450,000',
    userBalance: '0',
    userShares: '0',
    userYield: '0',
    lockPeriod: null,
  };

  const placeholderYieldData = {
    apy: '14.5%',
    aiOptimized: false,
    aiInsight: 'Connect wallet to see personalized AI insights',
    breakdown: { fees: 60, splits: 40 },
    aiRecommendations: {
      fees: 60,
      splits: 40,
      description: 'Connect wallet for AI-optimized allocation recommendations',
    },
    chartData: generatePlaceholderChartData(),
  };

  function generatePlaceholderChartData() {
    const data = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const baseYield = Math.random() * 80 + 40;
      const fees = baseYield * 0.6;
      const splits = baseYield * 0.4;

      data.push({
        date: date.toISOString().split('T')[0],
        fees: Math.round(fees * 100) / 100,
        splits: Math.round(splits * 100) / 100,
        total: Math.round(baseYield * 100) / 100,
      });
    }

    return data;
  }

  // Use placeholder data if not authenticated
  const displayVaultData = authenticated ? vaultData : placeholderVaultData;
  const displayYieldData = authenticated ? yieldData : placeholderYieldData;

  // Show loading if auth is not ready
  if (!ready) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  const handleDepositSuccess = () => {
    setShowDepositModal(false);
    // Refresh vault data
    // mutate('/api/vault');
  };

  const handleWithdrawSuccess = () => {
    setShowWithdrawModal(false);
    // Refresh vault data
    // mutate('/api/vault');
  };

  const handleStatsCardClick = () => {
    setShowBreakdownModal(true);
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
          <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleGradient}>Liquidity Vault</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Earn high yields by providing liquidity to top prediction markets traders and top market makers. Stake USDC and receive automated returns w/ AI optimization.
          </p>
        </div>
      </section>

      {/* Stats Cards Grid */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <VaultStatsCard
            title="Total Value Locked"
            value={displayVaultData?.tvl || '0'}
            subtitle="USDC in vault"
            icon="💰"
            onClick={handleStatsCardClick}
          />
          <VaultStatsCard
            title="Projected APY"
            value={displayYieldData?.apy || '0'}
            subtitle="Annual yield"
            icon="📈"
            badge={displayYieldData?.aiOptimized && authenticated ? 'AI Optimized' : null}
            aiInsight={displayYieldData?.aiInsight}
            onClick={handleStatsCardClick}
          />
          <VaultStatsCard
            title="Your Yield"
            value={authenticated ? (displayVaultData?.userYield || '0') : '—'}
            subtitle={authenticated ? "Total earned" : "Connect wallet to deposit & earn"}
            icon="💎"
            onClick={authenticated ? handleStatsCardClick : () => router.push('/?connect=true')}
            disabled={!authenticated}
          />
        </div>
      </section>

      {/* Yield Graph */}
      <section className={styles.graphSection}>
        <div className={styles.sectionHeader}>
          <h2>Yield Performance</h2>
          <p>{authenticated ? "Track your vault performance over the last 30 days" : "Example yield performance (connect wallet for personalized data)"}</p>
        </div>
        <YieldGraph yieldData={displayYieldData?.chartData || []} />
      </section>

      {/* Action Buttons */}
      <section className={styles.actionsSection}>
        <div className={styles.actionsGrid}>
          <button
            className={`${styles.actionButton} ${styles.primary} ${!authenticated ? styles.disabled : ''}`}
            onClick={authenticated ? () => setShowDepositModal(true) : () => router.push('/?connect=true')}
          >
            <span>{authenticated ? 'Deposit USDC' : 'Connect Wallet to Deposit'}</span>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>

          <button
            className={`${styles.actionButton} ${styles.secondary} ${!authenticated ? styles.disabled : ''}`}
            onClick={authenticated ? () => setShowWithdrawModal(true) : () => router.push('/traders')}
            disabled={authenticated && (!displayVaultData?.userShares || displayVaultData.userShares === '0')}
          >
            <span>{authenticated ? 'Withdraw' : 'View Traders'}</span>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        </div>

        {!authenticated && (
          <div className={styles.connectPrompt}>
            <div className={styles.connectPromptIcon}>🔗</div>
            <p>Connect your wallet to start earning high yields and access personalized AI insights.</p>
            <p className={styles.connectPromptSubtext}>No wallet? No problem - explore our platform first!</p>
          </div>
        )}
      </section>

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositForm
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleDepositSuccess}
          userBalance={vaultData?.userBalance || '0'}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawForm
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleWithdrawSuccess}
          userShares={vaultData?.userShares || '0'}
          lockPeriod={vaultData?.lockPeriod}
        />
      )}

      {/* Breakdown Modal */}
      {showBreakdownModal && (
        <BreakdownModal
          onClose={() => setShowBreakdownModal(false)}
          breakdown={yieldData?.breakdown}
          aiRecommendations={yieldData?.aiRecommendations}
        />
      )}
    </div>
  );
}