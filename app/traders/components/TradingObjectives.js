'use client';

import React from 'react';

export default function TradingObjectives({ challengeData, challengeSize }) {
  if (!challengeData) return null;

  const profitTarget = challengeData.challengeSize * 0.06; // 6% for Phase 1
  const currentProfit = challengeData.totalPnL || 0;
  const profitProgress = Math.min(currentProfit / profitTarget, 1) * 100;

  const drawdownLimit = challengeData.maxDrawdownPercent || 5; // 5% max drawdown
  const currentDrawdown = Math.abs(challengeData.maxDrawdownPercent || 0);

  const exposureLimit = challengeData.maxExposurePercent || 15; // 15% max exposure
  const currentExposure = challengeData.maxExposurePercent || 0;

  const winRateTarget = 70; // 70% win rate
  const currentWinRate = challengeData.winRate || 0;

  const cards = [
    {
      title: 'Profit Target',
      current: `$${currentProfit.toFixed(2)}`,
      target: `$${profitTarget.toFixed(2)}`,
      progress: profitProgress,
      status: profitProgress >= 100 ? 'completed' : 'active',
      color: 'green'
    },
    {
      title: 'Daily Loss Limit',
      current: `${currentDrawdown.toFixed(1)}%`,
      target: `<${drawdownLimit}%`,
      progress: Math.max(0, (drawdownLimit - currentDrawdown) / drawdownLimit * 100),
      status: currentDrawdown > drawdownLimit ? 'warning' : 'good',
      color: currentDrawdown > drawdownLimit ? 'red' : 'green'
    },
    {
      title: 'Max Exposure',
      current: `${currentExposure.toFixed(1)}%`,
      target: `<${exposureLimit}%`,
      progress: Math.max(0, (exposureLimit - currentExposure) / exposureLimit * 100),
      status: currentExposure > exposureLimit ? 'warning' : 'good',
      color: currentExposure > exposureLimit ? 'yellow' : 'green'
    },
    {
      title: 'Win Rate',
      current: `${currentWinRate.toFixed(1)}%`,
      target: `${winRateTarget}%`,
      progress: Math.min(currentWinRate / winRateTarget * 100, 100),
      status: currentWinRate >= winRateTarget ? 'completed' : 'active',
      color: 'blue'
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-6">Trading Objectives</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-2">{card.title}</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">{card.current}</span>
                <span className="text-sm text-gray-400">{card.target}</span>
              </div>

              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    card.color === 'green' ? 'bg-green-500' :
                    card.color === 'red' ? 'bg-red-500' :
                    card.color === 'yellow' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${card.progress}%` }}
                />
              </div>

              <div className={`text-xs font-medium ${
                card.status === 'completed' ? 'text-green-400' :
                card.status === 'warning' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {card.status === 'completed' && '✅ Completed'}
                {card.status === 'warning' && '⚠️ Over Limit'}
                {card.status === 'active' && `${card.progress.toFixed(0)}% Complete`}
                {card.status === 'good' && '✅ Within Limits'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
