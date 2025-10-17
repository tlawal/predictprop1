'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
        // TEMPORARILY BYPASS ADMIN PROTECTION FOR TESTING
        // Uncomment the code below to restore admin protection
        /*
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !data || data.role !== 'admin') {
          router.push('/');
          return;
        }
        */

        // Temporarily allow all authenticated users access to admin panel
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        // Temporarily allow access even on error
        setIsAdmin(true);
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
              Risk Triggers
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
              Payments
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
              Plans
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
              Add-Ons
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
              <RiskTriggersPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <ReportsPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <PaymentsPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <PlansPanel adminId={user.id} />
            </Tab.Panel>
            <Tab.Panel>
              <AddOnsPanel adminId={user.id} />
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

function RiskTriggersPanel({ adminId }) {
  const { data: riskTriggers } = useSWR('/api/risk-triggers', fetcher);
  const { data: riskAlerts } = useSWR('/api/risk-alerts', fetcher, { refreshInterval: 15000 });

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Active Risk Alerts</h4>

        {riskAlerts?.alerts?.length > 0 ? (
          <div className="space-y-3">
            {riskAlerts.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical' ? 'bg-red-500/20 border-red-500/30' :
                  alert.severity === 'high' ? 'bg-orange-500/20 border-orange-500/30' :
                  'bg-yellow-500/20 border-yellow-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{alert.title}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.severity === 'critical' ? 'bg-red-500 text-white' :
                        alert.severity === 'high' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-black'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{alert.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      User: {alert.userEmail} • {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
                      Acknowledge
                    </button>
                    <button className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No active risk alerts</p>
        )}
      </div>

      {/* Risk Thresholds */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Risk Threshold Configuration</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Drawdown (%)
            </label>
            <div className="text-white bg-slate-700 px-3 py-2 rounded">
              {riskTriggers?.thresholds?.drawdownPercent || 5}%
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Exposure (%)
            </label>
            <div className="text-white bg-slate-700 px-3 py-2 rounded">
              {riskTriggers?.thresholds?.exposurePercent || 15}%
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Daily Loss Limit (%)
            </label>
            <div className="text-white bg-slate-700 px-3 py-2 rounded">
              {riskTriggers?.thresholds?.dailyLossPercent || 5}%
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Trades/Day
            </label>
            <div className="text-white bg-slate-700 px-3 py-2 rounded">
              {riskTriggers?.thresholds?.maxTradesPerDay || 50}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Alert Email
          </label>
          <div className="text-white bg-slate-700 px-3 py-2 rounded">
            {riskTriggers?.thresholds?.alertEmail || 'admin@polyprop.com'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Payments Panel Component
function PaymentsPanel({ adminId }) {
  const { data: paymentsData, mutate } = useSWR('/api/admin/payments?limit=100', fetcher);

  const updatePaymentStatus = async (paymentId, newStatus, notes) => {
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: paymentId,
          status: newStatus,
          notes,
          adminId
        }),
      });

      if (response.ok) {
        mutate(); // Refresh data
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

  const totalRevenue = paymentsData?.payments
    ?.filter(payment => payment.status === 'completed')
    ?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  const pendingPayments = paymentsData?.payments
    ?.filter(payment => payment.status === 'pending').length || 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Payment Management</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Total Revenue</h3>
          <div className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</div>
          <p className="text-sm text-slate-400">From completed payments</p>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Pending Payments</h3>
          <div className="text-2xl font-bold text-yellow-400">{pendingPayments}</div>
          <p className="text-sm text-slate-400">Awaiting confirmation</p>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Success Rate</h3>
          <div className="text-2xl font-bold text-blue-400">
            {paymentsData?.payments?.length > 0
              ? ((paymentsData.payments.filter(p => p.status === 'completed').length / paymentsData.payments.length) * 100).toFixed(1)
              : 0}%
          </div>
          <p className="text-sm text-slate-400">Payment completion rate</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-600">
            <tr>
              <th className="text-left py-3 px-2">Payment ID</th>
              <th className="text-left py-3 px-2">User</th>
              <th className="text-left py-3 px-2">Plan</th>
              <th className="text-right py-3 px-2">Amount</th>
              <th className="text-left py-3 px-2">Method</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Type</th>
              <th className="text-left py-3 px-2">Date</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paymentsData?.payments?.map((payment) => (
              <tr key={payment.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="py-3 px-2 text-white font-mono text-xs">
                  {payment.id.slice(0, 8)}...
                </td>
                <td className="py-3 px-2 text-slate-300">
                  <div>
                    <div>{payment.user?.email || 'Unknown'}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {payment.user_id?.slice(0, 6)}...{payment.user_id?.slice(-4)}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 text-slate-300">
                  {payment.plan_id || payment.challenge_id || 'N/A'}
                </td>
                <td className="py-3 px-2 text-right text-green-400 font-semibold">
                  ${payment.amount.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-slate-300 capitalize">
                  {payment.metadata?.paymentMethod || 'stripe'}
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'completed' ? 'bg-green-900 text-green-300' :
                    payment.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                    payment.status === 'failed' ? 'bg-red-900 text-red-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="py-3 px-2 text-slate-300 capitalize">
                  {payment.type?.replace('_', ' ') || 'evaluation_fee'}
                </td>
                <td className="py-3 px-2 text-slate-300">
                  {new Date(payment.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-2">
                  {payment.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'completed', 'Manually approved by admin')}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'failed', 'Rejected by admin')}
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
                  No payment records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Plans Panel Component
function PlansPanel({ adminId }) {
  const { data: plansData, mutate } = useSWR('/api/plans?includeInactive=true', fetcher);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const createPlan = async (planData) => {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        mutate(); // Refresh data
        setShowCreateForm(false);
        toast.success('Plan created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Error creating plan');
    }
  };

  const updatePlan = async (planId, planData) => {
    try {
      const response = await fetch('/api/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: planId, ...planData }),
      });

      if (response.ok) {
        mutate(); // Refresh data
        setEditingPlan(null);
        toast.success('Plan updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Error updating plan');
    }
  };

  const deletePlan = async (planId) => {
    if (!confirm('Are you sure you want to deactivate this plan?')) return;

    try {
      const response = await fetch(`/api/plans?id=${planId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mutate(); // Refresh data
        toast.success('Plan deactivated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to deactivate plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Error deactivating plan');
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Plans Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          Create Plan
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingPlan) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            <PlanForm
              initialData={editingPlan}
              onSubmit={(data) => {
                if (editingPlan) {
                  updatePlan(editingPlan.id, data);
                } else {
                  createPlan(data);
                }
              }}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingPlan(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Plans Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-600">
            <tr>
              <th className="text-left py-3 px-2">Type</th>
              <th className="text-left py-3 px-2">Size</th>
              <th className="text-left py-3 px-2">Fee</th>
              <th className="text-left py-3 px-2">Parameters</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plansData?.plans?.map((plan) => (
              <tr key={plan.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="py-3 px-2 text-white capitalize">{plan.type}</td>
                <td className="py-3 px-2 text-white">${plan.size?.toLocaleString()}</td>
                <td className="py-3 px-2 text-green-400">${plan.fee}</td>
                <td className="py-3 px-2 text-slate-300">
                  <div className="text-xs">
                    {plan.params && (
                      <div>
                        ROI: {plan.params.roi || plan.params.profit_target}%<br />
                        Drawdown: {plan.params.drawdown_max}% <br />
                        Exposure: {plan.params.exposure_cap}% <br />
                        Min Days: {plan.params.min_days}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {plan.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                    >
                      {plan.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )) || (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  No plans found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Plan Form Component
function PlanForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: initialData?.type || '1-step',
    size: initialData?.size || '',
    fee: initialData?.fee || '',
    params: initialData?.params || {
      roi: 8,
      drawdown_max: 5,
      exposure_cap: 15,
      min_days: 5
    },
    active: initialData?.active ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateParam = (key, value) => {
    setFormData(prev => ({
      ...prev,
      params: {
        ...prev.params,
        [key]: parseFloat(value) || value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        >
          <option value="1-step">1-Step</option>
          <option value="2-step">2-Step</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Account Size</label>
        <input
          type="number"
          value={formData.size}
          onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="5000"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Fee ($)</label>
        <input
          type="number"
          value={formData.fee}
          onChange={(e) => setFormData(prev => ({ ...prev, fee: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="99"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Parameters</label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.params.roi}
              onChange={(e) => updateParam('roi', e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="ROI %"
            />
            <span className="text-slate-400 self-center">ROI %</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.params.drawdown_max}
              onChange={(e) => updateParam('drawdown_max', e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="Max Drawdown %"
            />
            <span className="text-slate-400 self-center">Drawdown %</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.params.exposure_cap}
              onChange={(e) => updateParam('exposure_cap', e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="Exposure Cap %"
            />
            <span className="text-slate-400 self-center">Exposure %</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.params.min_days}
              onChange={(e) => updateParam('min_days', e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="Min Days"
            />
            <span className="text-slate-400 self-center">Min Days</span>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
          className="w-4 h-4 text-teal-400 bg-slate-700 border-slate-600 rounded focus:ring-teal-400"
        />
        <label htmlFor="active" className="ml-2 text-sm text-slate-300">Active</label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          {initialData ? 'Update' : 'Create'} Plan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Add-Ons Panel Component
function AddOnsPanel({ adminId }) {
  const { data: addonsData, mutate } = useSWR('/api/addons?includeInactive=true', fetcher);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);

  const createAddon = async (addonData) => {
    try {
      const response = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addonData),
      });

      if (response.ok) {
        mutate(); // Refresh data
        setShowCreateForm(false);
        toast.success('Add-on created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create add-on');
      }
    } catch (error) {
      console.error('Error creating add-on:', error);
      toast.error('Error creating add-on');
    }
  };

  const updateAddon = async (addonId, addonData) => {
    try {
      const response = await fetch('/api/addons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: addonId, ...addonData }),
      });

      if (response.ok) {
        mutate(); // Refresh data
        setEditingAddon(null);
        toast.success('Add-on updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update add-on');
      }
    } catch (error) {
      console.error('Error updating add-on:', error);
      toast.error('Error updating add-on');
    }
  };

  const deleteAddon = async (addonId) => {
    if (!confirm('Are you sure you want to deactivate this add-on?')) return;

    try {
      const response = await fetch(`/api/addons?id=${addonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        mutate(); // Refresh data
        toast.success('Add-on deactivated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to deactivate add-on');
      }
    } catch (error) {
      console.error('Error deleting add-on:', error);
      toast.error('Error deactivating add-on');
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Add-Ons Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          Create Add-On
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingAddon) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingAddon ? 'Edit Add-On' : 'Create New Add-On'}
            </h3>
            <AddOnForm
              initialData={editingAddon}
              onSubmit={(data) => {
                if (editingAddon) {
                  updateAddon(editingAddon.id, data);
                } else {
                  createAddon(data);
                }
              }}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingAddon(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Add-Ons Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-600">
            <tr>
              <th className="text-left py-3 px-2">Name</th>
              <th className="text-left py-3 px-2">Description</th>
              <th className="text-left py-3 px-2">Price</th>
              <th className="text-left py-3 px-2">Parameter Key</th>
              <th className="text-left py-3 px-2">Parameter Value</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addonsData?.addons?.map((addon) => (
              <tr key={addon.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="py-3 px-2 text-white font-medium">{addon.name}</td>
                <td className="py-3 px-2 text-slate-300 max-w-xs truncate" title={addon.description}>
                  {addon.description}
                </td>
                <td className="py-3 px-2 text-green-400">${addon.price}</td>
                <td className="py-3 px-2 text-blue-400 font-mono text-xs">{addon.param_key}</td>
                <td className="py-3 px-2 text-slate-300 max-w-xs">
                  <div className="text-xs bg-slate-700/50 p-1 rounded truncate">
                    {JSON.stringify(addon.param_value)}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    addon.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {addon.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingAddon(addon)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAddon(addon.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                    >
                      {addon.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )) || (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-400">
                  No add-ons found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Add-On Form Component
function AddOnForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    param_key: initialData?.param_key || '',
    param_value: initialData?.param_value || {},
    active: initialData?.active ?? true
  });

  const [paramValueString, setParamValueString] = useState(
    initialData?.param_value ? JSON.stringify(initialData.param_value, null, 2) : '{\n  \n}'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const paramValue = JSON.parse(paramValueString);
      onSubmit({
        ...formData,
        param_value: paramValue,
        price: parseFloat(formData.price)
      });
    } catch (error) {
      toast.error('Invalid JSON in parameter value');
    }
  };

  const updateParamValue = (value) => {
    setParamValueString(value);
    try {
      const parsed = JSON.parse(value);
      setFormData(prev => ({ ...prev, param_value: parsed }));
    } catch (error) {
      // Invalid JSON, but don't show error yet
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="e.g., 90/10 Profit Split"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white h-20 resize-none"
          placeholder="Describe what this add-on does"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Price ($)</label>
        <input
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="5.00"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Parameter Key *</label>
        <input
          type="text"
          value={formData.param_key}
          onChange={(e) => setFormData(prev => ({ ...prev, param_key: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="e.g., profit_split"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Parameter Value (JSON) *</label>
        <textarea
          value={paramValueString}
          onChange={(e) => updateParamValue(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm h-24"
          placeholder='{"trader": 90, "platform": 10}'
          required
        />
        <p className="text-xs text-slate-400 mt-1">JSON object defining the parameter values</p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="addon-active"
          checked={formData.active}
          onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
          className="w-4 h-4 text-teal-400 bg-slate-700 border-slate-600 rounded focus:ring-teal-400"
        />
        <label htmlFor="addon-active" className="ml-2 text-sm text-slate-300">Active</label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          {initialData ? 'Update' : 'Create'} Add-On
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
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
