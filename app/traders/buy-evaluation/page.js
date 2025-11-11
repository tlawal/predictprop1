'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

const normalizePercentValue = (value) => {
  if (value == null) return 0;
  if (typeof value === 'number') {
    return value <= 1 ? value * 100 : value;
  }
  const parsed = parseFloat(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return 0;
};

// Helper function to format percentage values (converting from decimal to percentage)
const formatPercentage = (value) => {
  const percent = normalizePercentValue(value);
  return `${percent.toFixed(0)}%`;
};

const resolveAccuracy = (source) => {
  if (!source) return 0;
  if (typeof source.accuracy_target === 'number') return normalizePercentValue(source.accuracy_target);
  if (typeof source.accuracy === 'number') return normalizePercentValue(source.accuracy);
  if (typeof source.win_rate === 'number') return normalizePercentValue(source.win_rate);
  if (typeof source.winRate === 'number') return normalizePercentValue(source.winRate);
  if (typeof source.metrics?.accuracy_target === 'number') return normalizePercentValue(source.metrics.accuracy_target);
  if (typeof source.metrics?.accuracy === 'number') return normalizePercentValue(source.metrics.accuracy);
  if (typeof source.metrics?.win_rate === 'number') return normalizePercentValue(source.metrics.win_rate);
  if (typeof source.metrics?.winRate === 'number') return normalizePercentValue(source.metrics.winRate);
  return 0;
};

const fetcher = (url) => fetch(url).then((res) => res.json());

function PlanCard({ plan }) {
  const router = useRouter();

  const handleSelectPlan = () => {
    router.push(`/purchase-new-evaluation?size=${plan.size}&step=${plan.type}`);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          ${plan.size.toLocaleString()} Account
        </h3>
        <div className="text-sm text-gray-400 mb-4">
          {plan.type === '1-step' ? 'One Step Challenge' : 'Two Step Challenge'}
        </div>

        <div className="text-3xl font-bold text-green-400 mb-4">
          ${plan.fee}
        </div>

        <div className="space-y-2 mb-6 text-sm text-gray-300">
          <div>Accuracy Requirement: {resolveAccuracy(plan.params)}%</div>
          {plan.params?.metrics?.min_days && (
            <div>Min Trading Days: {plan.params.metrics.min_days}</div>
          )}
          {plan.params?.metrics?.profit_target && (
            <div>Profit Target: {typeof plan.params.metrics.profit_target === 'object' 
              ? `${(plan.params.metrics.profit_target.percent * 100).toFixed(0)}% ($${plan.params.metrics.profit_target.amount})` 
              : `${plan.params.metrics.profit_target}%`}
            </div>
          )}
          {plan.params?.metrics?.drawdown_max && (
            <div>Max Drawdown: {typeof plan.params.metrics.drawdown_max === 'object' 
              ? `${(plan.params.metrics.drawdown_max.percent * 100).toFixed(0)}% ($${plan.params.metrics.drawdown_max.amount})` 
              : `${plan.params.metrics.drawdown_max}%`}
            </div>
          )}
          {plan.params?.metrics?.exposure_cap && (
            <div>Exposure Cap: {typeof plan.params.metrics.exposure_cap === 'object' 
              ? `${(plan.params.metrics.exposure_cap.percent * 100).toFixed(0)}% ($${plan.params.metrics.exposure_cap.amount})` 
              : `${plan.params.metrics.exposure_cap}%`}
            </div>
          )}
          {plan.params?.metrics?.phases && (
            <div className="mt-4">
              <div className="font-medium mb-1">Challenge Phases:</div>
              {Object.entries(plan.params.metrics.phases).map(([phase, data]) => (
                <div key={phase} className="ml-4 mt-2 border-l border-gray-700 pl-3">
                  <div className="font-medium capitalize">{phase.replace('phase', 'Phase ')}</div>
                  <div className="text-xs text-gray-400">
                    <div>Min Days: {data.min_days || 'N/A'}</div>
                    <div>Profit Target: {formatPercentage(data.profit_target?.percent)} (${data.profit_target?.amount || '0'})</div>
                    <div>Max Drawdown: {formatPercentage(data.drawdown_max?.percent)} (${data.drawdown_max?.amount || '0'})</div>
                    <div>Max Exposure: {formatPercentage(data.exposure_cap?.percent)} (${data.exposure_cap?.amount || '0'})</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSelectPlan}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Select Plan
        </button>
      </div>
    </div>
  );
}

export default function BuyEvaluationPage() {
  const { data: plansData, error, isLoading } = useSWR('/api/plans?includeInactive=false', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white text-lg">Loading plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-400 text-lg">Error loading plans</div>
      </div>
    );
  }

  const plans = plansData?.plans || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Buy Evaluation</h1>
        <p className="text-gray-400 mt-2">
          Choose your evaluation plan to start your trading challenge
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">No evaluation plans available</div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Evaluation Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">1</span>
            </div>
            <h3 className="text-white font-medium mb-2">Purchase Plan</h3>
            <p className="text-gray-400 text-sm">Select and pay for your evaluation plan</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">2</span>
            </div>
            <h3 className="text-white font-medium mb-2">Complete Challenge</h3>
            <p className="text-gray-400 text-sm">Trade within the rules and meet objectives</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">3</span>
            </div>
            <h3 className="text-white font-medium mb-2">Get Verified</h3>
            <p className="text-gray-400 text-sm">Pass evaluation and get your certificate</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">4</span>
            </div>
            <h3 className="text-white font-medium mb-2">Trade Live</h3>
            <p className="text-gray-400 text-sm">Start trading with real money</p>
          </div>
        </div>
      </div>
    </div>
  );
}
