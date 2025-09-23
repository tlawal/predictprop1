'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Tab } from '@headlessui/react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabase';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const fetcher = (url) => fetch(url).then((res) => res.json());

function AdminPageContent() {
  const router = useRouter();
  const { user, ready, logout } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check admin status
  useEffect(() => {
    if (!ready) return;

    if (!user) {
      router.push('/');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !data || data.role !== 'admin') {
          router.push('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [ready, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 mt-1">
                Manage orders, contracts, customers, and system settings
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-slate-800/30 p-1 mb-8">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Orders
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Contracts
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Pending Enables
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Customers
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Risk
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Reports
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-300 hover:bg-white/[0.12] hover:text-white'
                }`
              }
            >
              Withdrawals
            </Tab>
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              <OrdersPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <ContractsPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <PendingEnablesPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <CustomersPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <RiskPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <ReportsPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <WithdrawalsPanel adminId={user.id} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}

// Orders Panel Component
function OrdersPanel({ adminId }) {
  const { data: ordersData, error, mutate } = useSWR('/api/orders?limit=100', fetcher);

  const updateOrderStatus = async (orderId, newStatus, notes) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          notes,
          adminId
        }),
      });

      if (response.ok) {
        mutate(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Orders Management</h2>

      {error && (
        <div className="text-red-400 mb-4">Failed to load orders</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-600">
            <tr>
              <th className="text-left py-3 px-2">Order ID</th>
              <th className="text-left py-3 px-2">Plan</th>
              <th className="text-left py-3 px-2">Customer</th>
              <th className="text-left py-3 px-2">Affiliate</th>
              <th className="text-right py-3 px-2">Amount</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Payment</th>
              <th className="text-left py-3 px-2">Date</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordersData?.orders?.map((order) => (
              <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="py-3 px-2 text-white font-mono">{order.orderId}</td>
                <td className="py-3 px-2 text-slate-300">
                  <div>
                    <div className="font-medium">{order.plan.description}</div>
                    <div className="text-xs text-slate-500">{order.plan.type}</div>
                  </div>
                </td>
                <td className="py-3 px-2 text-slate-300">
                  <div>
                    <div>{order.user.email}</div>
                    <div className="text-xs text-slate-500 font-mono">{order.user.wallet}</div>
                  </div>
                </td>
                <td className="py-3 px-2 text-slate-300">
                  {order.affiliate ? order.affiliate.name : '-'}
                </td>
                <td className="py-3 px-2 text-right text-green-400 font-semibold">
                  ${order.amount.toFixed(2)}
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-900 text-green-300' :
                    order.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                    order.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-3 px-2 text-slate-300 capitalize">
                  {order.paymentMethod?.replace('_', ' ') || '-'}
                </td>
                <td className="py-3 px-2 text-slate-300">
                  {order.timestamp}
                </td>
                <td className="py-3 px-2">
                  {order.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed', 'Approved by admin')}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled', 'Rejected by admin')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
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

// Contracts Panel Component
function ContractsPanel({ adminId }) {
  const [selectedContract, setSelectedContract] = useState(null);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Contracts Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Terms of Service</h3>
          <p className="text-sm text-slate-300 mb-4">
            Current version: 2.1 (Effective: Jan 2024)
          </p>
          <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
            View Document
          </button>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Privacy Policy</h3>
          <p className="text-sm text-slate-300 mb-4">
            Current version: 1.3 (Effective: Dec 2023)
          </p>
          <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
            View Document
          </button>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Trading Agreement</h3>
          <p className="text-sm text-slate-300 mb-4">
            Current version: 1.5 (Effective: Feb 2024)
          </p>
          <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
            View Document
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold text-white mb-4">Pending Signatures</h3>
        <div className="text-slate-400">
          No pending contracts to review
        </div>
      </div>
    </div>
  );
}

// Pending Enables Panel Component
function PendingEnablesPanel({ adminId }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Pending Account Enables</h2>

      <div className="text-slate-400">
        No pending account enables to review
      </div>
    </div>
  );
}

// Customers Panel Component
function CustomersPanel({ adminId }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Customer Management</h2>

      <div className="text-slate-400">
        Customer management features coming soon
      </div>
    </div>
  );
}

// Risk Panel Component
function RiskPanel({ adminId }) {
  const { data: tradesData } = useSWR('/api/orders?status=completed&limit=100', fetcher);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Risk Monitoring</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Open Positions</h3>
          <div className="text-2xl font-bold text-yellow-400">0</div>
          <p className="text-sm text-slate-400">Positions currently open</p>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">High Risk Accounts</h3>
          <div className="text-2xl font-bold text-red-400">0</div>
          <p className="text-sm text-slate-400">Accounts exceeding risk limits</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold text-white mb-4">Recent Risk Events</h3>
        <div className="text-slate-400">
          No recent risk events to display
        </div>
      </div>
    </div>
  );
}

// Reports Panel Component
function WithdrawalsPanel({ adminId }) {
  const { data: withdrawalsData, mutate } = useSWR('/api/withdrawals?limit=100', fetcher);

  const processWithdrawal = async (withdrawalId, newStatus) => {
    try {
      const response = await fetch('/api/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: withdrawalId,
          status: newStatus,
          adminId
        }),
      });

      if (response.ok) {
        mutate(); // Refresh data
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    }
  };

  const totalWithdrawn = withdrawalsData?.withdrawals
    ?.filter(w => w.status === 'completed')
    ?.reduce((sum, w) => sum + w.amount, 0) || 0;

  const pendingWithdrawals = withdrawalsData?.withdrawals
    ?.filter(w => w.status === 'pending').length || 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Withdrawal Reports</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Total Withdrawn</h3>
          <div className="text-2xl font-bold text-green-400">${totalWithdrawn.toFixed(2)}</div>
          <p className="text-sm text-slate-400">Completed withdrawals</p>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Pending Withdrawals</h3>
          <div className="text-2xl font-bold text-yellow-400">{pendingWithdrawals}</div>
          <p className="text-sm text-slate-400">Awaiting processing</p>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Platform Fees</h3>
          <div className="text-2xl font-bold text-blue-400">${(totalWithdrawn * 0.1).toFixed(2)}</div>
          <p className="text-sm text-slate-400">10% platform cut</p>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-600">
            <tr>
              <th className="text-left py-3 px-2">Trader</th>
              <th className="text-left py-3 px-2">Wallet</th>
              <th className="text-left py-3 px-2">Challenge</th>
              <th className="text-right py-3 px-2">Amount</th>
              <th className="text-right py-3 px-2">Platform Fee</th>
              <th className="text-right py-3 px-2">Trader Share</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Date</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawalsData?.withdrawals?.map((withdrawal) => (
              <tr key={withdrawal.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="py-3 px-2 text-white">{withdrawal.traderName || 'Demo Trader'}</td>
                <td className="py-3 px-2 text-slate-300 font-mono text-xs">
                  {withdrawal.wallet ? `${withdrawal.wallet.slice(0, 6)}...${withdrawal.wallet.slice(-4)}` : '-'}
                </td>
                <td className="py-3 px-2 text-slate-300">{withdrawal.challengeType || '1-Step'}</td>
                <td className="py-3 px-2 text-right text-white font-semibold">
                  ${withdrawal.amount.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right text-red-400">
                  ${(withdrawal.amount * 0.1).toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right text-green-400">
                  ${(withdrawal.amount * 0.8).toFixed(2)}
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    withdrawal.status === 'completed' ? 'bg-green-900 text-green-300' :
                    withdrawal.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                    withdrawal.status === 'processing' ? 'bg-blue-900 text-blue-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {withdrawal.status}
                  </span>
                </td>
                <td className="py-3 px-2 text-slate-300">
                  {dayjs(withdrawal.createdAt).tz('America/New_York').format('MM/DD/YYYY HH:mm')}
                </td>
                <td className="py-3 px-2">
                  {withdrawal.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => processWithdrawal(withdrawal.id, 'completed')}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                      >
                        Process
                      </button>
                      <button
                        onClick={() => processWithdrawal(withdrawal.id, 'cancelled')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
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
                  No withdrawal records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsPanel({ adminId }) {
  const { data: ordersData } = useSWR('/api/orders?limit=1000', fetcher);

  const totalRevenue = ordersData?.orders
    ?.filter(order => order.status === 'completed')
    ?.reduce((sum, order) => sum + order.amount, 0) || 0;

  const totalOrders = ordersData?.orders?.length || 0;
  const completedOrders = ordersData?.orders?.filter(order => order.status === 'completed').length || 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Reports & Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Total Revenue</h3>
          <div className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</div>
          <p className="text-sm text-slate-400">From completed orders</p>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Order Completion</h3>
          <div className="text-2xl font-bold text-blue-400">{completedOrders}/{totalOrders}</div>
          <p className="text-sm text-slate-400">Completed vs total orders</p>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Conversion Rate</h3>
          <div className="text-2xl font-bold text-purple-400">
            {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-sm text-slate-400">Order completion rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Plan Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">1-Step Challenge</span>
              <span className="text-green-400">65%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">2-Step Challenge</span>
              <span className="text-blue-400">35%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Top Affiliates</h3>
          <div className="text-slate-400 text-sm">
            Affiliate tracking coming soon
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return <AdminPageContent />;
}
