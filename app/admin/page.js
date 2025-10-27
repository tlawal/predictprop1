'use client';

import useSWR from 'swr';
import { fetcher } from './lib/fetcher';

export default function AdminHomePage() {
  const { data: ordersData } = useSWR('/api/orders?limit=50', fetcher);
  const { data: withdrawalsData } = useSWR('/api/withdrawals?limit=25', fetcher);

  const completedOrders = ordersData?.orders?.filter((order) => order.status === 'completed') || [];
  const revenue = completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const pendingWithdrawals = withdrawalsData?.withdrawals?.filter((w) => w.status === 'pending') || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-5 shadow-inner">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Total Revenue</p>
          <p className="mt-3 text-3xl font-semibold text-white">${revenue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-teal-300">Completed orders</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-5 shadow-inner">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Closed Orders</p>
          <p className="mt-3 text-3xl font-semibold text-white">{completedOrders.length}</p>
          <p className="mt-1 text-xs text-blue-300">Across all plans</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-5 shadow-inner">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Pending Withdrawals</p>
          <p className="mt-3 text-3xl font-semibold text-white">{pendingWithdrawals.length}</p>
          <p className="mt-1 text-xs text-yellow-300">Awaiting finance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white">Latest Orders</h3>
          <div className="space-y-3">
            {(ordersData?.orders || []).slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{order.plan?.description || 'Challenge Plan'}</p>
                  <p className="text-xs text-gray-400">
                    {order.user?.email || 'Unknown'} • {order.status}
                  </p>
                </div>
                <span className="text-sm font-semibold text-teal-300">${order.amount?.toFixed(2) || '0.00'}</span>
              </div>
            )) || <p className="text-sm text-gray-400">No orders available.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white">Operational Checklist</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-teal-400" />
              <span className="text-sm text-gray-300">Review pending enables submitted today.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-sm text-gray-300">Audit accounts nearing risk thresholds.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-purple-400" />
              <span className="text-sm text-gray-300">Queue announcements for upcoming launches.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
