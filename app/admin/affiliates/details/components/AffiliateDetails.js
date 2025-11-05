'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import TiersTable from './TiersTable';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

export default function AffiliateDetails({
  affiliate,
  tiers,
  customUrlValue,
  onCustomUrlChange,
  onCustomUrlSave,
  onCustomUrlReset,
  customUrlSaving,
  isCustomUrlDirty,
  onEditClick,
  onManualCommissionClick
}) {
  const totals = affiliate?.totals || {};

  const metrics = useMemo(
    () => [
      {
        label: 'Total Commissions Earned',
        value: currencyFormatter.format(totals.totalCommissionsEarned || 0)
      },
      {
        label: 'Total Paid Out',
        value: currencyFormatter.format(totals.totalPaidOut || 0)
      },
      {
        label: 'Available Payout',
        value: currencyFormatter.format(totals.availablePayout || 0)
      },
      {
        label: 'Revenue Generated',
        value: currencyFormatter.format(totals.revenueGenerated || 0)
      },
      {
        label: 'Indirect Revenue',
        value: currencyFormatter.format(totals.indirectRevenueGenerated || 0)
      },
      {
        label: 'Next Withdrawal',
        value: totals.nextAvailableWithdrawalDate
          ? dayjs(totals.nextAvailableWithdrawalDate).format('MMM D, YYYY')
          : '—'
      }
    ],
    [totals]
  );

  const referralUrls = affiliate?.referralUrls || {};

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-xl border border-gray-700 bg-gray-900/70 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{affiliate.customName || affiliate.name || affiliate.affiliateCode}</h1>
          <p className="text-sm text-gray-400">
            Affiliate code: <span className="text-indigo-300">{affiliate.affiliateCode}</span>
          </p>
          {affiliate.customer?.id && (
            <p className="text-sm text-gray-400">
              Customer:&nbsp;
              <Link
                href={`/admin/customers/${affiliate.customer.id}`}
                className="text-indigo-300 hover:text-indigo-200"
              >
                {affiliate.customer.customerNumber || affiliate.customer.fullName || affiliate.customer.email || affiliate.customer.id}
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onManualCommissionClick}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Manual Affiliate Commission
          </button>
          <button
            type="button"
            onClick={onEditClick}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Edit Settings
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <InfoCard title="Contact & Payment">
          <InfoRow label="Payout Email" value={affiliate.payoutEmail || '—'} />
          <InfoRow label="Website" value={affiliate.websiteUrl || '—'} isLink />
          <InfoRow label="Auto Withdraw Email" value={affiliate.autoWithdrawEmail || '—'} />
          <InfoRow label="Promotion Method" value={affiliate.promotionMethod || '—'} />
          <InfoRow label="Promotion Info" value={affiliate.promotionInfo || '—'} multiLine />
        </InfoCard>

        <InfoCard title="Performance & Contract">
          <InfoRow label="Current Tier" value={affiliate.currentTier || '—'} />
          <InfoRow label="Referrals" value={affiliate.referralsCount ?? 0} />
          <InfoRow label="Contract Status" value={affiliate.contractStatus || '—'} />
          <InfoRow label="Withdrawal Delay" value={`${affiliate.withdrawalDelay ?? 0} days`} />
          <InfoRow label="Withdrawal Threshold" value={currencyFormatter.format(affiliate.withdrawalThreshold || 0)} />
        </InfoCard>
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Referral Links</h2>
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-gray-500">Default URL</span>
            <code className="break-all rounded bg-gray-800 px-3 py-2 text-sm text-gray-200">{referralUrls.defaultUrl}</code>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-500">Custom URL</label>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                value={customUrlValue}
                onChange={(event) => onCustomUrlChange(event.target.value)}
                placeholder="Enter custom slug (optional)"
                className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCustomUrlSave}
                  disabled={!isCustomUrlDirty || customUrlSaving}
                  className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {customUrlSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={onCustomUrlReset}
                  disabled={!isCustomUrlDirty || customUrlSaving}
                  className="rounded bg-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Result:&nbsp;
              <code className="break-all text-gray-300">
                {customUrlValue ? `${referralUrls.defaultUrl?.split('/?')[0]}/${customUrlValue}` : referralUrls.defaultUrl}
              </code>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Tier Ladder</h2>
        <div className="mt-4 overflow-x-auto">
          <TiersTable tiers={tiers} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-900/70 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          <span className="text-xs uppercase tracking-wide text-gray-500">Linked for manual commissions</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800 text-sm">
            <thead className="bg-gray-900/80 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-2 text-left">Order</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(affiliate.recentOrders || []).length ? (
                affiliate.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-2 text-gray-200">{order.orderRef}</td>
                    <td className="px-4 py-2 text-right text-gray-200">{currencyFormatter.format(order.amount || 0)}</td>
                    <td className="px-4 py-2 text-gray-400 uppercase">{order.status || 'unknown'}</td>
                    <td className="px-4 py-2 text-gray-400">{order.createdAt ? dayjs(order.createdAt).format('MMM D, YYYY h:mm A') : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                    No recent orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/70 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/70 p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, isLink = false, multiLine = false }) {
  const display = value || '—';
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      {isLink && value ? (
        <Link href={value} target="_blank" rel="noreferrer" className="text-sm text-indigo-300 hover:text-indigo-200">
          {value}
        </Link>
      ) : (
        <p className={`text-sm text-gray-200 ${multiLine ? 'whitespace-pre-wrap' : ''}`}>{display}</p>
      )}
    </div>
  );
}
