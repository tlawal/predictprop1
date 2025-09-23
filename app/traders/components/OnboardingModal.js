'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to PolyProp! 🎉',
      content: (
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl">
            📊
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Your Prediction Trading Journey Begins</h3>
          <p className="text-slate-300 text-lg mb-6">
            Learn to trade on prediction markets with virtual money. Pass our evaluation challenge to unlock live trading!
          </p>
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 font-semibold mb-2">🎯 Demo Mode Active</p>
            <p className="text-slate-400 text-sm">
              You&apos;re currently in demo mode with virtual trades. Complete the challenge to go live!
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Watch the Tutorial Video 🎥',
      content: (
        <div className="text-center">
          <div className="w-full max-w-2xl mx-auto mb-6">
            <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
              <div className="text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-slate-400">Tutorial Video Placeholder</p>
                <p className="text-slate-500 text-sm mt-2">
                  (In production, embed YouTube/Tutorial video here)
                </p>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-4">How to Trade on Prediction Markets</h3>
          <p className="text-slate-300 mb-6">
            Watch this quick tutorial to understand how prediction markets work and how to place your first trades.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-blue-400 font-semibold mb-2">1. 📈 Analyze Markets</div>
              <p className="text-slate-400 text-sm">Study market questions and probabilities</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-green-400 font-semibold mb-2">2. 🎯 Place Bets</div>
              <p className="text-slate-400 text-sm">Buy YES or NO at current odds</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-yellow-400 font-semibold mb-2">3. 🏆 Win Big</div>
              <p className="text-slate-400 text-sm">Get paid when you&apos;re right!</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Challenge Requirements 📋',
      content: (
        <div className="text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl">
            🎯
          </div>
          <h3 className="text-xl font-bold text-white mb-6">Complete These Requirements</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-blue-500">
              <h4 className="text-blue-400 font-semibold mb-2">📊 Trading Activity</h4>
              <ul className="text-slate-300 text-sm text-left space-y-1">
                <li>• 10 minimum resolved markets</li>
                <li>• Consistent position sizing</li>
                <li>• Mix of YES/NO trades</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-green-500">
              <h4 className="text-green-400 font-semibold mb-2">📈 Performance Goals</h4>
              <ul className="text-slate-300 text-sm text-left space-y-1">
                <li>• 70%+ win rate required</li>
                <li>• Max drawdown &lt; 5%</li>
                <li>• Exposure cap &lt; 15%</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-600/50 rounded-lg p-4 mb-6">
            <h4 className="text-yellow-400 font-semibold mb-2">🏆 Reward: Go Live!</h4>
            <p className="text-yellow-200 text-sm">
              Pass the evaluation and unlock real money trading with profit payouts!
            </p>
          </div>

          <p className="text-slate-400 text-sm">
            Take your time - this is about learning proper risk management and trading discipline.
          </p>
        </div>
      )
    },
    {
      title: 'Ready to Start Trading! 🚀',
      content: (
        <div className="text-center">
          <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl">
            🚀
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">You&apos;re All Set!</h3>
          <p className="text-slate-300 text-lg mb-6">
            Start with small positions and focus on learning. Remember: discipline beats conviction!
          </p>

          <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
            <h4 className="text-white font-semibold mb-4">💡 Pro Tips</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-blue-400 font-medium mb-1">📊 Research First</p>
                <p className="text-slate-400 text-sm">Understand the market before trading</p>
              </div>
              <div>
                <p className="text-green-400 font-medium mb-1">🎯 Position Sizing</p>
                <p className="text-slate-400 text-sm">Never risk more than you can afford</p>
              </div>
              <div>
                <p className="text-yellow-400 font-medium mb-1">📈 Track Performance</p>
                <p className="text-slate-400 text-sm">Monitor your win rate and drawdown</p>
              </div>
              <div>
                <p className="text-purple-400 font-medium mb-1">🧠 Stay Disciplined</p>
                <p className="text-slate-400 text-sm">Follow your trading plan strictly</p>
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold text-lg transition-all duration-300"
          >
            🎯 Start Sim Trading!
          </button>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
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
          <div className="fixed inset-0 bg-black bg-opacity-75" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-slate-900 p-8 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title as="h2" className="text-2xl font-bold text-white">
                    {steps[currentStep].title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Step {currentStep + 1} of {steps.length}</span>
                    <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-8">
                  {steps[currentStep].content}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-2">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full ${
                          index === currentStep ? 'bg-blue-600' : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>

                  {currentStep === steps.length - 1 ? (
                    <button
                      onClick={handleComplete}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                    >
                      Get Started! →
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
