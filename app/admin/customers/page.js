'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { fetcher } from '../lib/fetcher';
import AffiliateEditModal from './components/AffiliateEditModal';

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPropAccountModalOpen, setIsPropAccountModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
  const [isCompetitionModalOpen, setIsCompetitionModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const apiKey = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' });
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    return `/api/customers?${params.toString()}`;
  }, [debouncedSearch]);

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR(apiKey, fetcher, {
    revalidateOnFocus: false
  });

  const customers = useMemo(() => data?.customers || [], [data]);

  useEffect(() => {
    if (!customers.length) {
      setSelectedCustomerId(null);
      return;
    }
    if (!selectedCustomerId || !customers.find((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const [noteText, setNoteText] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [propPlanType, setPropPlanType] = useState('1-step');
  const [propBalance, setPropBalance] = useState('0');
  const [propStatus, setPropStatus] = useState('active');
  const [propParams, setPropParams] = useState('{}');
  const [competitionId, setCompetitionId] = useState('');
  const [competitionOptions, setCompetitionOptions] = useState([]);
  const [competitionsLoading, setCompetitionsLoading] = useState(false);

  const verifiedChipClass = (verified) =>
    verified ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30';

  const handleCustomerUpdate = async (payload) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Customer update failed');
      }
      await mutate();
      return true;
    } catch (requestError) {
      toast.error(requestError.message || 'Customer update failed');
      return false;
    }
  };

  const handleToggleVerified = async () => {
    if (!selectedCustomer) return;
    const success = await handleCustomerUpdate({
      action: 'toggle_verified',
      id: selectedCustomer.id,
      verified: !selectedCustomer.verified
    });
    if (success) {
      toast.success(`Customer marked as ${!selectedCustomer.verified ? 'verified' : 'unverified'}`);
    }
  };

  const handleToggleBlacklisted = async () => {
    if (!selectedCustomer) return;
    const success = await handleCustomerUpdate({
      action: 'toggle_blacklisted',
      id: selectedCustomer.id,
      blacklisted: !selectedCustomer.blacklisted
    });
    if (success) {
      toast.success(`Customer ${!selectedCustomer.blacklisted ? 'blacklisted' : 'removed from blacklist'}`);
    }
  };

  const handleAddPropAccount = async () => {
    if (!selectedCustomer) return;
    let parsedParams = null;
    if (propParams.trim()) {
      try {
        parsedParams = JSON.parse(propParams);
      } catch (jsonError) {
        toast.error('Prop account params must be valid JSON');
        return;
      }
    }
    const payload = {
      action: 'add_prop_account',
      userId: selectedCustomer.id,
      planType: propPlanType,
      balance: Number(propBalance) || 0,
      status: propStatus,
      params: parsedParams || undefined
    };
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Failed to add prop account');
      }
      toast.success('Prop account created');
      setIsPropAccountModalOpen(false);
      setPropBalance('0');
      setPropParams('{}');
    } catch (requestError) {
      toast.error(requestError.message || 'Failed to add prop account');
    }
  };

  const handleAddNote = async () => {
    if (!selectedCustomer) return;
    if (!noteText.trim()) {
      toast.error('Note text is required');
      return;
    }
    const payload = {
      action: 'add_note',
      userId: selectedCustomer.id,
      note: noteText.trim(),
      author: noteAuthor.trim() || undefined
    };
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Failed to add note');
      }
      toast.success('Note added to customer');
      setNoteText('');
      setNoteAuthor('');
      setIsNoteModalOpen(false);
      await mutate();
    } catch (requestError) {
      toast.error(requestError.message || 'Failed to add note');
    }
  };

  const handleMergeCustomers = async () => {
    if (!selectedCustomer || !mergeTarget) {
      toast.error('Select a target customer');
      return;
    }
    const payload = {
      action: 'merge_customers',
      sourceUserId: selectedCustomer.id,
      targetUserId: mergeTarget
    };
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || 'Failed to merge customers');
      }
      toast.success('Customers merged');
      setIsMergeModalOpen(false);
      setMergeTarget('');
      await mutate();
    } catch (requestError) {
      toast.error(requestError.message || 'Failed to merge customers');
    }
  };

  const handleRevokeAffiliate = async () => {
    if (!selectedCustomer?.affiliate?.id) {
      toast.error('Customer is not an active affiliate');
      return;
    }
    const success = await handleCustomerUpdate({
      action: 'revoke_affiliate',
      affiliateId: selectedCustomer.affiliate.id
    });
    if (success) {
      toast.success('Affiliate revoked');
    }
  };

  const handleAffiliateSave = async (changes) => {
    if (!selectedCustomer?.affiliate?.id) return;
    const success = await handleCustomerUpdate({
      action: 'update_affiliate',
      affiliateId: selectedCustomer.affiliate.id,
      payoutEmail: changes.payoutEmail,
      autoWithdrawEmail: changes.autoWithdrawEmail,
      websiteUrl: changes.website,
      withdrawalDelay: changes.withdrawalDelay,
      withdrawalThreshold: changes.withdrawalThreshold,
      customCommission: changes.customCommission,
      promotionInfo: changes.promotionInfo,
      customUrl: changes.customUrl
    });
    if (success) {
      toast.success('Affiliate updated');
      setIsAffiliateModalOpen(false);
    }
  };

  const handleCompetitionSave = async () => {
    if (!selectedCustomer) return;
    if (!competitionId) {
      toast.error('Select a competition');
      return;
    }
    const success = await handleCustomerUpdate({
      action: 'add_competition',
      userId: selectedCustomer.id,
      competitionId
    });
    if (success) {
      toast.success('Customer added to competition');
      setCompetitionId('');
      setIsCompetitionModalOpen(false);
    }
  };

  const handlePurchase = () => {
    if (!selectedCustomer) return;
    router.push(`/purchase-new-evaluation?userId=${selectedCustomer.id}`);
  };

  const handleImpersonate = async () => {
    if (!selectedCustomer) return;
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'impersonate_customer', userId: selectedCustomer.id })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) {
        throw new Error(body.error || body.message || 'Impersonation flow not available');
      }
      toast.success(body.message || 'Impersonation initiated');
    } catch (requestError) {
      toast.error(requestError.message || 'Impersonation flow not available');
    }
  };

  const handleOpenCompetitionModal = async () => {
    if (!selectedCustomer) return;
    try {
      setCompetitionsLoading(true);
      const response = await fetch('/api/competitions');
      if (!response.ok) {
        throw new Error('Failed to load competitions');
      }
      const list = await response.json();
      setCompetitionOptions(Array.isArray(list) ? list : []);
      setIsCompetitionModalOpen(true);
    } catch (loadingError) {
      toast.error(loadingError.message || 'Failed to load competitions');
    } finally {
      setCompetitionsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Customer Management</h2>
          <p className="text-sm text-gray-400">Review customer accounts, affiliate performance, and management actions.</p>
        </div>
        <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2">
          <span className="text-sm text-gray-400">Search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, or customer #"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-white">Actions:</span>
          <ActionButton label="Edit Customer" onClick={() => setIsEditModalOpen(true)} disabled={!selectedCustomer} />
          <ActionButton label="Add Prop Account" onClick={() => setIsPropAccountModalOpen(true)} disabled={!selectedCustomer} />
          <ActionButton label="Purchase Prop Account" onClick={handlePurchase} disabled={!selectedCustomer} />
          <ActionButton label="Customer Verified" onClick={handleToggleVerified} disabled={!selectedCustomer} />
          <ActionButton label="Blacklister" onClick={handleToggleBlacklisted} disabled={!selectedCustomer} />
          <ActionButton label="Merge into Another Customer" onClick={() => setIsMergeModalOpen(true)} disabled={!selectedCustomer} />
          <ActionButton label="Add Note" onClick={() => setIsNoteModalOpen(true)} disabled={!selectedCustomer} />
          <ActionButton
            label="Revoke Affiliate"
            onClick={handleRevokeAffiliate}
            disabled={!selectedCustomer?.affiliate?.id}
          />
          <ActionButton
            label="Edit Affiliate Details"
            onClick={() => setIsAffiliateModalOpen(true)}
            disabled={!selectedCustomer?.affiliate?.id}
          />
          <ActionButton label="Add to Competition" onClick={handleOpenCompetitionModal} disabled={!selectedCustomer} />
          <ActionButton label="Log in as Client" onClick={handleImpersonate} disabled={!selectedCustomer} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-900/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-900/80 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Referrals</th>
                <th className="px-4 py-3 text-right">Current Tier</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {customers.map((customer) => {
                const active = customer.id === selectedCustomerId;
                return (
                  <tr
                    key={customer.id}
                    className={active ? 'bg-gray-800/60' : 'hover:bg-gray-800/40'}
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="text-sm font-semibold text-white hover:text-indigo-300"
                        >
                          {customer.customerNumber || customer.id}
                        </Link>
                        <span className="text-xs text-gray-400">{customer.name || 'No name on file'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-200">{customer.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${verifiedChipClass(
                            customer.verified
                          )}`}
                        >
                          {customer.verified ? 'Verified' : 'Unverified'}
                        </span>
                        {customer.blacklisted && (
                          <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-200">
                            Blacklisted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-200">{customer.affiliate?.referralsCount || 0}</td>
                    <td className="px-4 py-3 text-right text-gray-200">
                      {customer.affiliate?.currentTier ? `Tier ${customer.affiliate.currentTier}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-200">{customer.totals.orders}</td>
                    <td className="px-4 py-3 text-right text-gray-200">
                      ${Number(customer.totals.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(true)}
                          className="rounded bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!customers.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">
                    {isLoading ? 'Loading customers…' : error ? 'Failed to load customers' : 'No customers found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data?.pagination && (
          <div className="flex justify-between border-t border-gray-800 px-4 py-3 text-xs text-gray-400">
            <span>Total customers: {data.pagination.total}</span>
            <span>
              Showing {customers.length} | Offset {data.pagination.offset}
            </span>
          </div>
        )}
      </div>

      <EditCustomerModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={selectedCustomer}
        onSave={async (payload) => {
          if (!selectedCustomer) return;
          const success = await handleCustomerUpdate({
            action: 'update_details',
            id: selectedCustomer.id,
            ...payload
          });
          if (success) {
            toast.success('Customer updated');
            setIsEditModalOpen(false);
          }
        }}
      />

      <Modal
        open={isPropAccountModalOpen}
        onClose={() => setIsPropAccountModalOpen(false)}
        title="Add Prop Account"
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
              Plan Type
              <select
                value={propPlanType}
                onChange={(event) => setPropPlanType(event.target.value)}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="1-step">1-Step</option>
                <option value="2-step">2-Step</option>
                <option value="free-trial">Free Trial</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
              Starting Balance
              <input
                type="number"
                value={propBalance}
                onChange={(event) => setPropBalance(event.target.value)}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </label>
          </div>
          <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
            Status
            <select
              value={propStatus}
              onChange={(event) => setPropStatus(event.target.value)}
              className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
            Params JSON
            <textarea
              rows={4}
              value={propParams}
              onChange={(event) => setPropParams(event.target.value)}
              className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPropAccountModalOpen(false)}
              className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddPropAccount}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="Add Customer Note">
        <div className="space-y-4">
          <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
            Note
            <textarea
              rows={4}
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
            Author (Optional)
            <input
              value={noteAuthor}
              onChange={(event) => setNoteAuthor(event.target.value)}
              className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(false)}
              className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddNote}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Save Note
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="Merge Customer">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Select a destination customer to merge all records into. The current customer will be removed after merge.
          </p>
          <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
            Target Customer
            <select
              value={mergeTarget}
              onChange={(event) => setMergeTarget(event.target.value)}
              className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select customer</option>
              {customers
                .filter((customer) => customer.id !== selectedCustomer?.id)
                .map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerNumber || customer.id} — {customer.email}
                  </option>
                ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMergeModalOpen(false)}
              className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMergeCustomers}
              className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Merge
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={isCompetitionModalOpen} onClose={() => setIsCompetitionModalOpen(false)} title="Add to Competition">
        <div className="space-y-4">
          {competitionsLoading ? (
            <div className="text-sm text-gray-400">Loading competitions…</div>
          ) : (
            <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
              Competition
              <select
                value={competitionId}
                onChange={(event) => setCompetitionId(event.target.value)}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select competition</option>
                {competitionOptions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.title || competition.id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCompetitionModalOpen(false)}
              className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompetitionSave}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Add
            </button>
          </div>
        </div>
      </Modal>

      <AffiliateEditModal
        open={isAffiliateModalOpen}
        affiliate={selectedCustomer?.affiliate || null}
        onClose={() => setIsAffiliateModalOpen(false)}
        onSave={handleAffiliateSave}
      />
    </div>
  );
}

function ActionButton({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded bg-slate-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        disabled ? 'cursor-not-allowed opacity-50 hover:bg-slate-700 focus:ring-0' : ''
      }`}
    >
      {label}
    </button>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-800 p-2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditCustomerModal({ open, onClose, customer, onSave }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [verified, setVerified] = useState(false);
  const [blacklisted, setBlacklisted] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setFullName(customer.name || '');
    setEmail(customer.email || '');
    setCustomerNumber(customer.customerNumber || '');
    setVerified(!!customer.verified);
    setBlacklisted(!!customer.blacklisted);
  }, [customer, open]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Customer">
      <div className="space-y-4">
        <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
          Full Name
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
          Customer Number
          <input
            value={customerNumber}
            onChange={(event) => setCustomerNumber(event.target.value)}
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={verified}
              onChange={(event) => setVerified(event.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
            />
            Verified
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={blacklisted}
              onChange={(event) => setBlacklisted(event.target.checked)}
              className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-rose-600 focus:ring-rose-500"
            />
            Blacklisted
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                fullName,
                email,
                customerNumber: customerNumber || null,
                verified,
                blacklisted
              })
            }
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
