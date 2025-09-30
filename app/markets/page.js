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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Advanced filters state with comprehensive URL syncing
  const [filters, setFilters] = useState(() => {
    // Try to load from URL filters parameter (JSON format)
    const filtersParam = searchParams.get('filters');
    if (filtersParam) {
      try {
        const parsedFilters = JSON.parse(decodeURIComponent(filtersParam));
        // Convert date strings back to Date objects
        if (parsedFilters.createdAfter) parsedFilters.createdAfter = new Date(parsedFilters.createdAfter);
        if (parsedFilters.createdBefore) parsedFilters.createdBefore = new Date(parsedFilters.createdBefore);
        if (parsedFilters.expiresBefore) parsedFilters.expiresBefore = new Date(parsedFilters.expiresBefore);
        return parsedFilters;
      } catch (e) {
        console.warn('Invalid filters parameter:', e);
      }
    }

    // Default filters
    return {
      // Basic filters
      categories: [],
      tags: [],
      status: ['open'], // Default to open markets
      featured: false,
      restricted: false,

      // Advanced filters
      probabilityMin: 0,
      probabilityMax: 100,
      volumeMin: 0,
      volumeMax: 10000000,
      volume24hrMin: 0,
      volume24hrMax: 10000000,
      liquidityMin: 0,
      liquidityMax: 10000000,
      spreadMax: 20,
      createdAfter: null,
      createdBefore: null,
      expiresBefore: null,
      creator: '',

      // Date ranges (for client-side filtering)
      dateRange: [null, null]
    };
  });
  const tableRef = useRef(null);
  const searchInputRef = useRef(null);

  // Advanced filter change handler with comprehensive URL syncing
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);

    // Update URL with filters (always use JSON format for advanced filters)
    const params = new URLSearchParams(searchParams);

    // Check if any filters are active (excluding defaults)
    const hasActiveFilters = (
      newFilters.categories.length > 0 ||
      newFilters.tags.length > 0 ||
      newFilters.status.length !== 1 || newFilters.status[0] !== 'open' ||
      newFilters.featured ||
      newFilters.restricted ||
      newFilters.probabilityMin > 0 ||
      newFilters.probabilityMax < 100 ||
      newFilters.volumeMin > 0 ||
      newFilters.volumeMax < 10000000 ||
      newFilters.volume24hrMin > 0 ||
      newFilters.volume24hrMax < 10000000 ||
      newFilters.liquidityMin > 0 ||
      newFilters.liquidityMax < 10000000 ||
      newFilters.spreadMax < 20 ||
      newFilters.createdAfter ||
      newFilters.createdBefore ||
      newFilters.expiresBefore ||
      newFilters.creator ||
      (newFilters.dateRange && (newFilters.dateRange[0] || newFilters.dateRange[1]))
    );

    if (hasActiveFilters) {
      // Prepare filters for URL encoding (convert Date objects to ISO strings)
      const filtersForUrl = {
        ...newFilters,
        createdAfter: newFilters.createdAfter?.toISOString() || null,
        createdBefore: newFilters.createdBefore?.toISOString() || null,
        expiresBefore: newFilters.expiresBefore?.toISOString() || null,
        dateRange: newFilters.dateRange?.map(d => d?.toISOString() || null) || [null, null]
      };
      params.set('filters', encodeURIComponent(JSON.stringify(filtersForUrl)));
    } else {
      params.delete('filters');
    }

    // Preserve other params
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSort !== 'volume24hr_desc') params.set('sort', selectedSort);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Build dynamic API URL with server-side filtering
  const buildApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', '200'); // Fetch more markets for client-side filtering

    // Add server-side filter parameters
    if (filters.categories?.length > 0) params.set('categories', filters.categories.join(','));
    if (filters.tags?.length > 0) params.set('tags', filters.tags.join(','));
    if (filters.status?.length > 0) params.set('status', filters.status.join(','));
    if (filters.featured) params.set('featured', 'true');
    if (filters.restricted) params.set('restricted', 'true');
    if (filters.minLiquidity) params.set('minLiquidity', filters.minLiquidity);
    if (filters.maxLiquidity) params.set('maxLiquidity', filters.maxLiquidity);
    if (filters.minVolume) params.set('minVolume', filters.minVolume);
    if (filters.maxVolume) params.set('maxVolume', filters.maxVolume);
    if (filters.minVolume24hr) params.set('minVolume24hr', filters.minVolume24hr);
    if (filters.maxVolume24hr) params.set('maxVolume24hr', filters.maxVolume24hr);
    if (filters.maxSpread) params.set('maxSpread', filters.maxSpread);
    if (filters.minProbability) params.set('minProbability', filters.minProbability);
    if (filters.maxProbability) params.set('maxProbability', filters.maxProbability);
    if (filters.creator) params.set('creator', filters.creator);
    if (filters.createdAfter) params.set('createdAfter', filters.createdAfter.toISOString());
    if (filters.createdBefore) params.set('createdBefore', filters.createdBefore.toISOString());
    if (filters.expiresBefore) params.set('expiresBefore', filters.expiresBefore.toISOString());

    return `/api/markets?${params.toString()}`;
  }, [filters]);

  // Fetch markets with server-side filtering
  const { data: allMarketsData, isLoading: marketsLoading } = useSWR(
    buildApiUrl,
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      errorRetryCount: 2,
      errorRetryInterval: 10000,
    }
  );

  // For performance testing, use mocked data instead of API data
  const testWithMockData = false; // Set to true to test with 500 mocked markets
  const mockedMarketsData = testWithMockData ? { markets: generateMockedMarkets(500) } : null;
  const marketsData = mockedMarketsData || allMarketsData;

  // Pre-indexed Fuse instance for better performance
  const [fuseIndex, setFuseIndex] = useState(null);

  // Pre-index markets when SWR data loads
  useEffect(() => {
    if (marketsData?.markets) {
      const fuse = new Fuse(marketsData.markets, {
        keys: [
          { name: 'question', weight: 0.7 },
          { name: 'tags', weight: 0.3 }
        ],
        threshold: 0.4, // Lower threshold = stricter matching
        includeScore: true,
        shouldSort: true,
      });
      setFuseIndex(fuse);
    }
  }, [marketsData]);

  // Simplified client-side filtering function (most filtering now done server-side)
  const filterMarkets = (markets) => {
    if (!markets) return [];

    let filtered = markets;

    // Apply search filter using pre-indexed Fuse.js or fallback to simple search
    if (debouncedSearch && debouncedSearch.trim()) {
      const searchTerm = debouncedSearch.trim().toLowerCase();

      if (fuseIndex) {
        // Use optimized Fuse.js search
        try {
          const searchResults = fuseIndex.search(searchTerm);
          filtered = searchResults.map(result => result.item);
        } catch (error) {
          console.warn('Fuse.js search failed, falling back to simple search:', error);
          // Fallback to simple string matching
          filtered = markets.filter(market =>
            market.question?.toLowerCase().includes(searchTerm) ||
            market.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            market.description?.toLowerCase().includes(searchTerm)
          );
        }
      } else {
        // Fallback to simple string matching for immediate response
        filtered = markets.filter(market =>
          market.question?.toLowerCase().includes(searchTerm) ||
          market.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          market.description?.toLowerCase().includes(searchTerm)
        );
      }
    }

    // Client-side date range filtering (for custom date ranges)
    if (filters.dateRange && (filters.dateRange[0] || filters.dateRange[1])) {
      filtered = filtered.filter(market => {
        const marketDate = new Date(market.endDate || market.createdAt);
        if (filters.dateRange[0] && marketDate < filters.dateRange[0]) return false;
        if (filters.dateRange[1] && marketDate > filters.dateRange[1]) return false;
        return true;
      });
    }

    return filtered;
  };

  // Removed old oddsStore usage - now handled by MarketsTable component

  // Generate mocked markets for performance testing (uncomment to test with 500 markets)
  const generateMockedMarkets = (count = 500) => {
    const categories = ['Politics', 'Sports', 'Crypto', 'Weather', 'Entertainment', 'Technology', 'Finance'];
    const sports = ['Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis', 'Golf'];

    return Array.from({ length: count }, (_, i) => ({
      id: `market_${i}`,
      question: `Will ${['Team A', 'Player X', 'Candidate Y', 'Company Z'][i % 4]} ${['win the championship', 'break the record', 'win the election', 'reach $1T market cap'][i % 4]} in ${2024 + (i % 5)}?`,
      description: `Detailed description for market ${i}`,
      tags: [categories[i % categories.length], sports[i % sports.length]],
      category: categories[i % categories.length],
      sport: sports[i % sports.length],
      yesOdds: Math.random() * 0.8 + 0.1, // 0.1 to 0.9
      noOdds: Math.random() * 0.8 + 0.1,
      volume: Math.floor(Math.random() * 100000) + 1000,
      volume24hr: Math.floor(Math.random() * 10000) + 100,
      liquidity: Math.floor(Math.random() * 50000) + 1000,
      volume1wk: Math.floor(Math.random() * 200000) + 5000,
      closed: Math.random() > 0.8,
      endDateIso: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      icon: `https://via.placeholder.com/32x32/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${i}`,
      url: `https://polymarket.com/market/${i}`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      tokenId: `token_${i}`,
      outcomePrices: [Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1]
    }));
  };

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply client-side filtering
  const filteredMarkets = useMemo(() => {
    if (!marketsData?.markets) return [];
    return filterMarkets(marketsData.markets);
  }, [marketsData, filters, debouncedSearch, filterMarkets]);

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
      <div className="flex">
        {/* Sidebar Filters - Desktop */}
        <div className={`hidden lg:block transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0' : 'w-80'}`}>
          {!sidebarCollapsed && (
          <FiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            resultCount={filteredMarkets.length}
            markets={marketsData?.markets || []}
          />
          )}
        </div>

        {/* Collapse/Expand Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex fixed top-24 left-4 z-50 items-center justify-center w-10 h-10 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/95 transition-all duration-200"
          title={sidebarCollapsed ? "Show Filters" : "Hide Filters"}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Main Content Area */}
        <div className={`flex-1 max-w-7xl mx-auto px-4 pb-20 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-12' : 'lg:ml-4'}`}>
        {/* No Results Message */}
        {filteredMarkets.length === 0 && !marketsLoading && (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No markets match your filters
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search terms or filter criteria to find more markets.
              </p>
              <button
                onClick={() => handleFiltersChange({
                  categories: [],
                  tags: [],
                  status: ['open'],
                  featured: false,
                  restricted: false,
                  probabilityMin: 0,
                  probabilityMax: 100,
                  volumeMin: 0,
                  volumeMax: 10000000,
                  volume24hrMin: 0,
                  volume24hrMax: 10000000,
                  liquidityMin: 0,
                  liquidityMax: 10000000,
                  spreadMax: 20,
                  createdAfter: null,
                  createdBefore: null,
                  expiresBefore: null,
                  creator: '',
                  dateRange: [null, null]
                })}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Markets Table */}
        {filteredMarkets.length > 0 && (
          <MarketsTable
          markets={filteredMarkets}
          searchQuery={debouncedSearch}
          sortOrder={getSortOrderParam(selectedSort)}
          onMarketClick={handleMarketClick}
          tableRef={tableRef}
          isLoading={!marketsData}
          onSearchChange={setSearchQuery}
          searchInputRef={searchInputRef}
          onToggleFilters={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}
        </div>
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
                      onFiltersChange={handleFiltersChange}
                      resultCount={filteredMarkets.length}
                      isModal={true}
                      isOpen={filtersModalOpen}
                      onClose={() => setFiltersModalOpen(false)}
                      markets={marketsData?.markets || []}
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