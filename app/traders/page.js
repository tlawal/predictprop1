'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Tab } from '@headlessui/react';
import useSWR from 'swr';
import ProgressTracker from './components/ProgressTracker';
import PositionsTable from './components/PositionsTable';
import CloseModal from './components/CloseModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

function TradersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, ready } = usePrivy();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDemoBadge, setShowDemoBadge] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mx-4 mt-8 mb-6">
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
            <div className="text-sm text-gray-400">Virtual Balance:</div>
            <div className={`text-2xl font-bold ${roi > 0 ? 'text-green-400' : 'text-white'}`}>
              ${balance.toLocaleString()}
            </div>
          </div>

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
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              {challengeData ? (
                <ProgressTracker
                  challengeData={challengeData}
                  challengeSize={challengeSize}
                />
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
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-semibold text-white mb-4">Performance Analytics</h3>
                <p className="text-gray-400">Detailed performance charts and analytics coming soon.</p>
              </div>
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