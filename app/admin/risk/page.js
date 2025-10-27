'use client';

import useSWR from 'swr';
import { fetcher } from '../lib/fetcher';

export default function RiskPage() {
  const { data: tradesData } = useSWR('/api/orders?status=completed&limit=100', fetcher);

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Risk Monitoring</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Open Positions</h3>
          <div className="text-2xl font-bold text-yellow-400">0</div>
          <p className="text-sm text-gray-400">Positions currently open</p>
        </div>

        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">High Risk Accounts</h3>
          <div className="text-2xl font-bold text-red-400">0</div>
          <p className="text-sm text-gray-400">Accounts exceeding risk limits</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-4 font-semibold text-white">Recent Risk Events</h3>
        <div className="text-gray-400">No recent risk events to display.</div>
      </div>
    </div>
  );
}
