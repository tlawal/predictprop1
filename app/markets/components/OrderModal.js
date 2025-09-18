'use client';

import React, { useState, useEffect } from 'react';

export default function OrderModal({ market, isOpen, onClose }) {
  const [side, setSide] = useState('yes');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [balance, setBalance] = useState(10000); // Mock USDC balance
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !market) return null;

  const currentPrice = side === 'yes' ? market.yesOdds : market.noOdds;
  const slippage = 0.5; // 0.5% slippage
  const slippageAmount = (parseFloat(amount) || 0) * (slippage / 100);
  const totalCost = (parseFloat(amount) || 0) + slippageAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);

    try {
      // Mock order submission
      const orderData = {
        tokenId: market.tokenId,
        side,
        amount: parseFloat(amount),
        price: orderType === 'market' ? currentPrice : parseFloat(limitPrice),
        orderType
      };

      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = 'Bet placed! P&L updating...';
        document.body.appendChild(toast);
        
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 3000);

        onClose();
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Order failed:', error);
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = 'Failed to place bet. Please try again.';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(balance.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Place Virtual Bet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Market Info */}
        <div className="p-6 border-b border-slate-700">
          <h3 className="font-semibold text-white text-sm mb-2">Market</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{market.question}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span>Closes {new Date(market.endDate).toLocaleDateString()}</span>
            <span>Vol: ${(market.volume / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Side Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Side</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSide('yes')}
                className={`p-4 rounded-lg border transition-all ${
                  side === 'yes'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">YES</div>
                  <div className="text-xs mt-1">${market.yesOdds.toFixed(2)}</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSide('no')}
                className={`p-4 rounded-lg border transition-all ${
                  side === 'no'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">NO</div>
                  <div className="text-xs mt-1">${market.noOdds.toFixed(2)}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Amount (USDC)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={handleMaxAmount}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-gray-300 text-xs rounded transition-colors"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Balance: ${balance.toLocaleString()}</span>
              <span>Available: ${(balance - totalCost).toLocaleString()}</span>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Order Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('market')}
                className={`p-3 rounded-lg border transition-all ${
                  orderType === 'market'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                    : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType('limit')}
                className={`p-3 rounded-lg border transition-all ${
                  orderType === 'limit'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                    : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Limit Price (if limit order) */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Limit Price</label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                max="1"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* Slippage Preview */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-sm text-gray-300 mb-2">Order Summary</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white">${parseFloat(amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Slippage ({slippage}%):</span>
                <span className="text-white">${slippageAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-600 pt-1">
                <span className="text-gray-300 font-semibold">Total Cost:</span>
                <span className="text-white font-semibold">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isSubmitting ? 'Placing Bet...' : 'Place Virtual Bet'}
          </button>
        </form>
      </div>
    </div>
  );
}
