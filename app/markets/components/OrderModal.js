'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Draggable from 'react-draggable';
import FocusLock from 'react-focus-lock';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';

export default function OrderModal({ market, isOpen, onClose }) {
  const [side, setSide] = useState('yes');
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [balance, setBalance] = useState(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef(null);
  const nodeRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSide('yes');
      setOrderType('market');
      setLimitPrice('');
      setIsWatching(false);
    }
  }, [isOpen]);

  // Handle keyboard navigation and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        return;
      }
    };

    let scrollLockedNode = null;

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      scrollLockedNode = modalRef.current;
      if (scrollLockedNode) {
        disableBodyScroll(scrollLockedNode);
      }
      document.body.classList.add('overflow-hidden');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scrollLockedNode) {
        enableBodyScroll(scrollLockedNode);
      }
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onClose]);

  // Cleanup body scroll locks on unmount
  useEffect(() => {
    return () => {
      clearAllBodyScrollLocks();
    };
  }, []);

  if (!isOpen || !market) return null;

  const currentPrice = side === 'yes' ? market.yesOdds : market.noOdds;
  const totalCost = parseFloat(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);

    try {
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

  return (
    <FocusLock returnFocus={true}>
      {/* Desktop Modal */}
      <div className="hidden md:block">
        <div ref={modalRef} className="fixed inset-0 z-[1050] p-4">
          {/* Transparent Backdrop - No blur for full context visibility */}
          <div
            className="absolute inset-0 bg-transparent"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Draggable Modal */}
          <Draggable
            handle=".drag-handle"
            disabled={isMobile}
            defaultPosition={{ x: 0, y: 0 }}
            bounds="parent"
            nodeRef={nodeRef}
            cancel=".no-drag"
          >
            <div
              ref={nodeRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="bg-gray-800 shadow-2xl rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden transition-all duration-300 ease-in-out transform cursor-move"
              style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
            >
              {/* Draggable Header */}
              <div className="drag-handle flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800 rounded-t-xl select-none">
                <div className="flex items-center gap-3">
                  <Bars3Icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  <h2 id="modal-title" className="text-xl font-bold text-white">
                    Place Virtual Bet
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="no-drag text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Side Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Side</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSide('yes')}
                        className={`no-drag p-4 rounded-lg border-2 transition-all duration-200 ${
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
                        className={`no-drag p-4 rounded-lg border-2 transition-all duration-200 ${
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
                        className={`no-drag w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          amountError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'
                        }`}
                        required
                        aria-invalid={!!amountError}
                        aria-describedby={amountError ? "amount-error" : "amount-help"}
                      />
                      <button
                        type="button"
                        onClick={handleMaxAmount}
                        className="no-drag absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                        aria-label="Use maximum available balance"
                      >
                        MAX
                      </button>
                    </div>
                    {amountError && (
                      <p id="amount-error" className="text-red-600 text-xs mt-1" role="alert">
                        {amountError}
                      </p>
                    )}
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Balance: ${balance.toLocaleString()}</span>
                      <span>Est. Cost: ${totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Order Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOrderType('market')}
                        className={`no-drag p-3 rounded-lg border-2 transition-all duration-200 ${
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
                        className={`no-drag p-3 rounded-lg border-2 transition-all duration-200 ${
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
                        className="no-drag w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        aria-label="Limit price for order execution"
                      />
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm font-semibold text-white mb-3">Order Summary</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white font-medium">${parseFloat(amount || 0).toFixed(2)}</span>
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
                    className="no-drag w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Placing Bet...' : 'Place Virtual Bet'}
                  </button>
                </form>
              </div>
            </div>
          </Draggable>
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
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">Market</h3>
                    <button
                      type="button"
                      onClick={handleWatchMarket}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isWatching
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                      }`}
                      aria-label={isWatching ? 'Already watching this market' : 'Watch'}
                    >
                      {isWatching ? 'Watching' : 'Watch'}
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{market.question}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Closes {new Date(market.endDate).toLocaleDateString()}</span>
                    <span>Vol: ${(market.volume / 1000).toFixed(0)}k</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Side</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSide('yes')}
                        className={`no-drag p-3 rounded-lg border-2 transition-all duration-200 ${
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
                        className={`no-drag p-3 rounded-lg border-2 transition-all duration-200 ${
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
                        className={`no-drag w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          amountError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleMaxAmount}
                        className="no-drag absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
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

                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">Order Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOrderType('market')}
                        className={`no-drag p-3 rounded-lg border-2 transition-all duration-200 ${
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
                        className={`no-drag p-3 rounded-lg border-2 transition-all duration-200 ${
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
                        className="no-drag w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}

                  <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-medium">${parseFloat(amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-600 pt-2 mt-2">
                      <span className="text-white font-semibold">Total Cost:</span>
                      <span className="text-white font-semibold">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!amount || parseFloat(amount) <= 0 || !!amountError || isSubmitting}
                  className="no-drag w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg"
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
