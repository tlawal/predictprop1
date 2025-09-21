'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useHotkeys } from 'react-hotkeys-hook';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, Transition } from '@headlessui/react';
import Fuse from 'fuse.js';
import Image from 'next/image';
import MarketsTable from './components/MarketsTable';
import OrderModal from './components/OrderModal';
import FiltersComponent from './components/FiltersComponent';
// Removed old oddsStore import - now using usePolymarketWebSocket hook


// WS Ticker Marquee Component
function WSTickerMarquee() {
  const [tickerItems, setTickerItems] = useState([
    "BTC up 2.5% in last hour",
    "Election odds shifting in Pennsylvania",
    "New market: Will it rain tomorrow in NYC?",
    "ETH volatility increasing",
    "Sports betting volume surging"
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate price changes
      setTickerItems(prev => {
        const newItems = [...prev];
        const randomIndex = Math.floor(Math.random() * newItems.length);
        const markets = ["BTC", "ETH", "AAPL", "Election", "Sports", "Weather"];
        const changes = ["up", "down"];
        const percents = ["0.5%", "1.2%", "2.1%", "3.7%", "5.2%"];

        newItems[randomIndex] = `${markets[Math.floor(Math.random() * markets.length)]} ${changes[Math.floor(Math.random() * changes.length)]} ${percents[Math.floor(Math.random() * percents.length)]}`;
        return newItems;
      });
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-8 overflow-hidden bg-black/20 rounded-lg mt-2">
      <div className="absolute inset-0 flex animate-marquee">
        {tickerItems.concat(tickerItems).map((item, index) => (
          <div key={index} className="flex items-center gap-2 px-4 whitespace-nowrap text-gray-300 text-sm">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
            <span>{item}</span>
            <span className="mx-4 text-gray-600">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'volume24hr_desc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rightPaneOpen, setRightPaneOpen] = useState(false);
  const [selectedMarketForInsights, setSelectedMarketForInsights] = useState(null);

  // Advanced filters state
  const [filters, setFilters] = useState(() => {
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

  // New features state
  const [panes, setPanes] = useState([
    { id: 'markets', title: 'Markets', visible: true, order: 0 },
    { id: 'orderbook', title: 'Orderbook', visible: false, order: 1 },
    { id: 'insights', title: 'Insights', visible: false, order: 2 }
  ]);
  const [selectedMarketForOrderbook, setSelectedMarketForOrderbook] = useState(null);
  const [keyboardNavIndex, setKeyboardNavIndex] = useState(0);
  const tableRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter change handler
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);

    // Update URL with filters
    const params = new URLSearchParams(searchParams);

    if (newFilters.categories.length > 0 || newFilters.status.length > 0 || newFilters.time.length > 0) {
      params.set('filters', encodeURIComponent(JSON.stringify(newFilters)));
    } else {
      params.delete('filters');
    }

    // Preserve other params
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSort !== 'volume24hr_desc') params.set('sort', selectedSort);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Client-side filtering function
  const filterMarkets = (markets) => {
    if (!markets) return [];

    return markets.filter(market => {
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

  // Apply client-side filtering
  const filteredMarkets = useMemo(() => {
    if (!allMarketsData?.markets) return [];
    return filterMarkets(allMarketsData.markets);
  }, [allMarketsData, filters]);

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

  // Fetch market insights for right pane
  const { data: insightsData, isLoading: insightsLoading } = useSWR(
    selectedMarketForInsights ? `/api/insights?tokenId=${selectedMarketForInsights.id}` : null,
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 60000,
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

  // Fetch orderbook data for selected market
  const { data: orderbookData, isLoading: orderbookLoading } = useSWR(
    selectedMarketForOrderbook ? `/api/orderbook?tokenId=${selectedMarketForOrderbook.id}` : null,
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 30000, // 30 seconds (real-time data)
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10 seconds
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


  const handleMarketClick = (market) => {
    setSelectedMarket(market);
    setModalOpen(true);
  };

  const handleMarketInsights = (market) => {
    setSelectedMarketForInsights(market);
    // Make insights pane visible (markets remains visible)
    setPanes(prevPanes =>
      prevPanes.map(pane => ({
        ...pane,
        visible: pane.id === 'insights' ? true : pane.visible
      }))
    );
  };

  const handleMarketOrderbook = (market) => {
    setSelectedMarketForOrderbook(market);
    // Make orderbook pane visible (markets remains visible)
    setPanes(prevPanes =>
      prevPanes.map(pane => ({
        ...pane,
        visible: pane.id === 'orderbook' ? true : pane.visible
      }))
    );
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMarket(null);
  };

  const handleCloseRightPane = () => {
    setRightPaneOpen(false);
    setSelectedMarketForInsights(null);
    // Hide insights pane (markets remains visible)
    setPanes(prevPanes =>
      prevPanes.map(pane => ({
        ...pane,
        visible: pane.id === 'insights' ? false : pane.visible
      }))
    );
  };

  // Keyboard navigation
  useHotkeys('j', () => {
    setKeyboardNavIndex(prev => Math.min(prev + 1, 20)); // Navigate down
  }, [keyboardNavIndex]);

  useHotkeys('k', () => {
    setKeyboardNavIndex(prev => Math.max(prev - 1, 0)); // Navigate up
  }, [keyboardNavIndex]);

  useHotkeys('enter', () => {
    // Open modal for currently selected market
    // This would need access to the current market data
    if (selectedMarketForInsights) {
      handleMarketClick(selectedMarketForInsights);
    }
  }, [selectedMarketForInsights]);

  useHotkeys('/', (e) => {
    e.preventDefault();
    searchInputRef.current?.focus();
  }, []);

  // Drag and drop handlers
  const movePane = useCallback((dragIndex, hoverIndex) => {
    setPanes(prevPanes => {
      const newPanes = [...prevPanes];
      const draggedPane = newPanes[dragIndex];
      newPanes.splice(dragIndex, 1);
      newPanes.splice(hoverIndex, 0, draggedPane);

      // Update order
      return newPanes.map((pane, index) => ({ ...pane, order: index }));
    });
  }, []);

  const togglePane = useCallback((paneId) => {
    setPanes(prevPanes =>
      prevPanes.map(pane =>
        pane.id === paneId ? { ...pane, visible: !pane.visible } : pane
      )
    );
  }, []);

  const toggleCategory = (category) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const toggleStatus = (status) => {
    setSelectedStatus(selectedStatus === status ? '' : status);
  };

  const toggleTimeFilter = (timeFilter) => {
    setSelectedTimeFilter(selectedTimeFilter === timeFilter ? '' : timeFilter);
  };

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

  // Trending Markets Component
  const TrendingMarkets = () => {
    const trendingMarkets = trendingData?.markets || [];

    if (!trendingMarkets.length) return null;

    return (
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-white">Trending Markets</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-full">
            <span className="text-orange-400 text-sm font-medium">🔥 Hot</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            {trendingMarkets.map((market) => {
              const volume24hr = market.volume24hr || market.volume || 0;
              const isHighVolume = volume24hr > 10000;

              return (
                <div
                  key={market.id}
                  className={`flex-shrink-0 w-80 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isHighVolume
                      ? 'bg-gradient-to-br from-red-900/30 via-orange-900/30 to-yellow-900/30 border-red-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                  onClick={() => handleMarketClick(market)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {market.icon ? (
                        <Image
                          src={market.icon}
                          alt={market.question}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-lg">📊</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2">
                        {market.question}
                      </h3>
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

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Vol: ${Math.round(volume24hr / 1000)}k</span>
                    <span>{market.category || 'Other'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
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

  // Orderbook Pane Component
  const OrderbookPane = ({ market }) => {
    if (orderbookLoading || !orderbookData) {
      return (
        <div className="p-6">
          <h3 className="font-semibold text-white text-lg mb-4">Orderbook</h3>
          <div className="text-gray-400">Loading orderbook...</div>
        </div>
      );
    }

    const { bids, asks, spread, depth, summary } = orderbookData;

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-lg">Orderbook</h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">
              Spread: {spread.percentage.toFixed(2)}%
            </div>
            <button
              onClick={() => {
                setSelectedMarketForOrderbook(null);
                setPanes(prevPanes =>
                  prevPanes.map(pane => ({
                    ...pane,
                    visible: pane.id === 'orderbook' ? false : pane.visible
                  }))
                );
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
          <div className="text-sm text-gray-300 mb-2">{market.question}</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Best Bid:</span>
              <span className="text-green-400 ml-1">{summary.bestBid.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-gray-400">Best Ask:</span>
              <span className="text-red-400 ml-1">{summary.bestAsk.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-gray-400">Mid:</span>
              <span className="text-white ml-1">{summary.midPrice.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Bids */}
          <div>
            <h4 className="text-green-400 text-sm font-medium mb-2">Bids (Buy)</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {bids.slice(0, 8).map((bid, index) => (
                <div key={index} className="flex justify-between text-xs py-1 px-2 bg-green-900/20 rounded">
                  <span className="text-green-300">{bid.price.toFixed(4)}</span>
                  <span className="text-white">{bid.size}</span>
                  <span className="text-gray-400">${bid.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Total Depth: ${depth.bids.toFixed(0)}
            </div>
          </div>

          {/* Asks */}
          <div>
            <h4 className="text-red-400 text-sm font-medium mb-2">Asks (Sell)</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {asks.slice(0, 8).map((ask, index) => (
                <div key={index} className="flex justify-between text-xs py-1 px-2 bg-red-900/20 rounded">
                  <span className="text-red-300">{ask.price.toFixed(4)}</span>
                  <span className="text-white">{ask.size}</span>
                  <span className="text-gray-400">${ask.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Total Depth: ${depth.asks.toFixed(0)}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Bid Orders:</span>
              <span className="text-white ml-1">{summary.totalBidOrders}</span>
            </div>
            <div>
              <span className="text-gray-400">Ask Orders:</span>
              <span className="text-white ml-1">{summary.totalAskOrders}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Draggable Pane Component
  const DraggablePane = ({ pane, children, index, movePane }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'pane',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'pane',
      hover: (item) => {
        if (item.index !== index) {
          movePane(item.index, index);
          item.index = index;
        }
      },
    });

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ order: pane.order }}
      >
        {children}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 md:pt-0">
      {/* Hero Section */}
      <section className="relative py-6 md:py-10 px-4 bg-gradient-to-r from-gray-800 to-gray-900 animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-teal-500/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">

          <h1 className="text-xl md:text-3xl font-black text-white mb-8">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Explore Live Prediction Markets
            </span>
          </h1>

          {/* WS Ticker Marquee */}
          <div className="w-full overflow-hidden">
            <WSTickerMarquee />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* AI Recommended Section */}
        <AIRecommendedSection />

        {/* Trending Markets Section */}
        <TrendingMarkets />

        {/* Panes Layout */}
        <div className="flex-1">
          {/* Pane Controls */}
          <div className="flex flex-wrap gap-2 mb-4 lg:mb-0 lg:flex-col lg:w-48">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>🎛️</span>
              <span>Panes:</span>
            </div>
            {panes.map((pane) => (
              <button
                key={pane.id}
                onClick={() => togglePane(pane.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  pane.visible
                    ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                    : 'bg-slate-700/50 border border-slate-600 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {pane.title}
              </button>
            ))}
          </div>

          {/* Panes Container */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Markets pane - always takes primary space when visible */}
            {panes.find(p => p.id === 'markets' && p.visible) && (
              <div className={`flex-1 ${panes.filter(p => p.visible && p.id !== 'markets').length > 0 ? 'lg:flex-[2]' : ''} min-h-0`}>
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white">Markets</h3>
                  </div>

                  <MarketsTable
                    markets={filteredMarkets}
                    searchQuery={debouncedSearch}
                    sortOrder={getSortOrderParam(selectedSort)}
                    onMarketClick={handleMarketClick}
                    onMarketInsights={handleMarketInsights}
                    onMarketSelectForOrderbook={handleMarketOrderbook}
                    tableRef={tableRef}
                    isLoading={marketsLoading}
                    onSearchChange={setSearchQuery}
                    onFiltersToggle={() => setFiltersModalOpen(true)}
                    filters={filters}
                    searchInputRef={searchInputRef}
                  />
                </div>
              </div>
            )}

            {/* Secondary panes - stacked in right column when visible */}
            {panes.filter(p => p.visible && p.id !== 'markets').length > 0 && (
              <div className="lg:flex-[1] lg:min-w-0 space-y-4 lg:space-y-6">
                {panes
                  .filter(p => p.visible && p.id !== 'markets')
                  .sort((a, b) => a.order - b.order)
                  .map((pane) => (
                    <div key={pane.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
                      {pane.id === 'orderbook' && (
                        <OrderbookPane market={selectedMarketForOrderbook} />
                      )}

                      {pane.id === 'insights' && (
                        <div className="p-6 h-full overflow-y-auto">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Market Insights</h3>
                            {selectedMarketForInsights && (
                              <button
                                onClick={handleCloseRightPane}
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {selectedMarketForInsights ? (
                            <div>
                              {/* Market Header */}
                              <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
                                <h4 className="font-semibold text-white text-sm mb-2">Selected Market</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">{selectedMarketForInsights.question}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-400">Current: {(selectedMarketForInsights.yesOdds * 100).toFixed(1)}% Yes</span>
                                </div>
                              </div>

                              {/* Insights Content */}
                              {insightsLoading ? (
                                <div className="text-center py-8">
                                  <div className="text-gray-400">Loading insights...</div>
                                </div>
                              ) : insightsData ? (
                                <div className="space-y-6">
                                  {/* Market Stats */}
                                  <div className="p-4 bg-slate-700/30 rounded-lg">
                                    <h4 className="font-semibold text-white text-sm mb-3">Market Statistics</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Avg Probability Shift:</span>
                                        <span className="text-white">{insightsData.insights?.averageProbShift || 0}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Trend:</span>
                                        <span className={`font-medium ${
                                          insightsData.insights?.trend === 'increasing' ? 'text-green-400' :
                                          insightsData.insights?.trend === 'decreasing' ? 'text-red-400' :
                                          'text-gray-400'
                                        }`}>
                                          {insightsData.insights?.trend || 'stable'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Volatility:</span>
                                        <span className="text-white">{insightsData.insights?.volatility || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Liquidity Score:</span>
                                        <span className="text-white">{insightsData.insights?.liquidityScore || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* AI Insights */}
                                  <div className="p-4 bg-slate-700/30 rounded-lg">
                                    <h4 className="font-semibold text-white text-sm mb-3">AI Analysis</h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">{insightsData.summary || 'No AI insights available'}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="text-gray-400 text-sm">Unable to load insights</div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-gray-400 text-sm">Click on a market to view insights</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

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
    </div>
    </DndProvider>
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