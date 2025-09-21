'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { Disclosure } from '@headlessui/react';
import { Tooltip } from 'react-tooltip';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Dynamic import for Chart.js components to avoid SSR issues
const ProbabilitySparkline = dynamic(() => import('./ProbabilitySparkline'), {
  ssr: false,
  loading: () => <div className="w-20 h-10 bg-slate-700 rounded animate-pulse"></div>
});
import Countdown from 'react-countdown';
import useOddsStore from '../../../lib/stores/oddsStore';
import polymarketWebSocket from '../../../lib/websocket';

// Stable empty array reference for Zustand selectors
const EMPTY_ARRAY = [];

// Custom hook to get price history without selector issues
const usePriceHistory = (tokenId) => {
  const [priceHistory, setPriceHistory] = useState(EMPTY_ARRAY);

  useEffect(() => {
    // Get initial value
    setPriceHistory(useOddsStore.getState().priceHistory.get(tokenId) || EMPTY_ARRAY);

    // Subscribe to changes
    const unsubscribe = useOddsStore.subscribe((state) => {
      const newHistory = state.priceHistory.get(tokenId) || EMPTY_ARRAY;
      setPriceHistory(newHistory);
    });

    return unsubscribe;
  }, [tokenId]);

  return priceHistory;
};


// High Edge Detection Component
const HighEdgeChip = ({ market }) => {
  const priceHistory = usePriceHistory(market.id);
  const volume1wk = market.volume1wk || market.volume || 0;

  // Calculate price change from recent history
  let wsPriceChange = 0;
  if (priceHistory.length > 1) {
    const lastPrice = priceHistory[priceHistory.length - 2].yesPrice;
    const currentPrice = priceHistory[priceHistory.length - 1].yesPrice;
    wsPriceChange = (currentPrice - lastPrice) / lastPrice;
  }

  const hasHighChange = Math.abs(wsPriceChange) > 0.05; // 5% change
  const hasLowLiquidity = volume1wk < 5000; // Less than $5k weekly volume

  if (!hasHighChange || !hasLowLiquidity) return null;

  return (
    <span
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300"
      title="Possible mispricing—low liquidity opportunity"
    >
      High Edge
    </span>
  );
};

// Countdown Renderer for end dates
const CountdownRenderer = ({ days, hours, minutes, seconds, completed }) => {
  if (completed) {
    return <span className="text-red-400 font-medium">Ended</span>;
  }

  if (days > 0) {
    return <span className="text-gray-300">{days}d {hours}h</span>;
  } else if (hours > 0) {
    return <span className="text-gray-300">{hours}h {minutes}m</span>;
  } else {
    return <span className="text-yellow-400 font-medium">{minutes}m {seconds}s</span>;
  }
};

