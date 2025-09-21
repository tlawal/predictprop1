'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useHotkeys } from 'react-hotkeys-hook';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Fuse from 'fuse.js';
import Image from 'next/image';
import MarketsTable from './components/MarketsTable';
import OrderModal from './components/OrderModal';
// Removed old oddsStore import - now using usePolymarketWebSocket hook

function MarketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'open'); // Default to open/active markets
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(searchParams.get('time_filter') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'volume24hr_desc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [rightPaneOpen, setRightPaneOpen] = useState(false);
  const [selectedMarketForInsights, setSelectedMarketForInsights] = useState(null);

  // New features state
  const [panes, setPanes] = useState([
    { id: 'markets', title: 'Markets', visible: true, order: 0 },
    { id: 'orderbook', title: 'Orderbook', visible: true, order: 1 },
    { id: 'insights', title: 'Insights', visible: true, order: 2 }
  ]);
  const [selectedMarketForOrderbook, setSelectedMarketForOrderbook] = useState(null);
  const [keyboardNavIndex, setKeyboardNavIndex] = useState(0);
  const tableRef = useRef(null);
  const searchInputRef = useRef(null);

  // Removed old oddsStore usage - now handled by MarketsTable component

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

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    if (selectedTimeFilter) params.set('time_filter', selectedTimeFilter);
    if (selectedSort) params.set('sort', selectedSort);

    const newUrl = params.toString() ? `?${params.toString()}` : '/markets';
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, selectedCategory, selectedStatus, selectedTimeFilter, selectedSort, router]);

  // Set predefined categories on mount
  useEffect(() => {
    // Use predefined categories that are commonly used in Polymarket
    const predefinedCategories = [
      'Politics',
      'Crypto',
      'Sports',
      'Economics',
      'Tech',
      'Entertainment',
      'Weather',
      'Science',
      'Health',
      'International'
    ];
    setCategories(predefinedCategories);
  }, []);

  const handleMarketClick = (market) => {
    setSelectedMarket(market);
    setModalOpen(true);
  };

  const handleMarketInsights = (market) => {
    setSelectedMarketForInsights(market);
    setRightPaneOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMarket(null);
  };

  const handleCloseRightPane = () => {
    setRightPaneOpen(false);
    setSelectedMarketForInsights(null);
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
          <div className="text-xs text-gray-400">
            Spread: {spread.percentage.toFixed(2)}%
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
      <section className="relative py-12 md:py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-teal-500/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <span className="text-2xl">🚀</span>
            <span className="text-sm font-semibold text-white">Live Markets</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Explore Live Prediction Markets
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Trade on real-world events with live odds updates and instant execution
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 text-lg bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* AI Recommended Section */}
        <AIRecommendedSection />

        {/* Trending Markets Section */}
        <TrendingMarkets />

        {/* Customizable Panes */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
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
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {panes
              .filter(pane => pane.visible)
              .sort((a, b) => a.order - b.order)
              .map((pane, index) => (
                <DraggablePane
                  key={pane.id}
                  pane={pane}
                  index={index}
                  movePane={movePane}
                >
                  {pane.id === 'markets' && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Markets</h3>
                        {/* Filters Button */}
                        <button
                          onClick={() => setSidebarOpen(true)}
                          className="lg:hidden flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                          </svg>
                          Filters
                        </button>
                      </div>

                      <MarketsTable
                        searchQuery={debouncedSearch}
                        category={selectedCategory}
                        status={selectedStatus}
                        timeFilter={selectedTimeFilter}
                        sortOrder={getSortOrderParam(selectedSort)}
                        onMarketClick={handleMarketClick}
                        onMarketInsights={handleMarketInsights}
                        onMarketSelectForOrderbook={setSelectedMarketForOrderbook}
                        tableRef={tableRef}
                      />
                    </div>
                  )}

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
                        <>
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
                                    <span className="text-white">{insightsData.insights?.volatility || 0}%</span>
                                  </div>
                                </div>
                              </div>

                              {/* Analysis */}
                              <div className="p-4 bg-slate-700/30 rounded-lg">
                                <h4 className="font-semibold text-white text-sm mb-3">Analysis</h4>
                                <div className="space-y-2 text-sm text-gray-300">
                                  <p><strong>Market Maturity:</strong> {insightsData.analysis?.marketMaturity}</p>
                                  <p><strong>Liquidity:</strong> {insightsData.analysis?.liquidityAssessment}</p>
                                  <p><strong>Recommendation:</strong> {insightsData.analysis?.recommendation}</p>
                                </div>
                              </div>

                              {/* Related Markets */}
                              {insightsData.relatedMarkets && insightsData.relatedMarkets.length > 0 && (
                                <div className="p-4 bg-slate-700/30 rounded-lg">
                                  <h4 className="font-semibold text-white text-sm mb-3">Related Markets</h4>
                                  <div className="space-y-3">
                                    {insightsData.relatedMarkets.slice(0, 3).map((market, index) => (
                                      <div
                                        key={market.id}
                                        className="p-3 bg-slate-800/50 rounded border border-slate-600 cursor-pointer hover:bg-slate-800/70 transition-colors"
                                        onClick={() => handleMarketClick(market)}
                                      >
                                        <p className="text-gray-300 text-xs leading-relaxed mb-2">{market.question}</p>
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-gray-400">{market.category}</span>
                                          <span className="text-white">{(market.yesOdds * 100).toFixed(0)}% Yes</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-gray-400 text-sm">Select a market to view insights</div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-sm">Click on a market to view insights</div>
                        </div>
                      )}
                    </div>
                  )}
                </DraggablePane>
              ))}
          </div>
        </div>

        {/* Sidebar (Mobile Filters) */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6">
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">Filters</h2>

            {/* Sort Dropdown */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Sort By</h3>
              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="volume24hr_desc">Volume (24h) - High to Low</option>
                <option value="volume24hr_asc">Volume (24h) - Low to High</option>
                <option value="newest">Newest First</option>
                <option value="liquidity_desc">Liquidity - High to Low</option>
                <option value="liquidity_asc">Liquidity - Low to High</option>
              </select>
            </div>

            {/* Time Filter */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Time Frame</h3>
              <div className="space-y-2">
                {[
                  { key: 'upcoming_1wk', label: 'Upcoming <1wk' },
                  { key: '1_4wk', label: '1-4 weeks' }
                ].map((timeFilter) => (
                  <button
                    key={timeFilter.key}
                    onClick={() => toggleTimeFilter(timeFilter.key)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedTimeFilter === timeFilter.key
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                        : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span>{timeFilter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedCategory === category
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                        : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="capitalize">{category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Status</h3>
              <div className="space-y-2">
                {['open', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedStatus === status
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                        : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="capitalize">{status}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedTimeFilter('');
                setSelectedSort('volume24hr_desc');
                setSearchQuery('');
              }}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-all"
            >
              Clear All Filters
            </button>
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