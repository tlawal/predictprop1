'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { supabase } from '../../../lib/supabase';
import { useSupabaseAuth } from '../../../lib/hooks/useSupabaseAuth';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import CertGenerator from './CertGenerator';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function SidePanel({ isOpen, onClose, isMobile = false }) {
  const { t } = useTranslation();
  const { user, logout } = usePrivy();
  const { isAuthenticated } = useSupabaseAuth();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Fetch notifications
  const { data: notificationsData, error: notificationsError } = useSWR(
    user ? `/api/notifications?userId=${user.id}` : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  // Fetch challenge data to check for completed challenges
  const { data: challengeData, error: challengeError } = useSWR(
    user ? `/api/challenge?userId=${user.id}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );


  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const panelContent = (
    <div className="flex flex-col h-full bg-slate-800/95 backdrop-blur-sm">
      {/* Profile Section */}
      <div className="p-6 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="text-white bg-slate-700/50 px-3 py-2 rounded-lg">
              {user?.email?.address || 'Not provided'}
            </div>
          </div>

          <LanguageSwitcher />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet
            </label>
            <div className="text-white bg-slate-700/50 px-3 py-2 rounded-lg font-mono text-sm">
              {user?.wallet?.address ?
                `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` :
                'Not connected'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Section - Always visible */}
      <div className="p-6 border-b border-slate-700">
        {challengeData?.challengeStatus === 'passed' ? (
          // Completed challenge - celebration version
          <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-600/50 rounded-xl p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-600 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                🏆
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Challenge Completed!</h4>
              <p className="text-yellow-200 text-sm mb-4">
                Congratulations on completing your trading challenge!
              </p>
              <button
                onClick={() => setShowCertificateModal(true)}
                className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                🎉 View Certificate
              </button>
            </div>
          </div>
        ) : (
          // Active/Incomplete challenge - preview version
          <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-600 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                📜
              </div>
              <h4 className="text-lg font-bold text-white mb-2">PredictProp Trader</h4>
              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex justify-between">
                  <span>Lifetime Payouts:</span>
                  <span className="text-green-400">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Volume Traded:</span>
                  <span className="text-gray-500">-</span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Date:</span>
                  <span className="text-gray-500">-</span>
                </div>
              </div>
              <button
                onClick={() => setShowCertificateModal(true)}
                className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                👀 Preview Certificate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Account</h3>

        <div className="space-y-2">
          <button
            onClick={() => setShowTermsModal(true)}
            className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            📋 Contracts & Terms
          </button>

          <button
            onClick={() => setShowRulesModal(true)}
            className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            📖 Trading Rules
          </button>

          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            💰 Withdrawals
          </button>

          <Link
            href="/leaderboard"
            onClick={() => onClose?.()}
            className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            🏆 Leaderboards
          </Link>
        </div>

        {/* Notifications */}
        <div className="mt-8">
          <h4 className="text-md font-semibold text-white mb-3 flex items-center justify-between">
            <span>🔔 Notifications</span>
            {notificationsData?.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {notificationsData.unreadCount}
              </span>
            )}
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notificationsData?.notifications?.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg text-sm ${
                  notification.type === 'warning' ? 'bg-yellow-900/50 border border-yellow-600' :
                  notification.type === 'success' ? 'bg-green-900/50 border border-green-600' :
                  'bg-slate-700/50'
                }`}
              >
                <p className="text-gray-200">{notification.msg}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.date).toLocaleDateString()}
                </p>
              </div>
            )) || (
              <div className="text-gray-400 text-sm p-3">
                Loading notifications...
              </div>
            )}
          </div>
        </div>

        {/* Coming Soon Sections */}
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <h4 className="text-md font-semibold text-white mb-2">🏆 Competitions</h4>
            <p className="text-sm text-gray-400">Coming Soon</p>
          </div>

          <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <h4 className="text-md font-semibold text-white mb-2">🤝 Affiliates Portal</h4>
            <p className="text-sm text-gray-400">Refer & Earn - Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-6 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
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

            <div className="fixed inset-0 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                  <Transition.Child
                    as={Fragment}
                    enter="transform transition ease-in-out duration-300"
                    enterFrom="translate-x-full"
                    enterTo="translate-x-0"
                    leave="transform transition ease-in-out duration-200"
                    leaveFrom="translate-x-0"
                    leaveTo="translate-x-full"
                  >
                    <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                      {panelContent}
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Terms Modal */}
        <Transition appear show={showTermsModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowTermsModal(false)}>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md bg-slate-800 rounded-lg p-6">
                <Dialog.Title className="text-lg font-semibold text-white mb-4">
                  Terms & Conditions
                </Dialog.Title>
                <div className="text-gray-300 text-sm space-y-3 max-h-96 overflow-y-auto">
                  <p>These are the terms and conditions for using PolyProp...</p>
                  <p>• Virtual trading platform for educational purposes</p>
                  <p>• No real money transactions</p>
                  <p>• Users must be 18+ years old</p>
                  <p>• Platform available 24/7 with scheduled maintenance</p>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Close
                </button>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* Rules Modal */}
        <Transition appear show={showRulesModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowRulesModal(false)}>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md bg-slate-800 rounded-lg p-6">
                <Dialog.Title className="text-lg font-semibold text-white mb-4">
                  Trading Rules
                </Dialog.Title>
                <div className="text-gray-300 text-sm space-y-3 max-h-96 overflow-y-auto">
                  <p>Follow these trading rules to succeed in your challenge...</p>
                  <p>• Maximum drawdown: 5% of challenge balance</p>
                  <p>• Maximum position exposure: 15% of challenge balance</p>
                  <p>• Minimum win rate: 70% for phase progression</p>
                  <p>• No martingale or high-risk strategies</p>
                </div>
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Close
                </button>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* Withdrawal Modal */}
        <Transition appear show={showWithdrawalModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowWithdrawalModal(false)}>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md bg-slate-800 rounded-lg p-6">
                <Dialog.Title className="text-lg font-semibold text-white mb-4">
                  Withdrawals
                </Dialog.Title>
                <div className="text-gray-300 text-sm space-y-3">
                  <p>Withdrawal requests are processed within 24-48 hours...</p>
                  <p>• Minimum withdrawal: $100</p>
                  <p>• Processing time: 1-2 business days</p>
                  <p>• Available payout methods: Bank transfer, PayPal</p>
                </div>
                <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    🚧 This is a demo platform. Real withdrawals are not available.
                  </p>
                </div>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Close
                </button>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>

        {/* Certificate Modal */}
        <CertGenerator
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          traderName="Demo Trader" // This would come from user data
          planName="1-Step Challenge"
          challengeSize={`$${challengeData?.balance || '5,000'}`}
          completionDate={challengeData?.challengeStatus === 'passed' ? new Date().toLocaleDateString() : 'Not completed yet'}
          onDownload={async (blob) => {
            // Send congratulatory email with certificate attachment (only if completed)
            if (challengeData?.challengeStatus === 'passed') {
              try {
                const formData = new FormData();
                formData.append('certificate', blob, 'certificate.png');
                formData.append('type', 'challenge_completion');
                formData.append('userId', user?.id || 'demo-user');
                formData.append('planName', '1-Step Challenge');
                formData.append('challengeSize', `$${challengeData?.balance || '5,000'}`);

                await fetch('/api/email', {
                  method: 'POST',
                  body: formData,
                });

                console.log('Certificate email sent successfully');
              } catch (error) {
                console.error('Error sending certificate email:', error);
              }
            }
          }}
        />
      </>
    );
  }

  // Desktop version - fixed sidebar
  return (
    <div className="w-80 h-full border-r border-slate-700">
      {panelContent}

      {/* Terms Modal */}
      <Transition appear show={showTermsModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowTermsModal(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-slate-800 rounded-lg p-6">
              <Dialog.Title className="text-lg font-semibold text-white mb-4">
                Terms & Conditions
              </Dialog.Title>
              <div className="text-gray-300 text-sm space-y-3 max-h-96 overflow-y-auto">
                <p>These are the terms and conditions for using PolyProp...</p>
                <p>• Virtual trading platform for educational purposes</p>
                <p>• No real money transactions</p>
                <p>• Users must be 18+ years old</p>
                <p>• Platform available 24/7 with scheduled maintenance</p>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Close
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* Rules Modal */}
      <Transition appear show={showRulesModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowRulesModal(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-slate-800 rounded-lg p-6">
              <Dialog.Title className="text-lg font-semibold text-white mb-4">
                Trading Rules
              </Dialog.Title>
              <div className="text-gray-300 text-sm space-y-3 max-h-96 overflow-y-auto">
                <p>Follow these trading rules to succeed in your challenge...</p>
                <p>• Maximum drawdown: 5% of challenge balance</p>
                <p>• Maximum position exposure: 15% of challenge balance</p>
                <p>• Minimum win rate: 70% for phase progression</p>
                <p>• No martingale or high-risk strategies</p>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Close
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* Withdrawal Modal */}
      <Transition appear show={showWithdrawalModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowWithdrawalModal(false)}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-slate-800 rounded-lg p-6">
            <Dialog.Title className="text-lg font-semibold text-white mb-4">
              Withdrawals
            </Dialog.Title>
            <div className="text-gray-300 text-sm space-y-3">
              <p>Withdrawal requests are processed within 24-48 hours...</p>
              <p>• Minimum withdrawal: $100</p>
              <p>• Processing time: 1-2 business days</p>
              <p>• Available payout methods: Bank transfer, PayPal</p>
            </div>
            <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg">
              <p className="text-yellow-200 text-sm">
                🚧 This is a demo platform. Real withdrawals are not available.
              </p>
            </div>
            <button
              onClick={() => setShowWithdrawalModal(false)}
              className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
        </Transition>

        {/* Certificate Modal */}
        <CertGenerator
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          traderName="Demo Trader" // This would come from user data
          planName="1-Step Challenge"
          challengeSize={`$${challengeData?.balance || '5,000'}`}
          completionDate={challengeData?.challengeStatus === 'passed' ? new Date().toLocaleDateString() : 'Not completed yet'}
          onDownload={async (blob) => {
            // Send congratulatory email with certificate attachment (only if completed)
            if (challengeData?.challengeStatus === 'passed') {
              try {
                const formData = new FormData();
                formData.append('certificate', blob, 'certificate.png');
                formData.append('type', 'challenge_completion');
                formData.append('userId', user?.id || 'demo-user');
                formData.append('planName', '1-Step Challenge');
                formData.append('challengeSize', `$${challengeData?.balance || '5,000'}`);

                await fetch('/api/email', {
                  method: 'POST',
                  body: formData,
                });

                console.log('Certificate email sent successfully');
              } catch (error) {
                console.error('Error sending certificate email:', error);
              }
            }
          }}
        />
    </div>
  );
}
