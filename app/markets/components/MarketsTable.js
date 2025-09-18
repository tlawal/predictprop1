'use client';

import React, { useEffect, useState, useCallback } from 'react';

export default function MarketsTable({ searchQuery, category, status, onMarketClick }) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const marketsPerPage = 50;

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (category) params.set('category', category);
      // Default to open/active markets if no status specified
      const effectiveStatus = status || 'open';
      params.set('status', effectiveStatus);
      params.set('limit', '500'); // Fetch up to 500 markets for pagination

      const url = `/api/markets?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || data.error);
      }

      const allMarkets = data.markets || [];
      setMarkets(allMarkets);
      setHasMore(allMarkets.length > marketsPerPage);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching markets:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category, status, marketsPerPage]);

  // Fetch markets when parameters change
  useEffect(() => {
    fetchMarkets();
    setPage(1); // Reset to first page when filters change
  }, [fetchMarkets]);

  // Get current page markets
  const getCurrentPageMarkets = () => {
    const startIndex = (page - 1) * marketsPerPage;
    const endIndex = startIndex + marketsPerPage;
    return markets.slice(startIndex, endIndex);
  };

  // Pagination handlers
  const nextPage = () => {
    if (page * marketsPerPage < markets.length) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= Math.ceil(markets.length / marketsPerPage)) {
      setPage(pageNum);
    }
  };

  const totalPages = Math.ceil(markets.length / marketsPerPage);
  const currentMarkets = getCurrentPageMarkets();

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
            <div className="text-xs text-gray-500">
              {markets.length} markets loaded • Page {page} of {totalPages}
            </div>
          </div>

      {/* Markets Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Question</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Yes Odds</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">No Odds</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Volume</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Expires</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {currentMarkets.map((market, index) => (
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

      {/* Pagination Controls */}
      {markets.length > marketsPerPage && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            Showing {((page - 1) * marketsPerPage) + 1} to {Math.min(page * marketsPerPage, markets.length)} of {markets.length} markets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={page === 1}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2 py-2 text-gray-500">...</span>
                  <button
                    onClick={() => goToPage(totalPages)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === totalPages
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={nextPage}
              disabled={page === totalPages}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple market row component
function MarketRow({ market, onMarketClick, formatDate, formatVolume }) {
  return (
    <tr
      className="hover:bg-slate-700/30 transition-colors duration-200"
    >
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
      <td className="px-6 py-4 text-right">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          market.yesOdds > 0.5 ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
        }`}>
          {(market.yesOdds * 100).toFixed(0)}%
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          market.noOdds > 0.5 ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'
        }`}>
          {(market.noOdds * 100).toFixed(0)}%
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-sm text-gray-300">
          {formatVolume(market.volume)}
        </span>
      </td>
      <td className="px-6 py-4 text-left">
        <span className="text-sm text-gray-300">
          {formatDate(market.endDate)}
        </span>
      </td>
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