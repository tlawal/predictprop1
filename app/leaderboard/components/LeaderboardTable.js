'use client';

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function LeaderboardTable({ data, isLoading, error, searchQuery }) {
  const [sortField, setSortField] = useState('pnl');
  const [sortDirection, setSortDirection] = useState('desc');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Wallet address copied!');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle special cases
      if (sortField === 'pnl') {
        aValue = parseFloat(a.pnl || 0);
        bValue = parseFloat(b.pnl || 0);
      } else if (sortField === 'wins') {
        aValue = parseInt(a.wins || 0);
        bValue = parseInt(b.wins || 0);
      } else if (sortField === 'winRate') {
        aValue = parseFloat(a.winRate || 0);
        bValue = parseFloat(b.winRate || 0);
      } else if (sortField === 'totalTrades') {
        aValue = parseInt(a.totalTrades || 0);
        bValue = parseInt(b.totalTrades || 0);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400 text-xs">↕</span>;
    return sortDirection === 'asc' ?
      <span className="text-blue-400 text-xs">↑</span> :
      <span className="text-blue-400 text-xs">↓</span>;
  };

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-red-400 text-lg mb-4">Failed to load leaderboard</div>
        <div className="text-gray-400 text-sm">{error.message}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-gray-400 text-lg">Loading leaderboard...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-gray-400 text-lg mb-4">No traders found</div>
        <div className="text-gray-500 text-sm">
          {searchQuery ? `No results for "${searchQuery}"` : 'No trader data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop Table */}
      <div className="hidden lg:block bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Wallet
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('pnl')}
                >
                  PnL <SortIcon field="pnl" />
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('wins')}
                >
                  Wins <SortIcon field="wins" />
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('winRate')}
                >
                  Win Rate <SortIcon field="winRate" />
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('totalTrades')}
                >
                  Total Trades <SortIcon field="totalTrades" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedData.map((trader, index) => (
                <tr
                  key={trader.id || index}
                  className="hover:bg-slate-700/30 transition-colors duration-200"
                >
                  {/* Rank */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                  </td>

                  {/* Wallet */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="text-white font-mono text-sm">
                        {formatAddress(trader.trader)}
                      </div>
                      <button
                        onClick={() => copyToClipboard(trader.trader)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Copy wallet address"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  {/* PnL */}
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-bold ${
                      parseFloat(trader.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(trader.pnl || 0)}
                    </span>
                  </td>

                  {/* Wins */}
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-300">{trader.wins || 0}</span>
                  </td>

                  {/* Win Rate */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((trader.winRate || 0) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-300 w-12 text-right">
                        {Math.round((trader.winRate || 0) * 100)}%
                      </span>
                    </div>
                  </td>

                  {/* Total Trades */}
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-300">{trader.totalTrades || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {sortedData.map((trader, index) => (
          <div
            key={trader.id || index}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 shadow-lg hover:bg-slate-800/70 transition-all duration-200"
          >
            {/* Header with Rank and Wallet */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="text-white font-mono text-sm">
                  {formatAddress(trader.trader)}
                </div>
                <button
                  onClick={() => copyToClipboard(trader.trader)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy wallet address"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <div className={`text-lg font-bold ${
                parseFloat(trader.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(trader.pnl || 0)}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Wins</div>
                <div className="text-lg font-semibold text-white">{trader.wins || 0}</div>
              </div>

              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Win Rate</div>
                <div className="text-lg font-semibold text-white">{Math.round((trader.winRate || 0) * 100)}%</div>
              </div>

              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Trades</div>
                <div className="text-lg font-semibold text-white">{trader.totalTrades || 0}</div>
              </div>
            </div>

            {/* Win Rate Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Win Rate Progress</span>
                <span>{Math.round((trader.winRate || 0) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((trader.winRate || 0) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
          <div className="text-gray-400 text-lg mb-4">No traders found</div>
          <div className="text-gray-500 text-sm">
            {searchQuery ? `No results for "${searchQuery}"` : 'No trader data available'}
          </div>
        </div>
      )}
    </div>
  );
}
