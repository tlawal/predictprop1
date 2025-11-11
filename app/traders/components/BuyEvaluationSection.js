import React, { useMemo, useState } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  })}`;
};

const formatPercent = (value) => `${Math.round(Number(value || 0) * 100)}%`;

const resolveAccuracy = (source) => {
  if (!source) return 0;
  if (typeof source.accuracy_target === 'number') return source.accuracy_target;
  if (typeof source.accuracy === 'number') return source.accuracy;
  if (typeof source.win_rate === 'number') return source.win_rate <= 1 ? source.win_rate * 100 : source.win_rate;
  if (typeof source.winRate === 'number') return source.winRate <= 1 ? source.winRate * 100 : source.winRate;
  return 0;
};

export default function BuyEvaluationSection({ onClose }) {
  const router = useRouter();
  const [selectedStep, setSelectedStep] = useState('1-step');

  // Fetch plans from API
  const { data: plansData, error, isLoading } = useSWR('/api/plans', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: false
  });

  const plans = useMemo(() => {
    const list = plansData?.plans || [];
    return [...list].sort((a, b) => (a.type === b.type ? a.size - b.size : a.type.localeCompare(b.type)));
  }, [plansData?.plans]);

  const handlePurchase = (plan) => {
    // Navigate to purchase page with URL parameters
    const params = new URLSearchParams({
      size: plan.size || plan.params?.balance || '5000',
      step: plan.type,
      planId: plan.id
    });

    router.push(`/purchase-new-evaluation?${params.toString()}`);
    onClose?.(); // Close sidebar on mobile
  };

  const renderPlanCard = (plan) => {
    const params = plan.params || {};
    const baseBalance = params.starting_balance || plan.size;
    const planFee = Number(plan.fee || 0);
    const accuracyRequirement = resolveAccuracy(params);

    return (
      <div
        key={plan.id}
        className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 hover:bg-slate-700/70 transition-colors"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-lg font-bold text-white">{formatCurrency(baseBalance)}</h4>
            <p className="text-slate-400 text-sm">Starting Balance</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-teal-400">{formatCurrency(planFee)}</div>
            <p className="text-slate-400 text-sm">Evaluation Fee</p>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          {plan.type === '1-step' ? (
            <>
              <div className="flex justify-between">
                <span className="text-slate-300">Profit Target</span>
                <span className="text-green-400 font-medium">
                  {formatPercent(params.profit_target?.percent || 0)} ({formatCurrency(params.profit_target?.amount || 0)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Max Drawdown</span>
                <span className="text-red-400 font-medium">
                  {formatPercent(params.drawdown_max?.percent || 0)} ({formatCurrency(params.drawdown_max?.amount || 0)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Max Exposure</span>
                <span className="text-yellow-400 font-medium">
                  {formatPercent(params.exposure_cap?.percent || 0)} ({formatCurrency(params.exposure_cap?.amount || 0)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Minimum Days</span>
                <span className="text-blue-400 font-medium">{params.min_days || 0}</span>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {['phase1', 'phase2'].map((phaseKey) => {
                const phase = params.phases?.[phaseKey];
                if (!phase) return null;
                const phaseLabel = phaseKey === 'phase1' ? 'Phase 1' : 'Phase 2';
                return (
                  <div key={phaseKey} className="border border-slate-600 rounded-lg p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-200 font-semibold text-xs uppercase">{phaseLabel}</span>
                      <span className="text-slate-400 text-xs">Min Days: {phase.min_days || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Profit Target</span>
                      <span className="text-green-400 font-medium">
                        {formatPercent(phase.profit_target?.percent || 0)} ({formatCurrency(phase.profit_target?.amount || 0)})
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-300">Max Drawdown</span>
                      <span className="text-red-400 font-medium">
                        {formatPercent(phase.drawdown_max?.percent || 0)} ({formatCurrency(phase.drawdown_max?.amount || 0)})
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-300">Max Exposure</span>
                      <span className="text-yellow-400 font-medium">
                        {formatPercent(phase.exposure_cap?.percent || 0)} ({formatCurrency(phase.exposure_cap?.amount || 0)})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-300">Accuracy Requirement</span>
            <span className="text-teal-300 font-medium">{Math.round(accuracyRequirement)}%</span>
          </div>
        </div>

        <button
          onClick={() => handlePurchase(plan)}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
        >
          Purchase Now
        </button>
      </div>
    );
  };

  return (
    <Disclosure as="div" className="border-b border-slate-700">
      {({ open }) => (
        <>
          <Disclosure.Button className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-700/50 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600/20 rounded-full flex items-center justify-center group-hover:bg-teal-600/30 transition-colors">
                <ShoppingCartIcon className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-white font-medium">Buy Evaluation</span>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Disclosure.Button>

          <Transition
            enter="transition duration-200 ease-out"
            enterFrom="transform scale-95 opacity-0 max-h-0"
            enterTo="transform scale-100 opacity-100 max-h-screen"
            leave="transition duration-150 ease-out"
            leaveFrom="transform scale-100 opacity-100 max-h-screen"
            leaveTo="transform scale-95 opacity-0 max-h-0"
            className="overflow-hidden"
          >
            <Disclosure.Panel className="px-6 pb-6">
              {/* Step Toggle */}
              <div className="mb-4">
                <div className="flex bg-slate-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedStep('1-step')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      selectedStep === '1-step'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1-Step
                  </button>
                  <button
                    onClick={() => setSelectedStep('2-step')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      selectedStep === '2-step'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    2-Step
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading plans...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-4">Failed to load plans</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Plans Grid */}
              {!isLoading && !error && (
                <div className="grid grid-cols-1 gap-4">
                  {plans.filter(plan => plan.type === selectedStep).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No {selectedStep} plans available</p>
                    </div>
                  ) : (
                    plans
                      .filter(plan => plan.type === selectedStep)
                      .map((plan) => renderPlanCard(plan))
                  )}
                </div>
              )}

              {/* Footer Note */}
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                <p className="text-xs text-slate-400 text-center">
                  All evaluations include real-time market data and advanced analytics.
                  <br />
                  Start your trading journey today!
                </p>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}
