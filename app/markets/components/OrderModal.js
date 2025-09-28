'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Draggable from 'react-draggable';
import FocusLock from 'react-focus-lock';
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';

export default function OrderModal({ market, isOpen, onClose }) {
  const [side, setSide] = useState('yes');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [slippage, setSlippage] = useState(0.5); // Slippage percentage
  const [balance, setBalance] = useState(10000); // Mock USDC balance
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [believedProb, setBelievedProb] = useState(''); // User's believed probability
  const [isWatching, setIsWatching] = useState(false);
  const modalRef = useRef(null);

  // Handle keyboard navigation and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        // Allow Enter on inputs to work normally
        return;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Disable body scroll using body-scroll-lock
      if (modalRef.current) {
        disableBodyScroll(modalRef.current);
      }
      // Add overflow-hidden class to body
      document.body.classList.add('overflow-hidden');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Re-enable body scroll
      if (modalRef.current) {
        enableBodyScroll(modalRef.current);
      }
      // Remove overflow-hidden class from body
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onClose]);

  // Cleanup body scroll locks on unmount
  useEffect(() => {
    return () => {
      clearAllBodyScrollLocks();
    };
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setBelievedProb('');
      setSlippage(0.5);
      setSide('yes');
      setOrderType('market');
      setLimitPrice('');
      setIsWatching(false);
    }
  }, [isOpen]);

  if (!isOpen || !market) return null;

  const currentPrice = side === 'yes' ? market.yesOdds : market.noOdds;
  const slippageAmount = (parseFloat(amount) || 0) * (slippage / 100);
  const totalCost = (parseFloat(amount) || 0) + slippageAmount;

  // EV Calculator
  const marketProb = side === 'yes' ? market.yesOdds : market.noOdds;
  const payout = 1 / marketProb; // Payout for $1 bet
  const believedProbDecimal = parseFloat(believedProb) / 100;
  const ev = believedProb && !isNaN(believedProbDecimal)
    ? (believedProbDecimal - marketProb) * (payout - 1)
    : 0;
  const evPercentage = ev * 100;
  const potentialProfit = ev * (parseFloat(amount) || 0);

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
        toast.success('Bet placed! P&L updating...');
        onClose();
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Order failed:', error);
      toast.error('Failed to place bet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(balance.toString());
  };

  // Validation helpers
  const getAmountError = () => {
    const numAmount = parseFloat(amount);
    if (!amount) return null;
    if (isNaN(numAmount) || numAmount <= 0) return 'Amount must be greater than 0';
    if (totalCost > balance) return 'Insufficient balance';
    return null;
  };

  const amountError = getAmountError();

  const handleWatchMarket = async () => {
    if (isWatching) {
      toast.success('Already watching this market!');
      return;
    }

    try {
      const response = await fetch('/api/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId: market.id,
          question: market.question,
          currentYesProb: market.yesOdds * 100
        })
      });

      if (response.ok) {
        setIsWatching(true);
        toast.success('Market added to watchlist! You\'ll be notified of significant price changes.');
      } else {
        throw new Error('Failed to watch market');
      }
    } catch (error) {
      console.error('Watch market failed:', error);
      toast.error('Failed to add market to watchlist. Please try again.');
    }
  };

  if (!isOpen || !market) return null;

  return (
    <FocusLock returnFocus={true}>
      {/* Desktop Modal */}
      <div className="hidden md:block">
        <div ref={modalRef} className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 ease-in-out"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative bg-gray-800 shadow-2xl rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden transition-all duration-300 ease-in-out transform"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800 rounded-t-xl">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                Place Virtual Bet
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="max-h-[70vh] overflow-y-auto">
              {/* Market Info */}
              <div className="p-6 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm">Market</h3>
                  <button
                    onClick={handleWatchMarket}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isWatching
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                    }`}
                    aria-label={isWatching ? 'Already watching this market' : 'Watch this market'}
                  >
                    {isWatching ? 'Watching' : 'Watch Market'}
                  </button>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{market.question}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>Closes {new Date(market.endDate).toLocaleDateString()}</span>
                  <span>Vol: ${(market.volume / 1000).toFixed(0)}k</span>
                </div>
              </div>

              {/* EV Calculator */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-white text-sm">EV Calculator</h3>
                  <div
                    className="text-xs text-gray-400 cursor-help"
                    title="EV (Expected Value) helps assess if the market under/overvalues your belief. Positive EV means the bet has positive expected value!"
                    aria-label="Expected Value information"
                  >
                    ⓘ
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="believed-prob" className="block text-xs font-medium text-gray-400 mb-2">
                      Your Believed {side.toUpperCase()} Probability (%)
                    </label>
                    <input
                      id="believed-prob"
                      type="number"
                      value={believedProb}
                      onChange={(e) => setBelievedProb(e.target.value)}
                      placeholder="e.g., 65"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      aria-describedby="believed-prob-help"
                    />
                  </div>

                  {believedProb && (
                    <div className={`p-3 rounded-lg border ${
                      ev >= 0
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-red-900/20 border-red-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">Expected Value:</span>
                        <span className={`text-sm font-bold ${
                          ev >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {ev >= 0 ? '+' : ''}{(evPercentage).toFixed(1)}% Edge
                        </span>
                      </div>
                      {amount && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">Potential Profit:</span>
                          <span className={`text-xs font-medium ${
                            potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {potentialProfit >= 0 ? '+' : ''}${potentialProfit.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Side Selection */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Side</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSide('yes')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        side === 'yes'
                          ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg shadow-green-500/25'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                      aria-pressed={side === 'yes'}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-lg">YES</div>
                        <div className={`text-xs mt-1 ${side === 'yes' ? 'text-green-100' : 'text-gray-400'}`}>
                          {(market.yesOdds * 100).toFixed(0)}%
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSide('no')}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        side === 'no'
                          ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500 text-white shadow-lg shadow-red-500/25'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                      aria-pressed={side === 'no'}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-lg">NO</div>
                        <div className={`text-xs mt-1 ${side === 'no' ? 'text-red-100' : 'text-gray-400'}`}>
                          {(market.noOdds * 100).toFixed(0)}%
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-white mb-2">
                    Amount (USDC)
                  </label>
                  <div className="relative">
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max={balance}
                      step="0.01"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        amountError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
                    >
                      MAX
                    </button>
                  </div>
                  {amountError && (
                    <p className="text-red-600 text-xs mt-1">{amountError}</p>
                  )}
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Balance: ${balance.toLocaleString()}</span>
                    <span>Available: ${(balance - totalCost).toLocaleString()}</span>
                  </div>
                </div>

                {/* Order Type */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Order Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderType('market')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        orderType === 'market'
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                      aria-pressed={orderType === 'market'}
                      aria-label="Market order - execute immediately at current price"
                    >
                      <div className="text-center">
                        <div className="font-semibold">Market</div>
                        <div className={`text-xs mt-1 ${orderType === 'market' ? 'text-emerald-100' : 'text-gray-400'}`}>
                          Instant
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('limit')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        orderType === 'limit'
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 text-white shadow-lg shadow-amber-500/25'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                      aria-pressed={orderType === 'limit'}
                      aria-label="Limit order - execute at specified price or better"
                    >
                      <div className="text-center">
                        <div className="font-semibold">Limit</div>
                        <div className={`text-xs mt-1 ${orderType === 'limit' ? 'text-amber-100' : 'text-gray-400'}`}>
                          Target Price
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Limit Price (if limit order) */}
                {orderType === 'limit' && (
                  <div>
                    <label htmlFor="limit-price" className="block text-sm font-semibold text-white mb-2">
                      Limit Price
                    </label>
                    <input
                      id="limit-price"
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max="1"
                      step="0.01"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-label="Limit price for order execution"
                    />
                  </div>
                )}

                {/* Slippage Slider */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Slippage: {slippage.toFixed(1)}%
                  </label>
                  <div className="px-2">
                    <div className="relative h-6 flex items-center">
                      {/* Track */}
                      <div className="absolute inset-0 bg-gray-600 rounded-lg h-2"></div>

                      {/* Thumb */}
                      <div
                        className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        style={{
                          left: `${((slippage - 0.1) / (5.0 - 0.1)) * 100}%`,
                          transform: 'translateX(-50%)',
                          top: '50%',
                          marginTop: '-8px',
                        }}
                        onMouseDown={(e) => {
                          const slider = e.currentTarget.parentElement;
                          const rect = slider.getBoundingClientRect();

                          const handleMouseMove = (moveEvent) => {
                            const x = Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left));
                            const percentage = x / rect.width;
                            const newValue = 0.1 + percentage * (5.0 - 0.1);
                            setSlippage(Math.round(newValue * 10) / 10);
                          };

                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                        aria-label={`Slippage ${slippage.toFixed(1)} percent`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1 px-2">
                    <span>0.1%</span>
                    <span>5.0%</span>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-sm font-semibold text-white mb-3">Order Summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-medium">${parseFloat(amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slippage ({slippage.toFixed(1)}%):</span>
                      <span className="text-white font-medium">${slippageAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-600 pt-2 mt-2">
                      <span className="text-white font-semibold">Total Cost:</span>
                      <span className="text-white font-semibold">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!amount || parseFloat(amount) <= 0 || !!amountError || isSubmitting}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Placing Bet...' : 'Place Virtual Bet'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden">
        <div className="fixed inset-x-0 bottom-0 z-[1050] bg-gray-800 rounded-t-xl shadow-2xl max-h-[80vh] overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-center p-4 border-b border-gray-700 bg-gray-800 rounded-t-xl">
              <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Market Info */}
              <div className="p-6 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm">Market</h3>
                  <button
                    onClick={handleWatchMarket}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isWatching
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                    }`}
                    aria-label={isWatching ? 'Already watching this market' : 'Watch this market'}
                  >
                    {isWatching ? 'Watching' : 'Watch'}
                  </button>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{market.question}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>Closes {new Date(market.endDate).toLocaleDateString()}</span>
                  <span>Vol: ${(market.volume / 1000).toFixed(0)}k</span>
                </div>
              </div>

              {/* EV Calculator - Compact for mobile */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-white text-sm">EV Calculator</h3>
                  <div
                    className="text-xs text-gray-400 cursor-help"
                    title="EV (Expected Value) helps assess if the market under/overvalues your belief. Positive EV means the bet has positive expected value!"
                    aria-label="Expected Value information"
                  >
                    ⓘ
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="mobile-believed-prob" className="block text-xs font-medium text-gray-400 mb-2">
                      Your Believed {side.toUpperCase()} Probability (%)
                    </label>
                    <input
                      id="mobile-believed-prob"
                      type="number"
                      value={believedProb}
                      onChange={(e) => setBelievedProb(e.target.value)}
                      placeholder="e.g., 65"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {believedProb && (
                    <div className={`p-3 rounded-lg border ${
                      ev >= 0
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-red-900/20 border-red-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">Expected Value:</span>
                        <span className={`text-sm font-bold ${
                          ev >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {ev >= 0 ? '+' : ''}{(evPercentage).toFixed(1)}% Edge
                        </span>
                      </div>
                      {amount && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">Potential Profit:</span>
                          <span className={`text-xs font-medium ${
                            potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {potentialProfit >= 0 ? '+' : ''}${potentialProfit.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Side Selection */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Side</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSide('yes')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        side === 'yes'
                          ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white shadow-lg shadow-green-500/25'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">YES</div>
                        <div className={`text-xs mt-1 ${side === 'yes' ? 'text-green-100' : 'text-gray-400'}`}>
                          {(market.yesOdds * 100).toFixed(0)}%
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSide('no')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        side === 'no'
                          ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500 text-white shadow-lg shadow-red-500/25'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">NO</div>
                        <div className={`text-xs mt-1 ${side === 'no' ? 'text-red-100' : 'text-gray-400'}`}>
                          {(market.noOdds * 100).toFixed(0)}%
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="mobile-amount" className="block text-sm font-semibold text-white mb-2">
                    Amount (USDC)
                  </label>
                  <div className="relative">
                    <input
                      id="mobile-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max={balance}
                      step="0.01"
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        amountError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
                    >
                      MAX
                    </button>
                  </div>
                  {amountError && (
                    <p className="text-red-600 text-xs mt-1">{amountError}</p>
                  )}
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Balance: ${balance.toLocaleString()}</span>
                    <span>Available: ${(balance - totalCost).toLocaleString()}</span>
                  </div>
                </div>

                {/* Order Type - Compact for mobile */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Order Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderType('market')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        orderType === 'market'
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">Market</div>
                        <div className={`text-xs mt-1 ${orderType === 'market' ? 'text-emerald-100' : 'text-gray-400'}`}>
                          Instant
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('limit')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        orderType === 'limit'
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 text-white shadow-lg shadow-amber-500/25'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">Limit</div>
                        <div className={`text-xs mt-1 ${orderType === 'limit' ? 'text-amber-100' : 'text-gray-400'}`}>
                          Target
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Limit Price (if limit order) */}
                {orderType === 'limit' && (
                  <div>
                    <label htmlFor="mobile-limit-price" className="block text-sm font-semibold text-white mb-2">
                      Limit Price
                    </label>
                    <input
                      id="mobile-limit-price"
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max="1"
                      step="0.01"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!amount || parseFloat(amount) <= 0 || !!amountError || isSubmitting}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg"
                >
                  {isSubmitting ? 'Placing Bet...' : 'Place Virtual Bet'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </FocusLock>
  );
}
