'use client';

import React from 'react';

export default function LeaderboardPage() {
  const mockLeaderboard = [
    { rank: 1, name: 'Trader A', pnl: '+$12,450', accuracy: '78%', accountSize: '$50K' },
    { rank: 2, name: 'Trader B', pnl: '+$9,230', accuracy: '82%', accountSize: '$25K' },
    { rank: 3, name: 'Trader C', pnl: '+$8,910', accuracy: '75%', accountSize: '$10K' },
    { rank: 4, name: 'Trader D', pnl: '+$7,650', accuracy: '80%', accountSize: '$100K' },
    { rank: 5, name: 'Trader E', pnl: '+$6,420', accuracy: '73%', accountSize: '$50K' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-400 mt-2">Top performing traders this month</p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Monthly Rankings</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trader</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Account Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {mockLeaderboard.map((trader) => (
                <tr key={trader.rank} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        trader.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                        trader.rank === 2 ? 'bg-gray-400 text-gray-900' :
                        trader.rank === 3 ? 'bg-orange-500 text-orange-900' :
                        'bg-gray-600 text-white'
                      }`}>
                        {trader.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{trader.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-400 font-medium">{trader.pnl}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-400">{trader.accuracy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{trader.accountSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
