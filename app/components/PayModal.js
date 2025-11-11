'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useUser } from '@clerk/nextjs';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '$0';
  }

  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  })}`;
};

const formatPercent = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return '0%';
  }

  return `${Math.round(numeric * 100)}%`;
};

const PlanRulesSummary = ({ plan }) => {
  const params = plan?.params;
  if (!params) {
    return null;
  }

  const metrics = params.metrics || params;
  const resolveAccuracy = (source) => {
    if (!source) return 0;
    if (typeof source.accuracy_target === 'number') return source.accuracy_target;
    if (typeof source.accuracy === 'number') return source.accuracy;
    if (typeof source.win_rate === 'number') return source.win_rate;
    if (typeof source.winRate === 'number') return source.winRate;
    return 0;
  };

  if (plan.type === '1-step') {
    return (
      <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
        <div>
          Profit Target: {formatPercent(metrics.profit_target?.percent)} ({formatCurrency(metrics.profit_target?.amount)})
        </div>
        <div>
          Max Drawdown: {formatPercent(metrics.drawdown_max?.percent)} ({formatCurrency(metrics.drawdown_max?.amount)})
        </div>
        <div>
          Max Exposure: {formatPercent(metrics.exposure_cap?.percent)} ({formatCurrency(metrics.exposure_cap?.amount)})
        </div>
        <div>Minimum Days: {metrics.min_days ?? 0}</div>
        <div>Accuracy Requirement: {resolveAccuracy(metrics)}%</div>
      </div>
    );
  }

  const phases = metrics.phases || params.phases || {};
  const phaseEntries = Object.entries(phases).filter(([, value]) => Boolean(value));

  return (
    <div className="mt-2 space-y-3 text-sm text-slate-600 dark:text-slate-300">
      {phaseEntries.map(([phaseKey, phase]) => {
        const label = phaseKey.toLowerCase().includes('phase') ? phaseKey.replace(/phase/i, 'Phase') : `Phase ${phaseKey}`;

        return (
          <div key={phaseKey} className="rounded-md border border-slate-600/40 dark:border-slate-500/40 p-3">
            <div className="text-xs font-semibold text-teal-300 uppercase mb-2">
              {label}
            </div>
            <div>Profit Target: {formatPercent(phase?.profit_target?.percent)} ({formatCurrency(phase?.profit_target?.amount)})</div>
            <div>Max Drawdown: {formatPercent(phase?.drawdown_max?.percent)} ({formatCurrency(phase?.drawdown_max?.amount)})</div>
            <div>Max Exposure: {formatPercent(phase?.exposure_cap?.percent)} ({formatCurrency(phase?.exposure_cap?.amount)})</div>
            <div>Minimum Days: {phase?.min_days ?? 0}</div>
          </div>
        );
      })}
      <div>Accuracy Requirement: {resolveAccuracy(metrics) || resolveAccuracy(params)}%</div>
    </div>
  );
};

const PaymentMethod = ({ method, selected, onChange }) => {
  const isSelected = selected === method.id;

  return (
    <div
      className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
      }`}
      onClick={() => onChange(method)}
    >
      <div className="flex items-center space-x-3">
        <input
          type="radio"
          checked={isSelected}
          onChange={() => onChange(method)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              {method.name}
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {Number(method.fee) > 0 ? `+$${Number(method.fee).toFixed(2)}` : 'Free'}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {method.description}
          </p>
        </div>
      </div>
    </div>
  );
};

const StripeCheckoutForm = ({ plan, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useUser();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent on your backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          amount: Number(plan.fee),
          userId: plan.userId || user?.id
        }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Payment succeeded
      onSuccess({
        paymentMethod: 'stripe',
        transactionId: result.paymentIntent.id,
        paymentRecordId: result.paymentRecordId
      });
    } catch (error) {
      console.error('Payment error:', error);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Card Information
        </label>
        <div className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
      >
        {isProcessing ? 'Processing...' : `Pay $${Number(plan.fee).toFixed(2)}`}
      </button>
    </form>
  );
};

const CryptoPaymentForm = ({ plan, onSuccess, onError }) => {
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState(null);

  useEffect(() => {
    // USDC payment is disabled with Clerk authentication
    // as Clerk doesn't provide wallet addresses
    setUsdcBalance(0);
  }, []);

  const handleCryptoPayment = async () => {
    // USDC payment is not available with Clerk authentication
    onError('USDC payments are not available with email authentication. Please use Stripe payment.');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-600">⚠️</span>
          <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            Polygon Network Required
          </span>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          Make sure your wallet is connected to Polygon network and you have sufficient USDC balance.
        </p>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          ${Number(plan.fee).toFixed(2)} USDC
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {ethers.utils.formatUnits(ethers.utils.parseUnits(Number(plan.fee).toString(), 6), 6)} USDC
        </div>
        {usdcBalance && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Your balance: {parseFloat(usdcBalance.balance).toFixed(2)} USDC
          </div>
        )}
      </div>

      <button
        onClick={handleCryptoPayment}
        disabled={isProcessing}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
      >
        {isProcessing ? 'Processing...' : `Pay $${Number(plan.fee).toFixed(2)}`}
      </button>
    </div>
  );
};

export default function PayModal({ isOpen, onClose, plan, onPaymentSuccess }) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const { user } = useUser();

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Credit Card',
      description: 'Pay with Visa, Mastercard, or American Express',
      fee: 0,
    },
    {
      id: 'crypto',
      name: 'USDC (Polygon)',
      description: 'Pay directly with USDC cryptocurrency',
      fee: 0,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setSelectedPaymentMethod(null);
      setPaymentError(null);
    }
  }, [isOpen]);

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      // Create the challenge
      const response = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: plan.userId || user?.id,
          planId: plan.id,
          payment: {
            ...paymentResult,
            paymentRecordId: paymentResult.paymentRecordId
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create challenge');
      }

      // Send congrats email (stub)
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'challenge_started',
          userId: plan.userId,
          planType: plan.type,
          amount: Number(plan.fee)
        }),
      });

      toast.success('Challenge started successfully! 🎉');
      onPaymentSuccess(result.challenge);
      onClose();

    } catch (error) {
      console.error('Challenge creation error:', error);
      setPaymentError(error.message);
    }
  };

  const handlePaymentError = (error) => {
    setPaymentError(error);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-slate-900 dark:text-white mb-4"
                >
                  Start {plan?.type} Challenge
                </Dialog.Title>

                {plan && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {plan.description}
                    </h4>
                    <PlanRulesSummary plan={plan} />
                    <div className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                      ${Number(plan.fee).toFixed(2)}
                    </div>
                  </div>
                )}

                {!selectedPaymentMethod ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      Choose Payment Method
                    </h4>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <PaymentMethod
                          key={method.id}
                          method={method}
                          selected={selectedPaymentMethod?.id}
                          onChange={setSelectedPaymentMethod}
                          plan={plan}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setSelectedPaymentMethod(null)}
                      className="text-sm text-blue-600 hover:text-blue-700 mb-4"
                    >
                      ← Back to payment methods
                    </button>

                    {selectedPaymentMethod.id === 'stripe' && (
                      <Elements stripe={stripePromise}>
                        <StripeCheckoutForm
                          plan={plan}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    )}

                    {selectedPaymentMethod.id === 'crypto' && (
                      <CryptoPaymentForm
                        plan={plan}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    )}
                  </div>
                )}

                {paymentError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {paymentError}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
