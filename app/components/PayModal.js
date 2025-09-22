'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';
import { Fragment } from 'react';
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// USDC Contract on Polygon (replace with actual contract)
const USDC_CONTRACT_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const PLATFORM_WALLET = '0x742d35Cc6735d1F5c8a5a0b5f5c8a5a0b5f5c8a5'; // Replace with actual wallet

const PaymentMethod = ({ method, selected, onChange, plan }) => {
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
              {method.fee > 0 ? `+$${method.fee.toFixed(2)}` : 'Free'}
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
          amount: plan.fee
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
      onSuccess({ paymentMethod: 'stripe', transactionId: result.paymentIntent.id });
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
        {isProcessing ? 'Processing...' : `Pay $${plan.fee.toFixed(2)}`}
      </button>
    </form>
  );
};

const CryptoPaymentForm = ({ plan, onSuccess, onError }) => {
  const { user } = usePrivy();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCryptoPayment = async () => {
    if (!user?.wallet?.address) {
      onError('No wallet connected');
      return;
    }

    setIsProcessing(true);

    try {
      // Check if MetaMask or another Web3 wallet is available
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Check if we're on Polygon network
      const network = await provider.getNetwork();
      if (network.chainId !== 137) {
        throw new Error('Please switch to Polygon network');
      }

      // USDC Contract (this is a simplified version - you'd need the actual ABI)
      const usdcContract = new ethers.Contract(
        USDC_CONTRACT_ADDRESS,
        ['function approve(address spender, uint256 amount) returns (bool)', 'function transfer(address to, uint256 amount) returns (bool)'],
        signer
      );

      const amount = ethers.utils.parseUnits(plan.fee.toString(), 6); // USDC has 6 decimals

      // First approve the platform wallet to spend USDC
      const approveTx = await usdcContract.approve(PLATFORM_WALLET, amount);
      await approveTx.wait();

      // Then transfer the USDC
      const transferTx = await usdcContract.transfer(PLATFORM_WALLET, amount);
      const receipt = await transferTx.wait();

      // Payment succeeded
      onSuccess({ paymentMethod: 'crypto', transactionId: receipt.transactionHash });

    } catch (error) {
      console.error('Crypto payment error:', error);
      onError(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
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
          ${plan.fee.toFixed(2)} USDC
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {ethers.utils.formatUnits(ethers.utils.parseUnits(plan.fee.toString(), 6), 6)} USDC
        </div>
      </div>

      <button
        onClick={handleCryptoPayment}
        disabled={isProcessing}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
      >
        {isProcessing ? 'Processing...' : `Pay with USDC`}
      </button>
    </div>
  );
};

export default function PayModal({ isOpen, onClose, plan, onPaymentSuccess }) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

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
          userId: plan.userId, // This should be passed from the parent
          planType: plan.type,
          balance: plan.params?.starting_balance || 5000, // Default balance
          payment: paymentResult
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
          amount: plan.fee
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
                    <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <div>Profit Target: {plan.params?.roi}%</div>
                      <div>Win Rate: {plan.params?.win_rate}%</div>
                      <div>Max Drawdown: {plan.params?.drawdown}%</div>
                      <div>Max Exposure: {plan.params?.exposure}%</div>
                      <div>Duration: {plan.params?.min_days} days minimum</div>
                    </div>
                    <div className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                      ${plan.fee.toFixed(2)}
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
