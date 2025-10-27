'use client';

import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { fetcher } from '../lib/fetcher';

export default function PaymentsPage() {
  const { user } = useUser();
  const adminId = user?.id;
  const { data: paymentsData, mutate } = useSWR('/api/admin/payments?limit=100', fetcher);

  const updatePaymentStatus = async (paymentId, newStatus, notes) => {
    if (!adminId) return;

    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentId,
          status: newStatus,
          notes,
          adminId
        })
      });

      if (response.ok) {
        mutate();
        toast.success(`Payment status updated to ${newStatus}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Error updating payment');
    }
  };

  if (!adminId) {
    return null;
  }

  const totalRevenue = paymentsData?.payments
    ?.filter((payment) => payment.status === 'completed')
    ?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  const pendingPayments = paymentsData?.payments
    ?.filter((payment) => payment.status === 'pending').length || 0;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Payment Management</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Total Revenue</h3>
          <div className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</div>
          <p className="text-sm text-gray-400">From completed payments</p>
        </div>

        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Pending Payments</h3>
          <div className="text-2xl font-bold text-yellow-400">{pendingPayments}</div>
          <p className="text-sm text-gray-400">Awaiting confirmation</p>
        </div>

        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Success Rate</h3>
          <div className="text-2xl font-bold text-blue-400">
            {paymentsData?.payments?.length > 0
              ? (
                  (paymentsData.payments.filter((p) => p.status === 'completed').length /
                    paymentsData.payments.length) *
                  100
                ).toFixed(1)
              : 0}
            %
          </div>
          <p className="text-sm text-gray-400">Payment completion rate</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-600 text-gray-400">
            <tr>
              <th className="px-2 py-3 text-left">Payment ID</th>
              <th className="px-2 py-3 text-left">User</th>
              <th className="px-2 py-3 text-left">Plan</th>
              <th className="px-2 py-3 text-right">Amount</th>
              <th className="px-2 py-3 text-left">Method</th>
              <th className="px-2 py-3 text-left">Status</th>
              <th className="px-2 py-3 text-left">Type</th>
              <th className="px-2 py-3 text-left">Date</th>
              <th className="px-2 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paymentsData?.payments?.map((payment) => (
              <tr key={payment.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="px-2 py-3 font-mono text-xs text-white">{payment.id.slice(0, 8)}...</td>
                <td className="px-2 py-3 text-gray-300">
                  <div>
                    <div>{payment.user?.email || 'Unknown'}</div>
                    <div className="font-mono text-xs text-gray-500">
                      {payment.user_id?.slice(0, 6)}...{payment.user_id?.slice(-4)}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 text-gray-300">{payment.plan_id || payment.challenge_id || 'N/A'}</td>
                <td className="px-2 py-3 text-right font-semibold text-green-400">${payment.amount.toFixed(2)}</td>
                <td className="px-2 py-3 capitalize text-gray-300">
                  {payment.metadata?.paymentMethod || 'stripe'}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      payment.status === 'completed'
                        ? 'bg-green-900 text-green-300'
                        : payment.status === 'pending'
                        ? 'bg-yellow-900 text-yellow-300'
                        : payment.status === 'failed'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-2 py-3 capitalize text-gray-300">
                  {payment.type?.replace('_', ' ') || 'evaluation_fee'}
                </td>
                <td className="px-2 py-3 text-gray-300">
                  {new Date(payment.created_at).toLocaleDateString()}
                </td>
                <td className="px-2 py-3">
                  {payment.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'completed', 'Manually approved by admin')}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'failed', 'Rejected by admin')}
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
                <td colSpan="9" className="py-8 text-center text-gray-400">
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
