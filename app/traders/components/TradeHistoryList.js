'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function TradeHistoryList({ trades, onFilterChange }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    onFilterChange && onFilterChange(filter);
  };

  const filteredTrades = trades.filter(trade => {
    if (statusFilter === 'all') return true;
    return trade.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">Filter:</span>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Trades', count: trades.length },
            { key: 'open', label: 'Open', count: trades.filter(t => t.status === 'open').length },
            { key: 'resolved', label: 'Resolved', count: trades.filter(t => t.status === 'resolved').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Trade History Accordion */}
      <div className="space-y-3">
        {filteredTrades.map((trade) => (
          <Disclosure key={trade.id}>
            {({ open }) => (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-lg">
                {/* Header */}
                <Disclosure.Button className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Market Icon */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                        {trade.icon ? (
                          <Image
                            src={trade.icon}
                            alt={trade.question}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-gray-400">📊</span>
                        )}
                      </div>

                      {/* Trade Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm leading-tight truncate">
                          {trade.question}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{trade.side} • {formatCurrency(trade.entryPrice)}</span>
                          <span>•</span>
                          <span>{trade.shares} shares</span>
                        </div>
                      </div>
                    </div>

                    {/* P&L and Status */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(trade.pnl)}
                        </div>
                        <div className={`text-xs ${
                          trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {trade.pnl >= 0 ? '▲' : '▼'} {Math.abs(trade.pnl / (trade.shares * trade.entryPrice) * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trade.status === 'open'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-green-900 text-green-300'
                      }`}>
                        {trade.status}
                      </div>

                      {/* Expand Icon */}
                      <div className="text-gray-400">
                        {open ? (
                          <ChevronUpIcon className="w-5 h-5" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </Disclosure.Button>

                {/* Expanded Details */}
                <Disclosure.Panel className="px-6 pb-4 border-t border-slate-700">
                  <div className="pt-4 space-y-4">
                    {/* P&L Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-700/30 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">P&L Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Entry Price:</span>
                            <span className="text-white">{formatCurrency(trade.entryPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              {trade.resolved ? 'Final Price:' : 'Current Price:'}
                            </span>
                            <span className="text-white">{formatCurrency(trade.currentPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Shares:</span>
                            <span className="text-white">{trade.shares}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-600 pt-2">
                            <span className="text-gray-400">Total P&L:</span>
                            <span className={`font-semibold ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatCurrency(trade.pnl)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trade Details */}
                      <div className="bg-slate-700/30 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Trade Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Entry Date:</span>
                            <span className="text-white">{formatDate(trade.entryTimestamp)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Expires:</span>
                            <span className="text-white">
                              {trade.resolved ? formatDate(trade.endDate) : getTimeUntilExpiry(trade.endDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Side:</span>
                            <span className={`font-medium ${
                              trade.side === 'Yes' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.side}
                            </span>
                          </div>

                          {/* Resolution Status */}
                          {trade.resolved && (
                            <div className="flex justify-between border-t border-slate-600 pt-2">
                              <span className="text-gray-400">Outcome:</span>
                              <span className={`font-semibold ${
                                trade.outcome === 'Yes' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {trade.outcome} ({trade.outcome === 'Yes' ? '1.0' : '0.0'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>

      {/* Empty State */}
      {filteredTrades.length === 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
          <div className="text-gray-400 text-lg mb-4">No trades found</div>
          <div className="text-gray-500 text-sm">
            {statusFilter === 'all'
              ? 'Start trading to see your trade history here.'
              : `No ${statusFilter} trades found.`
            }
          </div>
        </div>
      )}
    </div>
  );
}
