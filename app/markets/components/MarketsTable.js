'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import polymarketWebSocket from '../../../lib/websocket';

export default function MarketsTable({ searchQuery, category, status, onMarketClick }) {
  const [offset, setOffset] = useState(0);
  const [allMarkets, setAllMarkets] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const limit = 20; // 20 markets per page as requested

  // Build API URL with parameters
  const buildUrl = (offset) => {
    const params = new URLSearchParams();
    params.set('offset', offset.toString());
    params.set('limit', limit.toString());

    if (searchQuery) params.set('q', searchQuery);
    if (category) params.set('category', category);

    // Convert status to active/closed params for Gamma API
    if (status === 'open') {
      params.set('active', 'true');
      params.set('closed', 'false');
    } else if (status === 'closed') {
      params.set('active', 'false');
      params.set('closed', 'true');
    } else {
      // Default to active markets
      params.set('active', 'true');
      params.set('closed', 'false');
    }

    params.set('order', 'volume24hr,desc');

    return `/api/markets?${params.toString()}`;
  };

  // SWR fetcher
  const fetcher = (url) => fetch(url).then((res) => res.json());

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR(
    buildUrl(offset),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
    }
  );

  // Update markets when data changes
  useEffect(() => {
    if (data?.markets) {
      if (offset === 0) {
        // First page, replace all markets
        setAllMarkets(data.markets);
      } else {
        // Subsequent pages, append to existing markets
        setAllMarkets(prev => [...prev, ...data.markets]);
      }
      setHasMore(data.markets.length === limit);
    }
  }, [data, offset, limit]);

  // Reset when filters change
  useEffect(() => {
    setOffset(0);
    setAllMarkets([]);
    setHasMore(true);
  }, [searchQuery, category, status]);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setOffset(prev => prev + limit);
    }
  }, [isLoading, hasMore, limit]);

  const markets = allMarkets;
  const loading = isLoading && offset === 0;

  // WebSocket and polling state
  const [visibleMarkets, setVisibleMarkets] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Infinite scroll setup
  const [loadMoreRef, setLoadMoreRef] = useState(null);

  useEffect(() => {
    if (!loadMoreRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef);
    return () => observer.disconnect();
  }, [loadMoreRef, hasMore, isLoading, loadMore]);

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
              noOdds: noPrice,
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

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-gray-400 text-lg">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-red-400 text-lg mb-4">Failed to load markets</div>
        <div className="text-gray-400 text-sm mb-6">{error}</div>
        <button
          onClick={fetchMarkets}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (markets.length === 0 && !loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-gray-400 text-lg">No markets found</div>
        <div className="text-gray-500 text-sm mt-2">Try adjusting your filters</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 w-12"></th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Question</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Yes Odds</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">No Odds</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Vol 24h</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Vol 1w</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Expires</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {markets.map((market, index) => (
                <MarketRow
                  key={market.id || index}
                  market={market}
                  onMarketClick={onMarketClick}
                  formatDate={formatDate}
                  formatVolume={formatVolume}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Markets Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {markets.map((market, index) => (
          <MarketCard
            key={market.id || index}
            market={market}
            onMarketClick={onMarketClick}
            formatDate={formatDate}
            formatVolume={formatVolume}
          />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div
        ref={setLoadMoreRef}
        className="flex justify-center py-8"
      >
        {isLoading && offset > 0 && (
          <div className="text-gray-400">Loading more markets...</div>
        )}
        {hasMore && !isLoading && (
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            Load More Markets
          </button>
        )}
        {!hasMore && markets.length > 0 && (
          <div className="text-gray-400 text-sm">No more markets to load</div>
        )}
      </div>

    </div>
  );
}

// Enhanced market row component for desktop
function MarketRow({ market, onMarketClick, formatDate, formatVolume }) {
  return (
    <tr
      className="hover:bg-slate-700/30 transition-colors duration-200 cursor-pointer"
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

      {/* Yes Odds Column */}
      <td className="px-6 py-4 text-right">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ease-in-out ${
          market.yesOdds > 0.5 ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
        } ${market.lastUpdate ? 'animate-pulse' : ''}`}>
          {(market.yesOdds * 100).toFixed(0)}%
        </span>
      </td>

      {/* No Odds Column */}
      <td className="px-6 py-4 text-right">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ease-in-out ${
          market.noOdds > 0.5 ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'
        } ${market.lastUpdate ? 'animate-pulse' : ''}`}>
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

      {/* Expires Column */}
      <td className="px-6 py-4 text-left">
        <span className="text-sm text-gray-300">
          {market.endDateIso ? `Closes ${market.endDateIso}` : formatDate(market.endDate)}
        </span>
      </td>

      {/* Link Column */}
      <td className="px-6 py-4 text-center">
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
      </td>
    </tr>
  );
}

// Mobile card component
function MarketCard({ market, onMarketClick, formatDate, formatVolume }) {
  return (
    <div
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 shadow-lg hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
      onClick={() => onMarketClick(market)}
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
          <h3 className="font-semibold text-white text-sm leading-tight mb-2">
            {market.question}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400">{market.category}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">
              {market.endDateIso ? `Closes ${market.endDateIso}` : formatDate(market.endDate)}
            </span>
          </div>

          {/* Odds */}
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
          </div>

          {/* Volume */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>24h: {formatVolume(market.volume24hr || 0)}</span>
              <span>1w: {formatVolume(market.volume1wk || 0)}</span>
            </div>
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
        </div>
      </div>
    </div>
  );
}