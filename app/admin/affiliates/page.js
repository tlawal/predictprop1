'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { fetcher } from '../lib/fetcher';

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Revoked', value: 'revoked' }
];

const STATUS_BADGES = {
  approved: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40',
  pending: 'bg-amber-500/10 text-amber-300 border border-amber-500/40',
  rejected: 'bg-rose-500/10 text-rose-300 border border-rose-500/40',
  revoked: 'bg-slate-600/20 text-slate-300 border border-slate-500/40'
};

const SORTABLE_COLUMNS = {
  created_at: 'Created',
  referrals_count: 'Referrals',
  current_tier: 'Tier'
};

const DEFAULT_LIMIT = 50;

export default function AffiliatesPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [editRowId, setEditRowId] = useState(null);
  const [editValues, setEditValues] = useState({ customName: '', notes: '' });
  const [pendingAction, setPendingAction] = useState(null);
  const [settings, setSettings] = useState({ autoApproveAffiliates: false, autoCreateContract: false });

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', `${DEFAULT_LIMIT}`);
    params.set('sort', sortField);
    params.set('direction', sortDirection);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (debouncedSearch) params.set('search', debouncedSearch);
    return `/api/affiliates?${params.toString()}`;
  }, [statusFilter, debouncedSearch, sortField, sortDirection]);

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, { revalidateOnFocus: false });

  useEffect(() => {
    if (data?.settings) {
      setSettings((prev) => ({
        ...prev,
        autoApproveAffiliates: data.settings.autoApproveAffiliates ?? prev.autoApproveAffiliates,
        autoCreateContract: data.settings.autoCreateContract ?? prev.autoCreateContract
      }));
    }
  }, [data?.settings]);

  const affiliates = data?.affiliates || [];
  const metrics = data?.metrics;

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }),
    []
  );

  const handleToggleSetting = async (key, value) => {
    const previous = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      const payload = { action: 'update_settings' };
      if (key === 'autoApproveAffiliates') payload.autoApproveAffiliates = value;
      if (key === 'autoCreateContract') payload.autoCreateContract = value;

      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Failed to update setting');
      }

      const body = await response.json();
      if (body.settings) {
        setSettings((prev) => ({
          ...prev,
          autoApproveAffiliates: body.settings.autoApproveAffiliates ?? prev.autoApproveAffiliates,
          autoCreateContract: body.settings.autoCreateContract ?? prev.autoCreateContract
        }));
      }

      toast.success('Settings updated');
      mutate();
    } catch (settingError) {
      setSettings((prev) => ({ ...prev, [key]: previous }));
      toast.error(settingError.message || 'Failed to update setting');
    }
  };

  const startEdit = (affiliate) => {
    setEditRowId(affiliate.id);
    setEditValues({ customName: affiliate.customName || '', notes: affiliate.notes || '' });
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setEditValues({ customName: '', notes: '' });
  };

  const saveEdit = async () => {
    if (!editRowId) return;

    try {
      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_fields',
          affiliateId: editRowId,
          customName: editValues.customName,
          notes: editValues.notes
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Failed to update affiliate');
      }

      toast.success('Affiliate details updated');
      cancelEdit();
      mutate();
    } catch (updateError) {
      toast.error(updateError.message || 'Failed to update affiliate');
    }
  };

  const openStatusModal = (type, affiliate) => {
    setPendingAction({ type, affiliate });
  };

  const handleStatusUpdate = async (status, affiliate, message) => {
    try {
      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          affiliateId: affiliate.id,
          status,
          message: message?.trim() || undefined
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Failed to update status');
      }

      toast.success(`Affiliate ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'revoked'}`);
      setPendingAction(null);
      mutate();
    } catch (statusError) {
      toast.error(statusError.message || 'Failed to update status');
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleRowClick = (affiliate) => {
    if (editRowId === affiliate.id) return;
    router.push(`/admin/affiliates/${affiliate.id}?userId=${affiliate.userId}`);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Affiliate Management</h1>
            <p className="text-sm text-gray-400">Approve contracts, adjust notes, and configure automation.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <SettingToggle
              label="Auto-approve affiliates"
              description="Automatically approve new affiliate applications"
              checked={settings.autoApproveAffiliates}
              onChange={(value) => handleToggleSetting('autoApproveAffiliates', value)}
            />
            <SettingToggle
              label="Auto-create contracts"
              description="Generate affiliate agreements upon approval"
              checked={settings.autoCreateContract}
              onChange={(value) => handleToggleSetting('autoCreateContract', value)}
            />
          </div>
        </div>
        {metrics && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Affiliates" value={metrics.totalAffiliates} accent="text-cyan-300" />
            <MetricCard title="Total Referrals" value={metrics.totalReferrals} accent="text-emerald-300" />
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
      </header>

      <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-gray-400">Filter</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-gray-400">Sort by</span>
              <select
                value={sortField}
                onChange={(event) => setSortField(event.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                {Object.entries(SORTABLE_COLUMNS).map(([value, label]) => (
                  <option key={value} value={value} className="bg-gray-900">
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="rounded bg-gray-800 px-2 py-1 text-xs font-medium text-gray-200 hover:bg-gray-700"
              >
                {sortDirection === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-gray-400">Search</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, code, or ID"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            Failed to load affiliates.
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800 text-sm">
            <thead className="bg-gray-900/70 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <SortableHeader
                  label="Affiliate"
                  onClick={() => toggleSort('created_at')}
                  indicator={renderSortIndicator('created_at')}
                />
                <th className="px-4 py-3 text-left">Custom Label</th>
                <SortableHeader
                  label="Tier"
                  onClick={() => toggleSort('current_tier')}
                  indicator={renderSortIndicator('current_tier')}
                />
                <th className="px-4 py-3 text-left">Notes</th>
                <SortableHeader
                  label="Referrals"
                  onClick={() => toggleSort('referrals_count')}
                  indicator={renderSortIndicator('referrals_count')}
                  align="right"
                />
                <th className="px-4 py-3 text-right">Pending Payout</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {affiliates.map((affiliate) => (
                <Fragment key={affiliate.id}>
                  <tr
                    className="cursor-pointer transition hover:bg-gray-900/40"
                    onClick={() => handleRowClick(affiliate)}
                  >
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (affiliate.userId) {
                            router.push(`/admin/customers/${affiliate.userId}`);
                          }
                        }}
                        className="text-left text-white hover:underline"
                      >
                        {affiliate.customerName || affiliate.email || 'Unnamed'}
                      </button>
                      <div className="text-xs text-gray-400">{affiliate.email || 'No email'}</div>
                      <div className="text-xs text-gray-500">{affiliate.affiliateCode}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-200">{affiliate.customName || '—'}</td>
                    <td className="px-4 py-3 align-top">
                      <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium uppercase tracking-wide text-indigo-200">
                        {affiliate.tier.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-400">
                      {affiliate.notes ? affiliate.notes.slice(0, 90) + (affiliate.notes.length > 90 ? '…' : '') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right align-top text-gray-200">{affiliate.totals.referrals}</td>
                    <td className="px-4 py-3 text-right align-top text-gray-200">
                      {currencyFormatter.format(affiliate.totals.pendingPayout || 0)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs capitalize ${
                          STATUS_BADGES[affiliate.contractStatus] || 'bg-slate-600/30 text-slate-200 border border-slate-500/30'
                        }`}
                      >
                        {affiliate.contractStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            startEdit(affiliate);
                          }}
                          className="rounded bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/admin/affiliates/${affiliate.id}?userId=${affiliate.userId}`);
                          }}
                          className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                        >
                          Details
                        </button>
                        {affiliate.contractStatus !== 'approved' && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openStatusModal('approved', affiliate);
                            }}
                            className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                        )}
                        {affiliate.contractStatus === 'pending' && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openStatusModal('rejected', affiliate);
                            }}
                            className="rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500"
                          >
                            Reject
                          </button>
                        )}
                        {affiliate.contractStatus === 'approved' && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openStatusModal('revoked', affiliate);
                            }}
                            className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editRowId === affiliate.id && (
                    <tr className="bg-gray-900/60">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-gray-400">Custom Name</label>
                            <input
                              value={editValues.customName}
                              onChange={(event) => setEditValues((prev) => ({ ...prev, customName: event.target.value }))}
                              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                              placeholder="Custom affiliate label"
                            />
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                            <label className="text-xs uppercase tracking-wide text-gray-400">Notes</label>
                            <textarea
                              rows={3}
                              value={editValues.notes}
                              onChange={(event) => setEditValues((prev) => ({ ...prev, notes: event.target.value }))}
                              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                              placeholder="Internal notes about this affiliate"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 lg:col-span-2">
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                            >
                              Save changes
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!affiliates.length && !isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">
                    No affiliates match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {isLoading && (
            <div className="px-4 py-4 text-sm text-gray-400">Loading affiliates…</div>
          )}
        </div>
      </section>

      {pendingAction && (
        <StatusActionModal
          key={`${pendingAction.type}-${pendingAction.affiliate.id}`}
          action={pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={(message) => handleStatusUpdate(pendingAction.type, pendingAction.affiliate, message)}
        />
      )}
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="relative inline-flex h-6 w-11 items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="peer sr-only"
          />
          <span className="h-3 w-full rounded-full bg-gray-600 peer-checked:bg-emerald-600"></span>
          <span className="absolute left-0 h-5 w-5 -translate-y-1/2 rounded-full bg-gray-300 transition peer-checked:translate-x-5 peer-checked:bg-white" style={{ top: '50%' }}></span>
        </span>
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </label>
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

function SortableHeader({ label, onClick, indicator, align = 'left' }) {
  return (
    <th className={`px-4 py-3 text-${align} select-none`}> 
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-400 hover:text-white"
      >
        {label}
        {indicator && <span>{indicator}</span>}
      </button>
    </th>
  );
}

function StatusActionModal({ action, onClose, onConfirm }) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage('');
  }, [action?.affiliate?.id, action?.type]);

  if (!action) return null;

  const titles = {
    approved: 'Approve affiliate',
    rejected: 'Reject affiliate',
    revoked: 'Revoke affiliate'
  };

  const descriptions = {
    approved: 'Optionally include a message to send with the approval notice.',
    rejected: 'Share a reason for rejection. The affiliate will receive this message.',
    revoked: 'Explain why the affiliate contract is being revoked.'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">{titles[action.type]}</h2>
        <p className="mt-1 text-sm text-gray-400">{descriptions[action.type]}</p>

        <div className="mt-4 space-y-2">
          <label className="text-xs uppercase tracking-wide text-gray-500">
            Message to affiliate (optional)
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            placeholder="Provide context for this decision"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(message)}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
