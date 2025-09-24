'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Tab } from '@headlessui/react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';
import Confetti from 'react-confetti';
import ProgressTracker from './components/ProgressTracker';
import PositionsTable from './components/PositionsTable';
import CloseModal from './components/CloseModal';
import RiskAlertBanner from './components/RiskAlertBanner';
import TradeHistoryList from './components/TradeHistoryList';
import EquityCurveChart from './components/EquityCurveChart';
import SidePanel from './components/SidePanel';
import TradingObjectives from './components/TradingObjectives';
import ResultsProgress from './components/ResultsProgress';
import OnboardingModal from './components/OnboardingModal';
import AffiliatesPanel from './components/AffiliatesPanel';
import CompetitionsPanel from './components/CompetitionsPanel';
import toast, { Toaster } from 'react-hot-toast';

const fetcher = (url) => fetch(url).then((res) => res.json());

function TradersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, ready } = usePrivy();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDemoBadge, setShowDemoBadge] = useState(true);
  const [showRiskAlert, setShowRiskAlert] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Challenge completion handler
  const handleChallengeComplete = async () => {
    try {
      // Update challenge status to 'passed' in Supabase
      const response = await fetch('/api/challenge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status: 'passed'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update challenge status');
      }

      // Send challenge completion email
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'challenge_completed',
          userId: user.id
        }),
      });

      // Trigger payout distribution (mock for now)
      // In production, this would call the vault contract
      console.log('Challenge completed! Triggering payout distribution...');

      // Show success message and confetti
      toast.success('🎉 Challenge completed! Certificate generated.', {
        duration: 5000,
      });

      // Trigger confetti celebration
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Switch to live trading mode
      setIsDemoMode(false);

    } catch (error) {
      console.error('Error completing challenge:', error);
      toast.error('Error completing challenge. Please try again.');
      throw error;
    }
  };

  // Auth check
  useEffect(() => {
    if (ready && !user) {
      router.push('/?error=unauth');
    }
  }, [ready, user, router]);



  // Handle tab persistence from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'positions') {
      setActiveTab(1);
    } else if (tab === 'performance') {
      setActiveTab(2);
    } else {
      setActiveTab(0);
    }
  }, [searchParams]);

  // Fetch virtual balance and challenge data
  const { data: balanceData, error: balanceError } = useSWR(
    user ? `/api/balance?userId=${user.id}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: challengeData, error: challengeError } = useSWR(
    user ? `/api/challenge?userId=${user.id}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // First load onboarding modal
  useEffect(() => {
    if (ready && user && challengeData) {
      // Check if user has seen onboarding (stored in localStorage)
      const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${user.id}`);
      if (!hasSeenOnboarding) {
        setShowOnboardingModal(true);
      }
    }
  }, [ready, user, challengeData]);

  // Check if challenge is already passed (switch to live mode)
  useEffect(() => {
    if (challengeData?.challengeStatus === 'passed') {
      setIsDemoMode(false);
    }
  }, [challengeData]);

  // Fetch trade history for Performance tab
  const { data: historyData, error: historyError } = useSWR(
    user ? `/api/history?userId=${user.id}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch risk analysis for alerts
  const { data: riskData, error: riskError } = useSWR(
    user ? `/api/risk?userId=${user.id}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Check risk every minute
      onSuccess: async (data) => {
        // Check for breach alerts and send emails
        if (data?.breachAlert && !data?.emailSent) {
          try {
            await fetch('/api/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'breach_alert',
                userId: user.id,
                breachType: data.breachType,
                breachValue: data.breachValue,
                challengeId: data.challengeId
              }),
            });
            console.log('Breach alert email sent');
          } catch (error) {
            console.error('Error sending breach alert email:', error);
          }
        }
      }
    }
  );

  // Real-time notifications subscription
  useEffect(() => {
    if (!user) return;

    // Subscribe to notifications for this user
    const notificationChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new;

          // Show toast notification based on type
          switch (notification.type) {
            case 'success':
              toast.success(notification.msg, {
                duration: 5000,
                icon: '🎉'
              });
              break;
            case 'warning':
              toast(notification.msg, {
                duration: 6000,
                icon: '⚠️',
                style: {
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #f59e0b'
                }
              });
              break;
            case 'error':
              toast.error(notification.msg, {
                duration: 7000
              });
              break;
            case 'info':
            default:
              toast(notification.msg, {
                duration: 5000,
                icon: 'ℹ️'
              });
              break;
          }

          // Refresh notifications data
          if (window.location.pathname.includes('/traders')) {
            // Could trigger a refetch of notifications if needed
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [user]);

  // Show loading if auth is not ready
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  const balance = balanceData?.balance || 0;
  const challengeSize = balanceData?.challengeSize || 5000;
  const roi = challengeData?.projectedROI || 0;

  const handleTabChange = (index) => {
    setActiveTab(index);
    const tabNames = ['challenges', 'positions', 'performance'];
    router.replace(`/traders?tab=${tabNames[index]}`, { scroll: false });
  };

  const handlePositionClick = (position) => {
    setSelectedPosition(position);
    setShowCloseModal(true);
  };

  const handleClosePosition = async (qty) => {
    try {
      // Mock API call - in real implementation this would call the actual API
      console.log('Closing position:', selectedPosition.id, 'qty:', qty);

      // Here you would make the actual API call
      // const response = await fetch('/api/order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     tokenId: selectedPosition.clobTokenId,
      //     side: 'sell',
      //     qty: qty,
      //     price: selectedPosition.currentPrice
      //   })
      // });

      // Mock success
      alert(`Closed ${qty} shares! Updated balance.`);
      setShowCloseModal(false);
      setSelectedPosition(null);

      // Refresh data
      // mutate('/api/positions');
      // mutate('/api/balance');
      // mutate('/api/challenge');

    } catch (error) {
      console.error('Error closing position:', error);
      alert('Error closing position. Please try again.');
    }
  };

  const handleDismissRiskAlert = () => {
    setShowRiskAlert(false);
    toast.success('Risk alert dismissed');
  };

  const handleViewPositions = () => {
    setActiveTab(1); // Switch to Positions tab
    router.replace('/traders?tab=positions', { scroll: false });
    toast.success('Switched to Positions tab');
  };

  const handleFilterChange = (filter) => {
    // Re-fetch data with new filter (this would be implemented in a real app)
    console.log('Filter changed to:', filter);
  };

  // Shadow trading - mirror real Polymarket trades
  const handleShadowTrading = async () => {
    try {
      toast.loading('Starting shadow trading...', { id: 'shadow' });

      // Query recent Polymarket trades via TheGraph
      const response = await fetch('/api/polymarket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetRecentTrades {
              trades(
                first: 10
                orderBy: blockTimestamp
                orderDirection: desc
                where: { blockTimestamp_gte: ${Math.floor(Date.now() / 1000) - 3600} }
              ) {
                id
                market {
                  id
                  question
                  outcomeTokenMarginalPrices
                }
                outcomeIndex
                price
                shares
                blockTimestamp
              }
            }
          `
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Polymarket data');
      }

      const data = await response.json();
      const trades = data.data?.trades || [];

      // Insert mock trades based on real Polymarket activity
      for (const trade of trades.slice(0, 3)) { // Limit to 3 trades
        await fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            tokenId: trade.market.id,
            side: Math.random() > 0.5 ? 'buy' : 'sell',
            qty: Math.floor(Math.random() * 10) + 1,
            price: parseFloat(trade.price),
            isShadowTrade: true // Mark as shadow trade
          }),
        });
      }

      toast.success(`Mirrored ${Math.min(trades.length, 3)} real trades!`, { id: 'shadow' });

      // Refresh data
      // mutate('/api/positions');
      // mutate('/api/history');

    } catch (error) {
      console.error('Shadow trading error:', error);
      toast.error('Failed to start shadow trading', { id: 'shadow' });
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
    localStorage.setItem(`onboarding_seen_${user.id}`, 'true');
    toast.success('Welcome to PolyProp! Let\'s start trading!');
  };

  // Check if balance is near equity limit (e.g., within 10% of max challenge size)
  const equityLimitNear = balance > (challengeSize * 0.9);
  const maxEquityLimit = challengeSize * 2; // Example: 2x challenge size
  const equityLimitReached = balance >= maxEquityLimit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 md:pt-0">
      {/* Confetti Celebration */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={300}
          recycle={false}
          gravity={0.3}
        />
      )}

      {/* Demo Mode Banner */}
      {isDemoMode && showDemoBadge && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-3 text-center relative">
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold">🎯 Demo Mode: Virtual Trades - Pass Challenge to Go Live!</span>
          </div>
          <button
            onClick={() => setShowDemoBadge(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-800 hover:text-yellow-900"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Desktop Side Panel */}
        <div className={`hidden lg:block transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}>
          <SidePanel
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header with Side Panel Toggle */}
          <div className="lg:hidden bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSidePanel(true)}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className={`text-xl font-bold ${roi > 0 ? 'text-green-400' : 'text-white'}`}>
                ${balance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Header Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mx-4 mt-4 lg:mt-20 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {showDemoBadge && (
                  <div className="flex items-center bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    <span>Demo Mode: Virtual ${challengeSize.toLocaleString()}</span>
                    <button
                      onClick={() => {
                        setShowDemoBadge(false);
                        console.log('Demo active');
                      }}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="text-sm text-gray-400 hidden lg:block">Virtual Balance:</div>
                <div className={`text-2xl font-bold ${roi > 0 ? 'text-green-400' : 'text-white'}`}>
                  ${balance.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Desktop Side Panel Toggle */}
                <button
                  onClick={() => setShowSidePanel(true)}
                  className="lg:hidden px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
                >
                  Menu
                </button>

                <button
                  onClick={() => {
                    // Refresh all data
                    console.log('Refreshing all data...');
                    // mutate('/api/balance');
                    // mutate('/api/challenge');
                    // mutate('/api/challenge');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Refresh All
                </button>
              </div>
            </div>
          </div>

          {/* Equity Limit Alert Banner */}
          {equityLimitNear && (
            <div className="mx-4 mb-6">
              <div className={`p-4 rounded-lg border ${
                equityLimitReached
                  ? 'bg-red-900/50 border-red-600 text-red-200'
                  : 'bg-yellow-900/50 border-yellow-600 text-yellow-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {equityLimitReached ? '🚫' : '⚠️'}
                  </span>
                  <div>
                    <h3 className="font-semibold">
                      {equityLimitReached ? 'Equity Limit Reached' : 'Approaching Equity Limit'}
                    </h3>
                    <p className="text-sm mt-1">
                      {equityLimitReached
                        ? 'You have reached the maximum equity limit. Further trading is restricted.'
                        : 'You are approaching the maximum equity limit. Consider taking profits or reducing exposure.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trading Objectives */}
          <TradingObjectives challengeData={challengeData} challengeSize={challengeSize} />

          {/* Results Progress */}
          <ResultsProgress challengeData={challengeData} />

          {/* Tabs */}
          <div className="mx-4 mb-8">
        <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
          <Tab.List className="flex space-x-1 rounded-xl bg-slate-800/30 p-1 mb-6">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Challenges
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Positions
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Performance
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Affiliates
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Competitions
            </Tab>
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              {challengeData ? (
                <div>
                  <ProgressTracker
                    challengeData={challengeData}
                    challengeSize={challengeSize}
                    onChallengeComplete={handleChallengeComplete}
                    isDemoMode={isDemoMode}
                  />

                  {/* Shadow Trading Button - Only in demo mode */}
                  {isDemoMode && (
                    <div className="mt-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">🎭 Shadow Trading</h3>
                        <p className="text-slate-400 text-sm mb-4">
                          Mirror real Polymarket trades to practice with live market data
                        </p>
                        <button
                          onClick={handleShadowTrading}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                        >
                          <span>👻</span>
                          Start Shadow Trading
                        </button>
                        <p className="text-xs text-slate-500 mt-2">
                          This will create mock trades based on real Polymarket activity
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">No Active Challenge</h3>
                  <p className="text-gray-400 mb-6">Start your first trading challenge to begin tracking progress.</p>
                  <Link
                    href="/?size=5000"
                    className="inline-block px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                  >
                    Start Challenge
                  </Link>
                </div>
              )}
            </Tab.Panel>

            <Tab.Panel>
              <PositionsTable onPositionClick={handlePositionClick} />
            </Tab.Panel>

            <Tab.Panel>
              <div className="space-y-6">
                    {/* Risk Alert Banner */}
                    <RiskAlertBanner
                      onViewPositions={handleViewPositions}
                    />

                {/* Trade History */}
                <TradeHistoryList
                  trades={historyData?.trades || []}
                  onFilterChange={handleFilterChange}
                />

                {/* Equity Curve Chart */}
                {historyData?.equityHistory && (
                  <EquityCurveChart
                    equityHistory={historyData.equityHistory}
                    positions={[]} // Would be populated with actual positions data
                  />
                )}

                {/* Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Trades</p>
                        <p className="text-2xl font-bold text-white">{historyData?.summary?.totalTrades || 0}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        📊
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Win Rate</p>
                        <p className="text-2xl font-bold text-green-400">
                          {historyData?.summary?.winRate ? `${Math.round(historyData.summary.winRate)}%` : '0%'}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                        🎯
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total P&L</p>
                        <p className={`text-2xl font-bold ${(historyData?.summary?.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${Math.abs(historyData?.summary?.totalPnL || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${(historyData?.summary?.totalPnL || 0) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {(historyData?.summary?.totalPnL || 0) >= 0 ? '📈' : '📉'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Open Positions</p>
                        <p className="text-2xl font-bold text-yellow-400">{historyData?.summary?.openTrades || 0}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                        ⏳
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <AffiliatesPanel />
            </Tab.Panel>

            <Tab.Panel>
              <CompetitionsPanel />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Close Position Modal */}
      {showCloseModal && selectedPosition && (
        <CloseModal
          position={selectedPosition}
          onClose={() => setShowCloseModal(false)}
          onConfirm={handleClosePosition}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #374151',
          },
          success: {
            icon: '✅',
          },
          error: {
            icon: '❌',
          },
        }}
      />

      {/* Mobile Side Panel */}
      <SidePanel isOpen={showSidePanel} onClose={() => setShowSidePanel(false)} isMobile={true} />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleOnboardingComplete}
      />
        </div>
      </div>
    </div>
  );
}

export default function TradersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading traders page...</div>
      </div>
    }>
      <TradersPageContent />
    </Suspense>
  );
}