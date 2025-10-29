'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { fetcher } from '../lib/fetcher';

const statusBadges = {
  approved: 'bg-green-900/60 text-green-300',
  pending: 'bg-yellow-900/60 text-yellow-300',
  rejected: 'bg-red-900/60 text-red-300',
  paused: 'bg-slate-700 text-slate-300'
};

const commissionStatusBadges = {
  pending: 'bg-yellow-900/60 text-yellow-300',
  paid: 'bg-green-900/60 text-green-300',
  cancelled: 'bg-red-900/60 text-red-300'
};

export default function AffiliatesPage() {
  const { user } = useUser();
  const adminId = user?.id;
  const { data, error, isLoading, mutate } = useSWR(adminId ? '/api/admin/affiliates?limit=50' : null, fetcher, {
    revalidateOnFocus: false
  });

  const affiliates = data?.affiliates || [];
  const metrics = data?.metrics;
  const pagination = data?.pagination;

  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null);
  const [manualForm, setManualForm] = useState({
    amount: '',
    status: 'pending',
    notes: '',
    orderId: ''
  });

  useEffect(() => {
    if (!affiliates.length) {
      setSelectedAffiliateId(null);
      return;
    }
    if (!selectedAffiliateId || !affiliates.find((affiliate) => affiliate.id === selectedAffiliateId)) {
      setSelectedAffiliateId(affiliates[0].id);
      setManualForm({ amount: '', status: 'pending', notes: '', orderId: '' });
    }
  }, [affiliates, selectedAffiliateId]);

  const selectedAffiliate = useMemo(
    () => affiliates.find((affiliate) => affiliate.id === selectedAffiliateId) || null,
    [affiliates, selectedAffiliateId]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }),
    []
  );

  const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  };

  const handleManualCommissionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAffiliate) {
      toast.error('Select an affiliate first');
      return;
    }
    const amountValue = Number(manualForm.amount);
    if (!amountValue || Number.isNaN(amountValue) || amountValue <= 0) {
      toast.error('Enter a valid commission amount');
      return;
    }
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: selectedAffiliate.id,
          amount: amountValue,
          status: manualForm.status,
          notes: manualForm.notes?.trim() || undefined,
          orderId: manualForm.orderId?.trim() || undefined
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Failed to create commission' }));
        throw new Error(payload.error || payload.message || 'Failed to create commission');
      }
      toast.success('Manual commission recorded');
      setManualForm({ amount: '', status: 'pending', notes: '', orderId: '' });
      mutate();
    } catch (submissionError) {
      toast.error(submissionError.message || 'Failed to create commission');
    }
  };

  const handleCommissionStatusChange = async (commissionId, nextStatus) => {
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId, status: nextStatus })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Failed to update commission' }));
        throw new Error(payload.error || payload.message || 'Failed to update commission');
      }
      toast.success(`Commission marked as ${nextStatus}`);
      mutate();
    } catch (statusError) {
      toast.error(statusError.message || 'Failed to update commission');
    }
  };

  if (!adminId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Affiliate Partners</h2>
          {pagination && (
            <span className="text-sm text-gray-400">
              Showing {affiliates.length} of {pagination.total}
            </span>
          )}
        </div>
        {error && <div className="mt-4 rounded bg-red-900/40 px-4 py-3 text-sm text-red-200">Failed to load affiliates.</div>}
        {isLoading && !affiliates.length && (
          <div className="mt-4 text-sm text-gray-400">Loading affiliates...</div>
        )}
        {metrics && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Affiliates" value={metrics.totalAffiliates} accent="text-cyan-300" />
            <MetricCard
              title="Total Referrals"
              value={metrics.totalReferrals}
              accent="text-emerald-300"
            />
            <MetricCard
              title="Total Earned"
              value={currencyFormatter.format(metrics.totalEarned || 0)}
              accent="text-amber-300"
            />
            <MetricCard
              title="Pending Payout"
              value={currencyFormatter.format(metrics.totalPendingPayout || 0)}
              accent="text-rose-300"
            />
          </div>
        )}
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700 text-sm">
            <thead className="bg-gray-900/70 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Affiliate</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-right">Total Earned</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Referrals</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {affiliates.map((affiliate) => (
                <tr
                  key={affiliate.id}
                  className={
                    selectedAffiliateId === affiliate.id
                      ? 'bg-gray-900/60 hover:bg-gray-900/60'
                      : 'hover:bg-gray-900/30'
                  }
                >
                  <td className="px-4 py-3">
                    <div className="text-white">{affiliate.customName || affiliate.affiliateCode}</div>
                    <div className="text-xs text-gray-400">{affiliate.email || 'No email'}</div>
                    <div className="text-xs text-gray-500">{affiliate.affiliateCode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-900/40 px-2 py-1 text-xs capitalize text-blue-200">
                      {affiliate.tier.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-200">
                    {currencyFormatter.format(affiliate.totals.totalEarned || 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-200">
                    {currencyFormatter.format(affiliate.totals.pendingPayout || 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-200">{affiliate.totals.referrals}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs capitalize ${
                        statusBadges[affiliate.contractStatus] || 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {affiliate.contractStatus || 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedAffiliateId(affiliate.id)}
                      className="rounded bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!affiliates.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">
                    {isLoading ? 'Loading affiliates...' : 'No affiliates found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAffiliate && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedAffiliate.customName || selectedAffiliate.affiliateCode}</h3>
                  <div className="text-xs text-gray-400">{selectedAffiliate.email || 'No email on file'}</div>
                  <div className="text-xs text-gray-500">Affiliate ID: {selectedAffiliate.affiliateCode}</div>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-blue-900/40 px-3 py-1 text-xs capitalize text-blue-200">
                    {selectedAffiliate.tier.label}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs capitalize ${
                      statusBadges[selectedAffiliate.contractStatus] || 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {selectedAffiliate.contractStatus || 'unknown'}
                  </span>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailMetric
                  label="Total Referrals"
                  value={selectedAffiliate.totals.referrals}
                  hint={`Active: ${selectedAffiliate.totals.activeReferrals}`}
                />
                <DetailMetric
                  label="Total Earned"
                  value={currencyFormatter.format(selectedAffiliate.totals.totalEarned || 0)}
                />
                <DetailMetric
                  label="Pending Payout"
                  value={currencyFormatter.format(selectedAffiliate.totals.pendingPayout || 0)}
                />
                <DetailMetric
                  label="Manual Awards"
                  value={currencyFormatter.format(selectedAffiliate.totals.manualCommissionTotal || 0)}
                />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoField label="Payout Email" value={selectedAffiliate.payoutEmail || '—'} />
                <InfoField label="Auto Withdraw Email" value={selectedAffiliate.autoWithdrawEmail || '—'} />
                <InfoField label="Withdrawal Threshold" value={selectedAffiliate.withdrawalThreshold || '—'} />
                <InfoField label="Withdrawal Delay" value={selectedAffiliate.withdrawalDelay || '—'} />
              </div>
              {selectedAffiliate.notes && (
                <div className="mt-4 rounded border border-gray-700 bg-gray-900/60 px-4 py-3 text-sm text-gray-300">
                  {selectedAffiliate.notes}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
              <h4 className="text-lg font-semibold text-white">Recent Commissions</h4>
              <div className="mt-4 space-y-3">
                {selectedAffiliate.recentCommissions?.length ? (
                  selectedAffiliate.recentCommissions.map((commission) => (
                    <div
                      key={commission.id}
                      className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="text-sm text-white">
                          {currencyFormatter.format(commission.amount || 0)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDateTime(commission.createdAt)}
                          {commission.orderId && ` • Order ${commission.orderId}`}
                        </div>
                        {commission.note && (
                          <div className="text-xs text-gray-500">{commission.note}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs capitalize ${
                            commissionStatusBadges[commission.status] || 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {commission.manual ? `${commission.status} • manual` : commission.status}
                        </span>
                        {commission.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCommissionStatusChange(commission.id, 'paid')}
                              className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                            >
                              Mark Paid
                            </button>
                            <button
                              onClick={() => handleCommissionStatusChange(commission.id, 'cancelled')}
                              className="rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded border border-dashed border-gray-700 px-4 py-6 text-sm text-gray-400">
                    No commissions recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
              <h4 className="text-lg font-semibold text-white">Recent Referrals</h4>
              <div className="mt-4 space-y-3">
                {selectedAffiliate.recentReferrals?.length ? (
                  selectedAffiliate.recentReferrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="text-sm text-white">{referral.email || 'Unknown contact'}</div>
                        <div className="text-xs text-gray-400">{formatDateTime(referral.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">Level {referral.level}</span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs capitalize ${
                            referral.status === 'paid'
                              ? 'bg-emerald-900/60 text-emerald-200'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {referral.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded border border-dashed border-gray-700 px-4 py-6 text-sm text-gray-400">
                    No referral activity yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
              <h4 className="text-lg font-semibold text-white">Record Manual Commission</h4>
              <form className="mt-4 space-y-4" onSubmit={handleManualCommissionSubmit}>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-400">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualForm.amount}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, amount: event.target.value }))}
                    className="mt-1 w-full rounded border border-gray-700 bg-gray-900/80 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter USD amount"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-400">Status</label>
                  <select
                    value={manualForm.status}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="mt-1 w-full rounded border border-gray-700 bg-gray-900/80 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-400">Related Order</label>
                  <input
                    type="text"
                    value={manualForm.orderId}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, orderId: event.target.value }))}
                    className="mt-1 w-full rounded border border-gray-700 bg-gray-900/80 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Optional order identifier"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-400">Notes</label>
                  <textarea
                    rows={3}
                    value={manualForm.notes}
                    onChange={(event) => setManualForm((prev) => ({ ...prev, notes: event.target.value }))}
                    className="mt-1 w-full rounded border border-gray-700 bg-gray-900/80 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Optional notes for audit trail"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
                >
                  Create Commission
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
              <h4 className="text-lg font-semibold text-white">Activity Overview</h4>
              <dl className="mt-4 space-y-3">
                <ActivityItem label="Last Referral" value={formatDateTime(selectedAffiliate.totals.lastReferralAt)} />
                <ActivityItem label="Last Commission" value={formatDateTime(selectedAffiliate.totals.lastCommissionAt)} />
                <ActivityItem label="Created" value={formatDateTime(selectedAffiliate.metadata.createdAt)} />
                <ActivityItem label="Updated" value={formatDateTime(selectedAffiliate.metadata.updatedAt)} />
                <ActivityItem
                  label="Custom URL"
                  value={selectedAffiliate.customUrl ? `https://polyprop.com/${selectedAffiliate.customUrl}` : '—'}
                />
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, accent }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-5">
      <div className="text-xs uppercase tracking-wide text-gray-400">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function DetailMetric({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-sm text-gray-200">{value}</div>
    </div>
  );
}

function ActivityItem({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
}
