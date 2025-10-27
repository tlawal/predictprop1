'use client';

import useSWR from 'swr';
import { fetcher } from '../lib/fetcher';

export default function ReportsPage() {
  const { data: ordersData } = useSWR('/api/orders?limit=1000', fetcher);

  const totalRevenue = ordersData?.orders
    ?.filter((order) => order.status === 'completed')
    ?.reduce((sum, order) => sum + order.amount, 0) || 0;

  const totalOrders = ordersData?.orders?.length || 0;
  const completedOrders = ordersData?.orders?.filter((order) => order.status === 'completed').length || 0;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Reports & Analytics</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Total Revenue</h3>
          <div className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</div>
          <p className="text-sm text-gray-400">From completed orders</p>
        </div>

        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Order Completion</h3>
          <div className="text-2xl font-bold text-blue-400">
            {completedOrders}/{totalOrders}
          </div>
          <p className="text-sm text-gray-400">Completed vs total orders</p>
        </div>

        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Conversion Rate</h3>
          <div className="text-2xl font-bold text-purple-400">
            {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-sm text-gray-400">Order completion rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Plan Performance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>1-Step Challenge</span>
              <span className="text-green-400">65%</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>2-Step Challenge</span>
              <span className="text-blue-400">35%</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Top Affiliates</h3>
          <p className="text-sm text-gray-400">Affiliate tracking coming soon.</p>
        </div>
      </div>
    </div>
  );
}
