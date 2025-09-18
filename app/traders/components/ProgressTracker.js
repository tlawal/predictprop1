'use client';

import React from 'react';

export default function ProgressTracker({ challengeData, challengeSize }) {
  // Mock data - in real implementation this would come from props
  const phase1Target = (challengeSize * 0.06); // 6% ROI target
  const phase1Progress = challengeData?.phase1Progress || 0;
  const phase1Percentage = Math.min((phase1Progress / phase1Target) * 100, 100);

  const winRate = challengeData?.winRate || 0;
  const winRatePercentage = Math.min(winRate * 100, 100);

  const resolvedMarkets = challengeData?.resolvedMarkets || 0;
  const totalMarkets = 10; // Minimum required for phase 1

  const drawdown = challengeData?.maxDrawdown || 0;
  const exposure = challengeData?.maxExposure || 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Phase Progress Bars */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Challenge Progress</h3>

        <div className="space-y-6">
          {/* Phase 1 Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">Phase 1</span>
                <span className="text-xs text-gray-500">Min 6% ROI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {formatCurrency(phase1Progress)} / {formatCurrency(phase1Target)}
                </span>
                <span className={`text-sm font-medium ${phase1Percentage >= 100 ? 'text-green-400' : 'text-gray-300'}`}>
                  {formatPercentage(phase1Percentage)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  phase1Percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${phase1Percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Win Rate Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">Win Rate</span>
                <span className="text-xs text-gray-500">Min 70%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Target: 70%</span>
                <span className={`text-sm font-medium ${winRatePercentage >= 70 ? 'text-green-400' : 'text-gray-300'}`}>
                  {formatPercentage(winRatePercentage)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  winRatePercentage >= 70 ? 'bg-green-500' : winRatePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${winRatePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Resolved Markets */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Resolved Markets</p>
              <p className="text-2xl font-bold text-white">{resolvedMarkets}/10</p>
            </div>
            <div className={`p-2 rounded-lg ${resolvedMarkets >= 10 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              📊
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Win Rate</p>
              <p className={`text-2xl font-bold ${winRatePercentage >= 70 ? 'text-green-400' : 'text-white'}`}>
                {formatPercentage(winRatePercentage)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${winRatePercentage >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              🎯
            </div>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Max Drawdown</p>
              <p className={`text-2xl font-bold ${drawdown <= 5 ? 'text-green-400' : 'text-red-400'}`}>
                -{formatPercentage(Math.abs(drawdown))}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${drawdown <= 5 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              📉
            </div>
          </div>
        </div>

        {/* Max Exposure */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Max Exposure</p>
              <p className={`text-2xl font-bold ${exposure <= 15 ? 'text-green-400' : 'text-yellow-400'}`}>
                {formatPercentage(exposure)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${exposure <= 15 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              📊
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Rules */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Challenge Rules</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-300 mb-2">Phase 1 Requirements:</h5>
            <ul className="space-y-1 text-gray-400">
              <li>• 10 minimum resolved markets</li>
              <li>• 70% minimum win rate</li>
              <li>• Max drawdown &lt; 5%</li>
              <li>• Max exposure &lt; 15% per market</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-300 mb-2">Phase 2 Requirements:</h5>
            <ul className="space-y-1 text-gray-400">
              <li>• Phase 1 completion</li>
              <li>• Additional 10 resolved markets</li>
              <li>• Maintain win rate ≥ 70%</li>
              <li>• Consistent risk management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
