'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { useHotkeys } from 'react-hotkeys-hook';
import { Dialog, Transition } from '@headlessui/react';
import toast, { Toaster } from 'react-hot-toast';
import Fuse from 'fuse.js';
import Image from 'next/image';
import Marquee from 'react-marquee-slider';
import MarketsTable from './components/MarketsTable';
import OrderModal from './components/OrderModal';
import FiltersComponent from './components/FiltersComponent';
// Removed old oddsStore import - now using usePolymarketWebSocket hook


// Live Markets Marquee Component
function LiveMarketsMarquee({ trendingData }) {
  const trendingMarkets = trendingData?.markets || [];

  if (!trendingMarkets.length) return null;

  return (
    <div className="relative w-full overflow-x-hidden bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 mt-4">
      {/* Continuous horizontal marquee for all screens - single line only */}
      <div className="h-6 w-full overflow-x-hidden flex items-center">
        <Marquee
          velocity={15} // Even slower for mobile readability
          direction="rtl" // Right-to-left scrolling for proper left-to-right text flow
          scatterRandomly={false}
          resetAfterTries={200}
          pauseOnHover={true}
          onInit={() => {}}
          onFinish={() => {}}
        >
          {trendingMarkets.map((market, index) => {
            const yesPrice = Math.round(market.yesOdds * 100);
            const volume24hr = market.volume24hr || 0;
            const volumeDisplay = volume24hr >= 1000 ? `${(volume24hr / 1000).toFixed(0)}k` : volume24hr.toFixed(0);

            // Show full question text for scrolling
            const fullQuestion = market.question;

            return (
              <div
                key={market.id}
                className="inline-flex flex-row flex-nowrap items-center gap-2 sm:gap-4 px-3 whitespace-nowrap"
              >
                <span className="text-teal-400 font-semibold text-xs whitespace-nowrap">
                  {fullQuestion}
                </span>
                <span className="text-gray-300 text-xs whitespace-nowrap">
                  {yesPrice}%
                </span>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  ${volumeDisplay}
                </span>
                <span className="mx-1 sm:mx-2 text-gray-600">•</span>
              </div>
            );
          })}
        </Marquee>
      </div>
    </div>
  );
}

function MarketsPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'volume24hr_desc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Advanced filters state
  const [filters, setFilters] = useState(() => {
    // Check for categories parameter first (comma-separated format)
    const categoriesParam = searchParams.get('categories');
    if (categoriesParam) {
      const categories = categoriesParam.split(',').map(cat => cat.trim()).filter(Boolean);
      return {
        categories,
        status: ['open'], // Default to open markets
        time: []
      };
    }

    // Fallback to filters parameter (JSON format)
    const filtersParam = searchParams.get('filters');
    if (filtersParam) {
      try {
        return JSON.parse(decodeURIComponent(filtersParam));
      } catch (e) {
        console.warn('Invalid filters parameter:', e);
      }
    }

    return {
      categories: [],
      status: ['open'], // Default to open markets
      time: []
    };
  });
  const tableRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter change handler
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);

    // Update URL with filters
    const params = new URLSearchParams(searchParams);

    // Use simple categories parameter if only categories are selected
    if (newFilters.categories.length > 0 && newFilters.status.length === 1 && newFilters.status[0] === 'open' && newFilters.time.length === 0) {
      params.set('categories', newFilters.categories.join(','));
      params.delete('filters');
    } else if (newFilters.categories.length > 0 || newFilters.status.length > 0 || newFilters.time.length > 0) {
      // Use JSON format for complex filters
      params.set('filters', encodeURIComponent(JSON.stringify(newFilters)));
      params.delete('categories');
    } else {
      // No filters
      params.delete('filters');
      params.delete('categories');
    }

    // Preserve other params
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSort !== 'volume24hr_desc') params.set('sort', selectedSort);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Client-side filtering function
  const filterMarkets = (markets) => {
    if (!markets) return [];

    let filtered = markets;

    // Apply search filter using Fuse.js fuzzy search
    if (debouncedSearch && debouncedSearch.trim()) {
      const fuse = new Fuse(filtered, {
        keys: [
          { name: 'question', weight: 0.7 },
          { name: 'description', weight: 0.2 },
          { name: 'tags', weight: 0.1 }
        ],
        threshold: 0.3, // Lower threshold = stricter matching
        includeScore: true,
        shouldSort: true,
      });

      const searchResults = fuse.search(debouncedSearch.trim());
      filtered = searchResults.map(result => result.item);
    }

    return filtered.filter(market => {
      // Category filter
      if (filters.categories.length > 0) {
        const marketCategories = [
          ...(market.categories || []),
          ...(market.tags || []),
          market.category,
          market.sport
        ].filter(Boolean).map(cat => cat.toLowerCase());

        const hasMatchingCategory = filters.categories.some(filterCat =>
          marketCategories.includes(filterCat.toLowerCase())
        );

        if (!hasMatchingCategory) return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        const marketStatus = market.closed ? 'closed' : 'open';
        if (!filters.status.includes(marketStatus)) return false;
      }

      // Time filter
      if (filters.time.length > 0) {
        if (!market.endDateIso) return false;

        const endDate = new Date(market.endDateIso);
        const now = new Date();

        const hasMatchingTime = filters.time.some(timeFilter => {
          switch (timeFilter) {
            case '<1wk':
              return endDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case '1-4wk':
              const week4 = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
              return endDate > new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) && endDate <= week4;
            default:
              return false;
          }
        });

        if (!hasMatchingTime) return false;
      }

      return true;
    });
  };

  // Removed old oddsStore usage - now handled by MarketsTable component

  // Fetch all markets for client-side filtering
  const { data: allMarketsData, isLoading: marketsLoading } = useSWR(
    '/api/markets?limit=200', // Fetch more markets for client-side filtering
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      errorRetryCount: 2,
      errorRetryInterval: 10000,
    }
  );

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply client-side filtering
  const filteredMarkets = useMemo(() => {
    if (!allMarketsData?.markets) return [];
    return filterMarkets(allMarketsData.markets);
  }, [allMarketsData, filters, debouncedSearch]);

  // Fetch trending markets for the trending section
  const { data: trendingData } = useSWR(
    '/api/markets?limit=5&order=volume24hr,desc',
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      errorRetryCount: 2,
      errorRetryInterval: 10000,
    }
  );

  // Fetch AI recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading } = useSWR(
    '/api/recommend?userId=demo_user&limit=5',
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 600000, // 10 minutes
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  const handleMarketClick = (market) => {
    setSelectedMarket(market);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMarket(null);
  };

  // Keyboard navigation
  useHotkeys('/', (e) => {
    e.preventDefault();
    searchInputRef.current?.focus();
  }, []);


  const handleSortChange = (sortValue) => {
    setSelectedSort(sortValue);
  };

  // Map sort values to API order parameters
  const getSortOrderParam = (sortValue) => {
    switch (sortValue) {
      case 'volume24hr_desc':
        return 'volume24hr,desc';
      case 'volume24hr_asc':
        return 'volume24hr,asc';
      case 'newest':
        return 'createdAt,desc';
      case 'liquidity_desc':
        return 'liquidity,desc';
      case 'liquidity_asc':
        return 'liquidity,asc';
      default:
        return 'volume24hr,desc';
    }
  };


  // AI Recommended Section Component
  const AIRecommendedSection = () => {
    if (recommendationsLoading || !recommendationsData?.recommendations) {
      return (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-white">AI Recommended</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
              <span className="text-purple-400 text-sm font-medium">🤖 AI</span>
            </div>
          </div>
          <div className="text-gray-400">Loading AI recommendations...</div>
        </div>
      );
    }

    const recommendations = recommendationsData.recommendations;

    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-white">AI Recommended</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full">
            <span className="text-purple-400 text-sm font-medium">🤖 AI</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            {recommendations.map((market) => (
              <div
                key={market.id}
                className="flex-shrink-0 w-80 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-indigo-900/30 border-purple-500/30"
                onClick={() => handleMarketClick(market)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400 text-lg">🎯</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2">
                      {market.question}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        market.predictedDrawdown < 2 ? 'bg-green-900/50 text-green-300' :
                        market.predictedDrawdown < 3 ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-red-900/50 text-red-300'
                      }`}>
                        {(market.predictedDrawdown * 100).toFixed(1)}% Risk
                      </span>
                      <span className="text-xs text-gray-400">{market.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        market.yesOdds > 0.5 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                      }`}>
                        Yes: {(market.yesOdds * 100).toFixed(0)}%
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        market.noOdds > 0.5 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                      }`}>
                        No: {(market.noOdds * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-2">
                  {market.reasoning}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Vol: ${Math.round(market.volume24hr / 1000)}k</span>
                  <span className="text-purple-400">AI Score: {(market.aiConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 md:pt-0">
      {/* Hero Section */}
      <section className="relative py-4 md:py-6 px-4 bg-gradient-to-r from-gray-800 to-gray-900 animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-teal-500/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">

          <h1 className="text-xl md:text-3xl font-black text-white mb-8">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              {t('markets.exploreLiveMarkets')}
            </span>
          </h1>

          {/* Live Markets Marquee */}
          <div className="w-full overflow-hidden">
            <LiveMarketsMarquee trendingData={trendingData} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Markets Table */}
        <MarketsTable
          markets={filteredMarkets}
          searchQuery={debouncedSearch}
          sortOrder={getSortOrderParam(selectedSort)}
          onMarketClick={handleMarketClick}
          tableRef={tableRef}
          isLoading={marketsLoading}
          onSearchChange={setSearchQuery}
          onFiltersToggle={() => setFiltersModalOpen(true)}
          filters={filters}
          searchInputRef={searchInputRef}
        />
      </div>

      {/* Filters Modal */}
      <Transition appear show={filtersModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setFiltersModalOpen(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-1"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 pt-20">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 shadow-xl transition-all">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                        Filters
                      </Dialog.Title>
                      <button
                        onClick={() => setFiltersModalOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <FiltersComponent
                      filters={filters}
                      onFiltersChange={(newFilters) => {
                        handleFiltersChange(newFilters);
                        // Auto-close modal on desktop after applying filters
                        setFiltersModalOpen(false);
                      }}
                      isModal={true}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Order Modal */}
      {modalOpen && selectedMarket && (
        <OrderModal
          market={selectedMarket}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151'
          }
        }}
      />
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading markets...</div>
      </div>
    }>
      <MarketsPageContent />
    </Suspense>
  );
}