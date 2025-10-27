'use client';

import useSWR from 'swr';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { fetcher } from '../lib/fetcher';
import { useUser } from '@clerk/nextjs';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function PayoutsWithdrawalsPage() {
  const { user } = useUser();
  const adminId = user?.id;
  const { data: withdrawalsData, mutate } = useSWR('/api/withdrawals?limit=100', fetcher);

  const processWithdrawal = async (withdrawalId, newStatus) => {
    if (!adminId) return;

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: withdrawalId,
          status: newStatus,
          adminId
        })
      });

      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    }
  };

  const totalWithdrawn = withdrawalsData?.withdrawals
    ?.filter((w) => w.status === 'completed')
    ?.reduce((sum, w) => sum + w.amount, 0) || 0;

  const pendingWithdrawals = withdrawalsData?.withdrawals
    ?.filter((w) => w.status === 'pending').length || 0;

  if (!adminId) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Withdrawal Reports</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Total Withdrawn</h3>
          <div className="text-2xl font-bold text-green-400">${totalWithdrawn.toFixed(2)}</div>
          <p className="text-sm text-gray-400">Completed withdrawals</p>
        </div>

        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Pending Withdrawals</h3>
          <div className="text-2xl font-bold text-yellow-400">{pendingWithdrawals}</div>
          <p className="text-sm text-gray-400">Awaiting processing</p>
        </div>

        <div className="rounded-lg bg-gray-700/40 p-4">
          <h3 className="mb-3 font-semibold text-white">Platform Fees</h3>
          <div className="text-2xl font-bold text-blue-400">${(totalWithdrawn * 0.1).toFixed(2)}</div>
          <p className="text-sm text-gray-400">10% platform cut</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-600 text-gray-400">
            <tr>
              <th className="px-2 py-3 text-left">Trader</th>
              <th className="px-2 py-3 text-left">Wallet</th>
              <th className="px-2 py-3 text-left">Challenge</th>
              <th className="px-2 py-3 text-right">Amount</th>
              <th className="px-2 py-3 text-right">Platform Fee</th>
              <th className="px-2 py-3 text-right">Trader Share</th>
              <th className="px-2 py-3 text-left">Status</th>
              <th className="px-2 py-3 text-left">Date</th>
              <th className="px-2 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawalsData?.withdrawals?.map((withdrawal) => (
              <tr key={withdrawal.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="px-2 py-3 text-white">{withdrawal.traderName || 'Demo Trader'}</td>
                <td className="px-2 py-3 font-mono text-xs text-gray-300">
                  {withdrawal.wallet ? `${withdrawal.wallet.slice(0, 6)}...${withdrawal.wallet.slice(-4)}` : '-'}
                </td>
                <td className="px-2 py-3 text-gray-300">{withdrawal.challengeType || '1-Step'}</td>
                <td className="px-2 py-3 text-right font-semibold text-white">
                  ${withdrawal.amount.toFixed(2)}
                </td>
                <td className="px-2 py-3 text-right text-red-400">
                  ${(withdrawal.amount * 0.1).toFixed(2)}
                </td>
                <td className="px-2 py-3 text-right text-green-400">
                  ${(withdrawal.amount * 0.8).toFixed(2)}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      withdrawal.status === 'completed'
                        ? 'bg-green-900 text-green-300'
                        : withdrawal.status === 'pending'
                        ? 'bg-yellow-900 text-yellow-300'
                        : withdrawal.status === 'processing'
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {withdrawal.status}
                  </span>
                </td>
                <td className="px-2 py-3 text-gray-300">
                  {dayjs(withdrawal.createdAt).tz('America/New_York').format('MM/DD/YYYY HH:mm')}
                </td>
                <td className="px-2 py-3">
                  {withdrawal.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => processWithdrawal(withdrawal.id, 'completed')}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                      >
                        Process
                      </button>
                      <button
                        onClick={() => processWithdrawal(withdrawal.id, 'cancelled')}
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
                  No withdrawal records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
