'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ResultsProgress({ challengeData }) {
  if (!challengeData) return null;

  const winRate = challengeData.winRate || 0;
  const lossRate = 100 - winRate;

  const totalTrades = challengeData.totalMarkets || 0;
  const winningTrades = challengeData.winningTrades || 0;
  const losingTrades = challengeData.losingTrades || 0;

  const totalPnL = challengeData.totalPnL || 0;
  const realizedPnL = challengeData.realizedPnL || 0;
  const unrealizedPnL = challengeData.unrealizedPnL || 0;

  // Pie chart data for win rate
  const winRateData = {
    labels: ['Winning Trades', 'Losing Trades'],
    datasets: [
      {
        data: [winningTrades, losingTrades],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const winRateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = totalTrades > 0 ? ((value / totalTrades) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-6">Results Progress</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate Pie Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Win Rate Distribution</h3>

          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{winRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-green-400">{winningTrades}</div>
              <div className="text-sm text-gray-400">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-red-400">{losingTrades}</div>
              <div className="text-sm text-gray-400">Losses</div>
            </div>
          </div>

          <div className="h-48">
            <Pie data={winRateData} options={winRateOptions} />
          </div>
        </div>

        {/* P&L Breakdown */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">P&L Breakdown</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Realized P&L</span>
              </div>
              <span className={`font-semibold ${realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${realizedPnL.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300">Unrealized P&L</span>
              </div>
              <span className={`font-semibold ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${unrealizedPnL.toFixed(2)}
              </span>
            </div>

            <div className="border-t border-slate-600 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">Total P&L</span>
                <span className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalPnL.toFixed(2)}
                </span>
              </div>

              <div className="mt-2 w-full bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(totalPnL) / (challengeData.challengeSize * 0.1) * 100, 100)}%`
                  }}
                />
              </div>

              <div className="text-xs text-gray-400 mt-1 text-center">
                Scale: $0 - ${(challengeData.challengeSize * 0.1).toFixed(0)} (10% of challenge)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
