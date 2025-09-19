'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import LeaderboardTable from './components/LeaderboardTable';
import toast, { Toaster } from 'react-hot-toast';

const fetcher = (url) => fetch(url).then((res) => res.json());

function LeaderboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);

    const newUrl = params.toString() ? `?${params.toString()}` : '/leaderboard';
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, router]);

  // Fetch leaderboard data
  const { data: leaderboardData, error, isLoading } = useSWR(
    debouncedSearch ? `/api/leaderboard?search=${debouncedSearch}` : '/api/leaderboard',
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  const handleRefresh = async () => {
    toast.loading('Refreshing leaderboard...', { id: 'refresh' });
    try {
      await mutate('/api/leaderboard');
      if (debouncedSearch) {
        await mutate(`/api/leaderboard?search=${debouncedSearch}`);
      }
      toast.success('Leaderboard updated!', { id: 'refresh' });
    } catch (error) {
      toast.error('Failed to refresh leaderboard', { id: 'refresh' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 md:pt-0">
      {/* Hero Section */}
      <section className="relative py-8 md:py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-teal-500/20"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-4">
            <span className="text-2xl">🏆</span>
            <span className="text-sm font-semibold text-white">Top Traders</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Top Polymarket Traders by PnL
            </span>
          </h1>

          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
            Realized profits from resolved markets
          </p>

          {/* Search Bar and Refresh Button in one row */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-lg mx-auto mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search wallet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 text-base bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-3 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 hover:border-teal-500/50 rounded-xl text-teal-400 hover:text-teal-300 transition-all duration-200 text-sm whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Data cached hourly • Last updated: {leaderboardData?.lastUpdated ? new Date(leaderboardData.lastUpdated).toLocaleString() : 'Loading...'}
          </p>
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <LeaderboardTable
          data={leaderboardData?.traders || []}
          isLoading={isLoading}
          error={error}
          searchQuery={debouncedSearch}
        />
      </section>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 md:pt-0 flex items-center justify-center">
        <div className="text-white text-lg">Loading leaderboard...</div>
      </div>
    }>
      <LeaderboardPageContent />
    </Suspense>
  );
}