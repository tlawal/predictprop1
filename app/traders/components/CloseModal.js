'use client';

import React, { useState } from 'react';

export default function CloseModal({ position, onClose, onConfirm }) {
  const [qty, setQty] = useState(position?.shares || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (qty <= 0 || qty > position.shares) return;

    setIsLoading(true);
    try {
      await onConfirm(qty);
    } catch (error) {
      console.error('Error closing position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!position) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const estimatedPnl = (position.currentPrice - position.entryPrice) * qty;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Close Position</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Position Summary */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center">
              <span className="text-gray-300">📊</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white leading-tight truncate">
                {position.question}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  position.side === 'Yes' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {position.side}
                </span>
                <span className="text-xs text-gray-400">
                  {position.shares} shares
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Entry Price:</span>
              <div className="text-white font-medium">{formatCurrency(position.entryPrice)}</div>
            </div>
            <div>
              <span className="text-gray-400">Current Price:</span>
              <div className="text-green-400 font-medium">{formatCurrency(position.currentPrice)}</div>
            </div>
          </div>
        </div>

        {/* Quantity Input */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Shares to Close
            </label>
            <div className="relative">
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(0, Math.min(position.shares, parseInt(e.target.value) || 0)))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity"
                min="1"
                max={position.shares}
                required
              />
              <div className="absolute right-3 top-3 text-sm text-gray-400">
                / {position.shares} available
              </div>
            </div>
          </div>

          {/* Estimated P&L */}
          <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Estimated P&L:</span>
              <span className={`text-lg font-bold ${
                estimatedPnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(estimatedPnl)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {qty} shares × {formatCurrency(position.currentPrice - position.entryPrice)} per share
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || qty <= 0 || qty > position.shares}
            >
              {isLoading ? 'Closing...' : 'Close Position'}
            </button>
          </div>
        </form>

        {/* Warning */}
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-sm">⚠️</span>
            <div className="text-xs text-yellow-200">
              This action cannot be undone. Make sure you want to close this position before proceeding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
