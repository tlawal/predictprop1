'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PositionsTable({ onPositionClick }) {
  const [sortField, setSortField] = useState('endDate');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: positionsData, error, isLoading } = useSWR('/api/positions', fetcher, {
    refreshInterval: 30000
  });

  const positions = useMemo(() => positionsData?.positions || [], [positionsData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeUntilExpiry = (endDate) => {
    if (!endDate) return 'N/A';

    const now = new Date();
    const expiry = new Date(endDate);
    const diffMs = expiry - now;

    if (diffMs <= 0) return 'Expired';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return '<1h';
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedPositions = useMemo(() => {
    let filtered = positions;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = positions.filter(position => {
        if (statusFilter === 'open') return position.status === 'open';
        if (statusFilter === 'resolved') return position.status === 'resolved';
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle special cases
      if (sortField === 'pnl') {
        aValue = a.pnl || 0;
        bValue = b.pnl || 0;
      } else if (sortField === 'endDate') {
        aValue = new Date(a.endDate || '2025-12-31');
        bValue = new Date(b.endDate || '2025-12-31');
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [positions, sortField, sortDirection, statusFilter]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return sortDirection === 'asc' ?
      <span className="text-blue-400">↑</span> :
      <span className="text-blue-400">↓</span>;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-gray-400 text-lg">Loading positions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-red-400 text-lg mb-4">Failed to load positions</div>
        <div className="text-gray-400 text-sm">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Positions</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="text-sm text-gray-400">
          {filteredAndSortedPositions.length} positions
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('question')}
                >
                  Market <SortIcon field="question" />
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('side')}
                >
                  Side <SortIcon field="side" />
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('shares')}
                >
                  Shares <SortIcon field="shares" />
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('entryPrice')}
                >
                  Entry Price <SortIcon field="entryPrice" />
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('currentPrice')}
                >
                  Current <SortIcon field="currentPrice" />
                </th>
                <th
                  className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('pnl')}
                >
                  P&L <SortIcon field="pnl" />
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('endDate')}
                >
                  Closes <SortIcon field="endDate" />
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAndSortedPositions.map((position) => (
                <tr
                  key={position.id}
                  className="hover:bg-slate-700/30 transition-colors duration-200 cursor-pointer"
                  onClick={() => position.status === 'open' && onPositionClick(position)}
                >
                  {/* Market */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                        {position.icon ? (
                          <Image
                            src={position.icon}
                            alt={position.question}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">📊</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white text-sm leading-tight truncate">
                          {position.question}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Side */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      position.side === 'Yes' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {position.side}
                    </span>
                  </td>

                  {/* Shares */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-300">{position.shares}</span>
                  </td>

                  {/* Entry Price */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-300">{formatCurrency(position.entryPrice)}</span>
                  </td>

                  {/* Current Price */}
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm ${position.status === 'open' ? 'text-green-400' : 'text-gray-400'}`}>
                      {formatCurrency(position.currentPrice)}
                    </span>
                  </td>

                  {/* P&L */}
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-medium ${
                      (position.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(position.pnl || 0)}
                    </span>
                  </td>

                  {/* End Date */}
                  <td className="px-6 py-4 text-left">
                    <div className="text-sm text-gray-300">
                      <div>{getTimeUntilExpiry(position.endDate)}</div>
                      <div className="text-xs text-gray-500">{formatDate(position.endDate)}</div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      position.status === 'open'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-green-900 text-green-300'
                    }`}>
                      {position.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredAndSortedPositions.map((position) => (
          <div
            key={position.id}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 shadow-lg hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
            onClick={() => position.status === 'open' && onPositionClick(position)}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                {position.icon ? (
                  <Image
                    src={position.icon}
                    alt={position.question}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-gray-400">📊</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm leading-tight mb-2">
                  {position.question}
                </h3>

                <div className="flex items-center gap-4 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    position.side === 'Yes' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {position.side}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    position.status === 'open'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-green-900 text-green-300'
                  }`}>
                    {position.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Shares:</span>
                    <span className="text-gray-300 ml-1">{position.shares}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Entry:</span>
                    <span className="text-gray-300 ml-1">{formatCurrency(position.entryPrice)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Current:</span>
                    <span className={`ml-1 ${position.status === 'open' ? 'text-green-400' : 'text-gray-400'}`}>
                      {formatCurrency(position.currentPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">P&L:</span>
                    <span className={`ml-1 font-medium ${
                      (position.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(position.pnl || 0)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Closes:</span>
                    <div className="text-right">
                      <div className="text-gray-300">{getTimeUntilExpiry(position.endDate)}</div>
                      <div className="text-gray-500">{formatDate(position.endDate)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedPositions.length === 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
          <div className="text-gray-400 text-lg mb-4">No positions found</div>
          <div className="text-gray-500 text-sm">
            {statusFilter === 'all'
              ? 'Start trading to see your positions here.'
              : `No ${statusFilter} positions found.`
            }
          </div>
        </div>
      )}
    </div>
  );
}