export default function MarketsTable({ markets: propMarkets, searchQuery, sortOrder, onMarketClick, onMarketInsights, onMarketSelectForOrderbook, tableRef, isLoading: propIsLoading, onSearchChange, onFiltersToggle, filters, searchInputRef }) {

  const [wsPriceChanges, setWsPriceChanges] = useState(new Map()); // Track WS price changes

  // Get price history from Zustand store
  const getPriceHistory = useOddsStore(state => state.getPriceHistory);

  // Use prop markets or fallback to empty array
  const markets = propMarkets || [];
  const isLoading = propIsLoading;

  // Sorting state from Zustand
  const sortConfig = useOddsStore(state => state.sortConfig);
  const toggleSort = useOddsStore(state => state.toggleSort);


  // Sort markets based on current sort config
  const sortedMarkets = useMemo(() => {
    if (!markets.length || !sortConfig.length) return markets;

    return [...markets].sort((a, b) => {
      for (const sort of sortConfig) {
        const { key, direction } = sort;
        let aValue, bValue;

        switch (key) {
          case 'endDateIso':
            aValue = new Date(a.endDateIso || '2025-01-01').getTime();
            bValue = new Date(b.endDateIso || '2025-01-01').getTime();
            break;
          case 'yesOdds':
            aValue = a.outcomePrices?.[0] || a.yesOdds || 0;
            bValue = b.outcomePrices?.[0] || b.yesOdds || 0;
            break;
          case 'noOdds':
            aValue = a.outcomePrices?.[1] || a.noOdds || 0;
            bValue = b.outcomePrices?.[1] || b.noOdds || 0;
            break;
          case 'volume24hr':
            aValue = a.volume24hr || 0;
            bValue = b.volume24hr || 0;
            break;
          case 'volume1wk':
            aValue = a.volume1wk || 0;
            bValue = b.volume1wk || 0;
            break;
          default:
            continue;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [markets, sortConfig]);

  // Handle column header click
  const handleSortClick = (key, event) => {
    const multiColumn = event.shiftKey; // Shift+click for multi-column sorting
    toggleSort(key, multiColumn);
  };

  // Get sort icon and direction for a column
  const getSortIndicator = (key) => {
    const sort = sortConfig.find(s => s.key === key);
    if (!sort) return null;

    return (
      <span className="inline-flex items-center ml-2">
        {sort.direction === 'asc' ? (
          <ChevronUpIcon className="w-4 h-4 text-teal-400" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-teal-400" />
        )}
      </span>
    );
  };

  // Listen for WebSocket price updates
  useEffect(() => {
    const handlePriceUpdate = (event) => {
      const { tokenId, yesPrice } = event.detail;

      // Calculate price change for High Edge detection
      const currentHistory = getPriceHistory(tokenId);
      if (currentHistory.length > 1) {
        const lastPrice = currentHistory[currentHistory.length - 2].yesPrice;
        const change = (yesPrice - lastPrice) / lastPrice;

        setWsPriceChanges(prev => new Map(prev).set(tokenId, change));
      }
    };

    window.addEventListener('polymarket:price_update', handlePriceUpdate);

    return () => {
      window.removeEventListener('polymarket:price_update', handlePriceUpdate);
    };
  }, [getPriceHistory]);

  // SWR polling for midpoint data of visible markets (every 5 minutes)
  const visibleMarkets = markets.slice(0, 20); // Only poll first 20 visible markets
  const midpointUrls = visibleMarkets.map(market =>
    `/api/midpoint/${market.id}?timestamp=${Date.now()}`
  );

  // Poll midpoint data for all visible markets
  useSWR(
    visibleMarkets.length > 0 ? midpointUrls : null,
    async (urls) => {
      if (!urls || urls.length === 0) return null;

      const promises = urls.map(url => fetch(url).then(res => res.json()).catch(() => null));
      const results = await Promise.all(promises);

      // Update Zustand store with midpoint data
      const updates = {};
      results.forEach((result, index) => {
        if (result && visibleMarkets[index]) {
          const market = visibleMarkets[index];
          updates[market.id] = {
            yesPrice: result.midpoint || market.yesOdds,
            noPrice: result.midpoint ? (1 - result.midpoint) : market.noOdds
          };
        }
      });

      if (Object.keys(updates).length > 0) {
        const store = useOddsStore.getState();
        store.updateMultipleMarketOdds(updates);
      }

      return results;
    },
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Load more function for pagination (simple implementation)
  const loadMore = useCallback(() => {
    // For now, just show all markets - can implement pagination later if needed
  }, []);

  // Use prop markets and loading state

  // WebSocket and polling state
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Polling fallback
  const startPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const visibleTokenIds = markets.slice(0, 20).map(market => market.tokenId).filter(Boolean);
        if (visibleTokenIds.length > 0) {
          // Import the service dynamically to avoid circular imports
          const { default: polymarketService } = await import('../../../lib/services/polymarket');
          const midpoints = await polymarketService.fetchMultipleMidpoints(visibleTokenIds);

          setAllMarkets(prevMarkets =>
            prevMarkets.map(market => {
              const midpoint = midpoints[market.tokenId];
              if (midpoint) {
                return {
                  ...market,
                  yesOdds: midpoint.yesPrice,
                  noOdds: midpoint.noPrice,
                  lastUpdate: Date.now()
                };
              }
              return market;
            })
          );
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [markets]);

  // WebSocket connection and price updates
  useEffect(() => {
    // Connect to WebSocket on mount
    polymarketWebSocket.connect().then(() => {
      setConnectionStatus('connected');
    }).catch(() => {
      setConnectionStatus('polling');
      startPolling();
    });

    // Listen for price updates
    const handlePriceUpdate = (event) => {
      const { tokenId, yesPrice, noPrice } = event.detail;

      setAllMarkets(prevMarkets =>
        prevMarkets.map(market => {
          if (market.tokenId === tokenId) {
            return {
              ...market,
              yesOdds: yesPrice,
              noOdds: noOdds,
              lastUpdate: Date.now()
            };
          }
          return market;
        })
      );
    };

    window.addEventListener('polymarket:price_update', handlePriceUpdate);

    return () => {
      window.removeEventListener('polymarket:price_update', handlePriceUpdate);
      polymarketWebSocket.disconnect();
    };
  }, [startPolling]);

  // Subscribe to visible markets
  useEffect(() => {
    if (markets.length > 0) {
      const tokenIds = markets.map(market => market.tokenId).filter(Boolean);
      if (tokenIds.length > 0) {
        polymarketWebSocket.subscribeToPriceUpdates(tokenIds);
      }
    }
  }, [markets]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatVolume = (volume) => {
    if (!volume) return '$0';
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(0)}k`;
    }
    return `$${volume.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-gray-400 text-lg">Loading markets...</div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-gray-400 text-lg">No markets found</div>
        <div className="text-gray-500 text-sm mt-2">Try adjusting your filters</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar - Horizontal Layout */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full px-4 py-3 text-base bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters Button */}
        {onFiltersToggle && (
          <button
            onClick={onFiltersToggle}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-xl text-white hover:bg-slate-700/50 transition-colors whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {filters && (filters.categories?.length > 0 || filters.status?.length > 0 || filters.time?.length > 0) && (
              <span className="bg-teal-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                {(filters.categories?.length || 0) + (filters.status?.length || 0) + (filters.time?.length || 0)}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Markets Count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Real-time market data from Polymarket
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'polling' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span>
                  {connectionStatus === 'connected' ? 'Live' :
                   connectionStatus === 'polling' ? 'Polling' :
                   'Disconnected'}
                </span>
              </div>
              <div>{markets.length} markets loaded</div>
            </div>
          </div>

      {/* Markets Table - Desktop */}
      <div className="hidden lg:block bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
        <table ref={tableRef} className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-12"></th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white hover:bg-slate-600/30 transition-colors select-none"
                  onClick={(e) => handleSortClick('question', e)}
                  data-tooltip-id="question-tooltip"
                  data-tooltip-content="Sort by market question (alphabetical)"
                >
                  <div className="flex items-center">
                    Question
                    {getSortIndicator('question')}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Chart</th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white hover:bg-slate-600/30 transition-colors select-none"
                  onClick={(e) => handleSortClick('yesOdds', e)}
                  data-tooltip-id="yes-odds-tooltip"
                  data-tooltip-content="Sort by Yes odds (probability)"
                >
                  <div className="flex items-center justify-end">
                    Yes Odds
                    {getSortIndicator('yesOdds')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white hover:bg-slate-600/30 transition-colors select-none"
                  onClick={(e) => handleSortClick('noOdds', e)}
                  data-tooltip-id="no-odds-tooltip"
                  data-tooltip-content="Sort by No odds (probability)"
                >
                  <div className="flex items-center justify-end">
                    No Odds
                    {getSortIndicator('noOdds')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white hover:bg-slate-600/30 transition-colors select-none"
                  onClick={(e) => handleSortClick('volume24hr', e)}
                  data-tooltip-id="volume24h-tooltip"
                  data-tooltip-content="Sort by 24-hour trading volume"
                >
                  <div className="flex items-center justify-end">
                    Vol 24h
                    {getSortIndicator('volume24hr')}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white hover:bg-slate-600/30 transition-colors select-none"
                  onClick={(e) => handleSortClick('volume1wk', e)}
                  data-tooltip-id="volume1w-tooltip"
                  data-tooltip-content="Sort by 1-week trading volume"
                >
                  <div className="flex items-center justify-end">
                    Vol 1w
                    {getSortIndicator('volume1wk')}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Edge</th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white hover:bg-slate-600/30 transition-colors select-none"
                  onClick={(e) => handleSortClick('endDateIso', e)}
                  data-tooltip-id="expires-tooltip"
                  data-tooltip-content="Sort by market expiration date"
                >
                  <div className="flex items-center">
                    Expires
                    {getSortIndicator('endDateIso')}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedMarkets.map((market, index) => (
                <MarketRow
                  key={market.id || index}
                  market={market}
                  onMarketClick={onMarketClick}
                  onMarketInsights={onMarketInsights}
                  onMarketSelectForOrderbook={onMarketSelectForOrderbook}
                  formatDate={formatDate}
                  formatVolume={formatVolume}
                  sortConfig={sortConfig}
                />
              ))}
            </tbody>
          </table>
      </div>

      {/* Markets Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {sortedMarkets.map((market, index) => (
          <MarketCard
            key={market.id || index}
            market={market}
            onMarketClick={onMarketClick}
            onMarketInsights={onMarketInsights}
            onMarketSelectForOrderbook={onMarketSelectForOrderbook}
            formatDate={formatDate}
            formatVolume={formatVolume}
            wsPriceChanges={wsPriceChanges}
          />
        ))}
      </div>

      {/* Tooltips */}
      <Tooltip id="question-tooltip" place="top" />
      <Tooltip id="yes-odds-tooltip" place="top" />
      <Tooltip id="no-odds-tooltip" place="top" />
      <Tooltip id="volume24h-tooltip" place="top" />
      <Tooltip id="volume1w-tooltip" place="top" />
      <Tooltip id="expires-tooltip" place="top" />

      {/* Dynamic tooltips for each market */}
      {sortedMarkets.map((market) => (
        <React.Fragment key={market.id}>
          <Tooltip id={`orderbook-${market.id}-tooltip`} place="top" />
          <Tooltip id={`ai-hint-${market.id}-tooltip`} place="top" />
        </React.Fragment>
      ))}

    </div>
  );
}

// Enhanced market row component for desktop
function MarketRow({ market, onMarketClick, onMarketInsights, onMarketSelectForOrderbook, formatDate, formatVolume, sortConfig }) {
  // Get orderbook data for tooltip
  const { data: orderbookData } = useSWR(
    `/api/orderbook?tokenId=${market.id}`,
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: false,
    }
  );

  // Calculate AI hint - potential mispricing detection
  const priceHistory = usePriceHistory(market.id || market.tokenId);
  const hasHighEdge = priceHistory.length > 1 &&
    market.volume1wk < 5000 &&
    Math.abs(priceHistory[priceHistory.length - 1].yesPrice - priceHistory[priceHistory.length - 2].yesPrice) > 0.05;

  // Create orderbook tooltip content
  const getOrderbookTooltip = () => {
    if (!orderbookData) return "Loading orderbook data...";

    const { summary } = orderbookData;
    return `Bid: $${summary.bestBid?.toFixed(4) || 'N/A'} Ask: $${summary.bestAsk?.toFixed(4) || 'N/A'} Spread: ${orderbookData.spread?.percentage?.toFixed(2) || 'N/A'}%`;
  };

  return (
    <tr
      className="hover:bg-slate-700/30 transition-all duration-300 cursor-pointer"
      onClick={() => onMarketClick(market)}
    >
      {/* Icon Column */}
      <td className="px-6 py-4">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center">
          {market.icon ? (
            <Image
              src={market.icon}
              alt={market.category || 'Market'}
              width={32}
              height={32}
              className="object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <div className={`w-6 h-6 ${market.icon ? 'hidden' : 'block'}`}>
            <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </td>

      {/* Question Column */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="font-semibold text-white text-sm leading-tight">
            {market.question}
          </div>
          <div className="text-xs text-gray-400">
            {market.category}
          </div>
        </div>
      </td>

      {/* Chart Column */}
      <td className="px-6 py-4 text-center">
        <ProbabilitySparkline tokenId={market.id} yesPrice={market.yesOdds} />
      </td>

      {/* Yes Odds Column */}
      <td className="px-6 py-4 text-right">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ease-in-out ${
            market.yesOdds > 0.5 ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
          } ${market.lastUpdate ? 'animate-pulse' : ''}`}
          data-tooltip-id={`orderbook-${market.id}-tooltip`}
          data-tooltip-content={getOrderbookTooltip()}
        >
          {(market.yesOdds * 100).toFixed(0)}%
        </span>
      </td>

      {/* No Odds Column */}
      <td className="px-6 py-4 text-right">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ease-in-out ${
            market.noOdds > 0.5 ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'
          } ${market.lastUpdate ? 'animate-pulse' : ''}`}
          data-tooltip-id={`orderbook-${market.id}-tooltip`}
          data-tooltip-content={getOrderbookTooltip()}
        >
          {(market.noOdds * 100).toFixed(0)}%
        </span>
      </td>

      {/* Volume 24h Column */}
      <td className="px-6 py-4 text-right">
        <span className="text-sm text-gray-300">
          {formatVolume(market.volume24hr || 0)}
        </span>
      </td>

      {/* Volume 1w Column */}
      <td className="px-6 py-4 text-right">
        <span className="text-sm text-gray-300">
          {formatVolume(market.volume1wk || 0)}
        </span>
      </td>

      {/* AI Hint Column */}
      <td className="px-6 py-4 text-center">
        {hasHighEdge && (
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900 text-yellow-200 border border-yellow-600"
            data-tooltip-id={`ai-hint-${market.id}-tooltip`}
            data-tooltip-content="Potential mispricing detected: High price movement with low volume. Consider checking for edge."
          >
            🤖 Edge
          </span>
        )}
      </td>

      {/* Expires Column */}
      <td className="px-6 py-4 text-left">
        <span className="text-sm text-gray-300">
          {market.endDateIso ? `Closes ${market.endDateIso}` : formatDate(market.endDate)}
        </span>
      </td>

      {/* Actions Column */}
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Watch market functionality
              fetch('/api/watch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  marketId: market.id,
                  question: market.question,
                  currentYesProb: market.yesOdds * 100
                })
              }).then(() => {
                // Simple notification
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
                toast.textContent = 'Added to watchlist!';
                document.body.appendChild(toast);
                setTimeout(() => document.body.removeChild(toast), 2000);
              });
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            title="Watch Market"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarketInsights(market);
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            title="View Insights"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          <a
            href={market.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="View on Polymarket"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </td>
    </tr>
  );
}

// Mobile card component
function MarketCard({ market, onMarketClick, onMarketInsights, onMarketSelectForOrderbook, formatDate, formatVolume, wsPriceChanges }) {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg overflow-hidden">
          {/* Action Buttons - Outside Disclosure */}
          <div className="flex items-center justify-end gap-2 p-4 pb-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Watch market functionality
                fetch('/api/watch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    marketId: market.id,
                    question: market.question,
                    currentYesProb: market.yesOdds * 100
                  })
                }).then(() => {
                  // Simple notification
                  const toast = document.createElement('div');
                  toast.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
                  toast.textContent = 'Added to watchlist!';
                  document.body.appendChild(toast);
                  setTimeout(() => document.body.removeChild(toast), 2000);
                });
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Watch Market"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarketInsights(market);
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title="View Insights"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarketClick(market);
              }}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded transition-colors"
            >
              Trade
            </button>

            <a
              href={market.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Main Card - Click to Expand */}
          <Disclosure.Button
            className="w-full p-4 pt-2 text-left hover:bg-slate-800/70 transition-all duration-200"
            onClick={(e) => {
              // Only expand, don't trigger market click
              e.stopPropagation();
            }}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                {market.icon ? (
                  <Image
                    src={market.icon}
                    alt={market.category || 'Market'}
                    width={48}
                    height={48}
                    className="object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 ${market.icon ? 'hidden' : 'block'}`}>
                  <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white text-sm leading-tight flex-1 mr-2">
                    {market.question}
                  </h3>
                  {/* Expand Icon */}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-2 mb-3">
                  <HighEdgeChip market={market} />
                  <span className="text-xs text-gray-400">{market.category}</span>
                </div>

                {/* Odds and Chart Row */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">YES</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-all duration-300 ease-in-out ${
                      market.yesOdds > 0.5 ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                    } ${market.lastUpdate ? 'animate-pulse' : ''}`}>
                      {(market.yesOdds * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">NO</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-all duration-300 ease-in-out ${
                      market.noOdds > 0.5 ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'
                    } ${market.lastUpdate ? 'animate-pulse' : ''}`}>
                      {(market.noOdds * 100).toFixed(0)}%
                    </span>
                  </div>
                  {/* Mini Chart */}
                  <div className="flex-1 max-w-[80px]">
                    <ProbabilitySparkline tokenId={market.id} yesPrice={market.yesOdds} />
                  </div>
                </div>

                {/* Volume Row */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>24h: {formatVolume(market.volume24hr || 0)}</span>
                  <span>1w: {formatVolume(market.volume1wk || 0)}</span>
                </div>
              </div>
            </div>
          </Disclosure.Button>

          {/* Expandable Details */}
          <Disclosure.Panel className="border-t border-slate-700 bg-slate-800/30">
            <div className="p-4 space-y-4">
              {/* Countdown Timer */}
              {market.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Time Remaining:</span>
                  <Countdown
                    date={new Date(market.endDate)}
                    renderer={CountdownRenderer}
                  />
                </div>
              )}

              {/* Detailed Volumes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {formatVolume(market.volume24hr || 0)}
                  </div>
                  <div className="text-xs text-gray-400">24h Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {formatVolume(market.volume1wk || 0)}
                  </div>
                  <div className="text-xs text-gray-400">1w Volume</div>
                </div>
              </div>

              {/* Market Details */}
              <div className="text-sm text-gray-300">
                <div className="flex justify-between mb-2">
                  <span>Market ID:</span>
                  <span className="font-mono text-xs">{market.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Created:</span>
                  <span>{market.createdAt ? new Date(market.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closes:</span>
                  <span>{market.endDateIso || formatDate(market.endDate)}</span>
                </div>
              </div>

              {/* Full Probability Chart */}
              <div className="pt-2">
                <div className="text-sm text-gray-400 mb-2">Probability Trend (Last 10 Updates)</div>
                <ProbabilitySparkline tokenId={market.id} yesPrice={market.yesOdds} />
              </div>
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}