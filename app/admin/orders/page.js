'use client';

import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { fetcher } from '../lib/fetcher';

export default function OrdersPage() {
  const { user } = useUser();
  const adminId = user?.id;
  const { data: ordersData, error, mutate } = useSWR('/api/orders?limit=100', fetcher);

  const updateOrderStatus = async (orderId, newStatus, notes) => {
    if (!adminId) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          notes,
          adminId
        })
      });

      if (response.ok) {
        mutate();
      }
    } catch (updateError) {
      console.error('Error updating order:', updateError);
    }
  };

  if (!adminId) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Orders Management</h2>

      {error && <div className="mb-4 text-red-400">Failed to load orders</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-600 text-slate-400">
            <tr>
              <th className="px-2 py-3 text-left">Order ID</th>
              <th className="px-2 py-3 text-left">Plan</th>
              <th className="px-2 py-3 text-left">Customer</th>
              <th className="px-2 py-3 text-left">Affiliate</th>
              <th className="px-2 py-3 text-right">Amount</th>
              <th className="px-2 py-3 text-left">Status</th>
              <th className="px-2 py-3 text-left">Payment</th>
              <th className="px-2 py-3 text-left">Date</th>
              <th className="px-2 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordersData?.orders?.map((order) => (
              <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="px-2 py-3 font-mono text-white">{order.orderId}</td>
                <td className="px-2 py-3 text-slate-300">
                  <div>
                    <div className="font-medium">{order.plan.description}</div>
                    <div className="text-xs text-slate-500">{order.plan.type}</div>
                  </div>
                </td>
                <td className="px-2 py-3 text-slate-300">
                  <div>
                    <div>{order.user.email}</div>
                    <div className="font-mono text-xs text-slate-500">{order.user.wallet}</div>
                  </div>
                </td>
                <td className="px-2 py-3 text-slate-300">{order.affiliate ? order.affiliate.name : '-'}</td>
                <td className="px-2 py-3 text-right font-semibold text-green-400">${order.amount.toFixed(2)}</td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      order.status === 'completed'
                        ? 'bg-green-900 text-green-300'
                        : order.status === 'pending'
                        ? 'bg-yellow-900 text-yellow-300'
                        : order.status === 'cancelled'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-2 py-3 capitalize text-slate-300">
                  {order.paymentMethod?.replace('_', ' ') || '-'}
                </td>
                <td className="px-2 py-3 text-slate-300">{order.timestamp}</td>
                <td className="px-2 py-3">
                  {order.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed', 'Approved by admin')}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled', 'Rejected by admin')}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )) || (
              <tr>
                <td colSpan="9" className="py-8 text-center text-slate-400">
                  Loading orders...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
