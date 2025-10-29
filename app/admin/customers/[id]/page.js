'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { fetcher } from '../../lib/fetcher';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

dayjs.extend(relativeTime);

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id;

  const { data, error, isLoading, mutate } = useSWR(
    customerId ? `/api/customers?id=${customerId}` : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  );

  const customer = data?.customer || null;
  const loadError = data?.error || null;

  useEffect(() => {
    if (!customerId) return;
    if (loadError === 'Customer not found') {
      router.replace('/admin/customers');
    }
  }, [customerId, loadError, router]);

  const [selectedTab, setSelectedTab] = useState('overview');
  const [noteText, setNoteText] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');

  const affiliate = customer?.affiliate || null;

  const affiliateMetrics = affiliate?.metrics || {
    totalCommissionsEarned: 0,
    totalPaidOut: 0,
    availablePayout: 0,
    revenueGenerated: 0,
    indirectRevenue: 0,
    nextWithdrawalDate: null
  };

  const ordersVisible = customer?.totals?.orders || 0;
  const revenueVisible = customer?.totals?.revenue || 0;
  const challengesVisible = customer?.totals?.challenges || 0;

  const handleMarkCommissionPaid = async (commissionId) => {
    try {
      const response = await fetch('/api/commissions/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Failed' }));
        throw new Error(payload.error || payload.message || 'Failed to mark commission paid');
      }
      toast.success('Commission marked as paid');
      mutate();
    } catch (payError) {
      toast.error(payError.message || 'Failed to mark commission paid');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error('Note text is required');
      return;
    }
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          userId: customer.id,
          note: noteText.trim(),
          author: noteAuthor.trim() || undefined
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Failed' }));
        throw new Error(payload.error || payload.message || 'Failed to save note');
      }
      toast.success('Note added');
      setNoteText('');
      setNoteAuthor('');
      mutate();
    } catch (noteError) {
      toast.error(noteError.message || 'Failed to save note');
    }
  };

  const handleBack = () => {
    router.push('/admin/customers');
  };

  const commissionByStatus = useMemo(() => {
    if (!affiliate?.recentCommissions?.length) return { pending: [], paid: [], cancelled: [] };
    return affiliate.recentCommissions.reduce(
      (acc, commission) => {
        const key = commission.status || 'pending';
        if (!acc[key]) acc[key] = [];
        acc[key].push(commission);
        return acc;
      },
      { pending: [], paid: [], cancelled: [] }
    );
  }, [affiliate?.recentCommissions]);

  const hasAffiliate = !!affiliate;

  if (error || (loadError && loadError !== 'Customer not found')) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
        <button onClick={handleBack} className="text-sm text-indigo-300 hover:text-indigo-200">
          ← Back
        </button>
        <div className="mt-6 text-sm text-rose-300">Failed to load customer details.</div>
      </div>
    );
  }

  if (isLoading || !customer || loadError) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
        <button onClick={handleBack} className="text-sm text-indigo-300 hover:text-indigo-200">
          ← Back
        </button>
        <div className="mt-6 text-sm text-gray-300">Loading customer...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={handleBack} className="text-sm text-indigo-300 hover:text-indigo-200">
        ← Back to Customers
      </button>

      <header className="rounded-xl border border-gray-700 bg-gray-900/80 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{customer.name || customer.email}</h1>
            <p className="text-sm text-gray-400">Customer #{customer.customerNumber || customer.id}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 ${customer.verified ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}`}>
                {customer.verified ? 'Verified' : 'Unverified'}
              </span>
              {customer.blacklisted && (
                <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-rose-200">
                  Blacklisted
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-gray-300">
                Joined {dayjs(customer.createdAt).format('MMM D, YYYY')}
              </span>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-gray-300">
            <span>
              <strong className="text-gray-400">Email:</strong> {customer.email}
            </span>
            <span>
              <strong className="text-gray-400">Updated:</strong> {dayjs(customer.updatedAt).fromNow()}
            </span>
            {hasAffiliate && (
              <span>
                <strong className="text-gray-400">Affiliate Code:</strong> {affiliate.code}
              </span>
            )}
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MetricCard label="Orders" value={ordersVisible} />
          <MetricCard label="Total Revenue" value={currencyFormatter.format(revenueVisible || 0)} />
          <MetricCard label="Challenges" value={challengesVisible} />
        </div>
      </header>

      <section className="rounded-xl border border-gray-700 bg-gray-900/70 p-4">
        <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-4">
          <TabButton label="Overview" value="overview" active={selectedTab === 'overview'} onClick={setSelectedTab} />
          <TabButton label="Notes" value="notes" active={selectedTab === 'notes'} onClick={setSelectedTab} />
          {hasAffiliate && (
            <>
              <TabButton label="Affiliate Metrics" value="affiliate" active={selectedTab === 'affiliate'} onClick={setSelectedTab} />
              <TabButton label="Referrals" value="referrals" active={selectedTab === 'referrals'} onClick={setSelectedTab} />
              <TabButton label="Commissions" value="commissions" active={selectedTab === 'commissions'} onClick={setSelectedTab} />
            </>
          )}
        </div>

        <div className="mt-4">
          {selectedTab === 'overview' && (
            <OverviewSection customer={customer} affiliate={affiliate} />
          )}

          {selectedTab === 'notes' && (
            <NotesSection
              notes={customer.notes || []}
              noteText={noteText}
              noteAuthor={noteAuthor}
              onNoteTextChange={setNoteText}
              onNoteAuthorChange={setNoteAuthor}
              onAddNote={handleAddNote}
            />
          )}

          {selectedTab === 'affiliate' && hasAffiliate && (
            <AffiliateMetricsSection metrics={affiliateMetrics} tiers={affiliate.tiers || []} affiliate={affiliate} />
          )}

          {selectedTab === 'referrals' && hasAffiliate && (
            <ReferralsSection affiliateId={affiliate.id} />
          )}

          {selectedTab === 'commissions' && hasAffiliate && (
            <CommissionsSection
              commissionsByStatus={commissionByStatus}
              onMarkPaid={handleMarkCommissionPaid}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function TabButton({ label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-full px-4 py-1 text-sm transition ${
        active ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function OverviewSection({ customer, affiliate }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Customer Details">
          <Detail label="Email" value={customer.email} />
          <Detail label="Customer #" value={customer.customerNumber || '—'} />
          <Detail label="Verified" value={customer.verified ? 'Yes' : 'No'} />
          <Detail label="Blacklisted" value={customer.blacklisted ? 'Yes' : 'No'} />
        </InfoCard>
        <InfoCard title="Activity">
          <Detail label="Orders" value={customer.totals?.orders || 0} />
          <Detail label="Revenue" value={currencyFormatter.format(customer.totals?.revenue || 0)} />
          <Detail label="Challenges" value={customer.totals?.challenges || 0} />
          <Detail label="Account Created" value={dayjs(customer.createdAt).format('MMM D, YYYY h:mm A')} />
        </InfoCard>
      </div>
      {affiliate && (
        <InfoCard title="Affiliate" footer={
          <Link href={`/admin/affiliates`} className="text-sm text-indigo-300 hover:text-indigo-200">
            View affiliate dashboard
          </Link>
        }>
          <Detail label="Affiliate Code" value={affiliate.code} />
          <Detail label="Contract Status" value={affiliate.contractStatus || '—'} />
          <Detail label="Current Tier" value={affiliate.currentTier || '—'} />
          <Detail label="Referrals" value={affiliate.referralsCount || 0} />
          <Detail label="Payout Email" value={affiliate.payoutEmail || '—'} />
          <Detail label="Withdrawal Threshold" value={affiliate.withdrawalThreshold || '—'} />
        </InfoCard>
      )}
    </div>
  );
}

function NotesSection({ notes, noteText, noteAuthor, onNoteTextChange, onNoteAuthorChange, onAddNote }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Existing Notes</h3>
        <div className="space-y-3">
          {Array.isArray(notes) && notes.length ? (
            notes
              .slice()
              .reverse()
              .map((note, index) => (
                <div key={index} className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
                  <p className="text-sm text-gray-200">{note.text || note}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {note.author && <span className="mr-2">By {note.author}</span>}
                    {note.createdAt && <span>{dayjs(note.createdAt).format('MMM D, YYYY h:mm A')}</span>}
                  </div>
                </div>
              ))
          ) : (
            <div className="rounded border border-dashed border-gray-700 p-4 text-sm text-gray-400">No notes yet.</div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Add Note</h3>
        <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
          Note
          <textarea
            rows={5}
            value={noteText}
            onChange={(event) => onNoteTextChange(event.target.value)}
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
          Author (optional)
          <input
            value={noteAuthor}
            onChange={(event) => onNoteAuthorChange(event.target.value)}
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAddNote}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

function AffiliateMetricsSection({ metrics, tiers, affiliate }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total Commissions Earned" value={currencyFormatter.format(metrics.totalCommissionsEarned || 0)} />
        <MetricCard label="Total Paid Out" value={currencyFormatter.format(metrics.totalPaidOut || 0)} />
        <MetricCard label="Available Payout" value={currencyFormatter.format(metrics.availablePayout || 0)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Revenue Generated" value={currencyFormatter.format(metrics.revenueGenerated || 0)} />
        <MetricCard label="Indirect Revenue" value={currencyFormatter.format(metrics.indirectRevenue || 0)} />
        <MetricCard label="Next Withdrawal" value={metrics.nextWithdrawalDate ? dayjs(metrics.nextWithdrawalDate).format('MMM D, YYYY') : '—'} />
      </div>
      <InfoCard title="Affiliate Settings">
        <Detail label="Payout Email" value={affiliate.payoutEmail || '—'} />
        <Detail label="Auto Withdraw Email" value={affiliate.autoWithdrawEmail || '—'} />
        <Detail label="Withdrawal Delay (days)" value={affiliate.withdrawalDelay || '—'} />
        <Detail label="Custom Commission" value={affiliate.customCommission != null ? `${affiliate.customCommission}%` : '—'} />
        <Detail label="Custom URL" value={affiliate.customUrl || '—'} />
        <Detail label="Promotion Info" value={affiliate.promotionInfo || '—'} />
      </InfoCard>
      {tiers.length > 0 && (
        <InfoCard title="Tier Ladder">
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div key={tier.id} className="rounded border border-gray-700 bg-gray-900/50 p-3">
                <div className="flex items-center justify-between text-sm text-gray-200">
                  <span>
                    Tier {tier.level}: {tier.name || tier.label || 'Unnamed'}
                  </span>
                  <span>{currencyFormatter.format(tier.commission_amount || 0)}</span>
                </div>
                {tier.description && <p className="mt-2 text-xs text-gray-500">{tier.description}</p>}
              </div>
            ))}
          </div>
        </InfoCard>
      )}
    </div>
  );
}

function ReferralsSection({ affiliateId }) {
  const { data, error, isLoading } = useSWR(`/api/referred-accounts/${affiliateId}`, fetcher, {
    revalidateOnFocus: false
  });

  if (error) {
    return <div className="text-sm text-rose-300">Failed to load referrals.</div>;
  }

  if (isLoading) {
    return <div className="text-sm text-gray-300">Loading referrals...</div>;
  }

  const referrals = data?.accounts || [];

  return (
    <div className="space-y-3">
      {referrals.length ? (
        referrals.map((referral) => (
          <div key={referral.id} className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Level {referral.level}</div>
                <div className="text-xs text-gray-400">{referral.customer?.email || 'Unknown contact'}</div>
              </div>
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">Commission:</span> {currencyFormatter.format(referral.calculatedCommission || 0)}
              </div>
            </div>
            <div className="mt-2 grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
              <span>
                Order ID: {referral.order?.orderNumber || referral.order?.id || '—'}
              </span>
              <span>
                Order Amount: {currencyFormatter.format(referral.order?.amount || 0)}
              </span>
              <span>
                Status: {referral.order?.status || '—'}
              </span>
              <span>
                Commission Status: {referral.commission?.status || '—'}
              </span>
              <span>
                Recorded: {dayjs(referral.createdAt).format('MMM D, YYYY')}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded border border-dashed border-gray-700 p-4 text-sm text-gray-400">No referrals yet.</div>
      )}
    </div>
  );
}

function CommissionsSection({ commissionsByStatus, onMarkPaid }) {
  const tabs = ['pending', 'paid', 'cancelled'];
  const [status, setStatus] = useState('pending');

  const list = commissionsByStatus[status] || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={`rounded-full px-4 py-1 text-sm capitalize ${
              status === tab ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.length ? (
          list.map((commission) => (
            <div key={commission.id} className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {currencyFormatter.format(Number(commission.amount || 0))}
                  </div>
                  <div className="text-xs text-gray-400">{dayjs(commission.created_at || commission.createdAt).format('MMM D, YYYY h:mm A')}</div>
                  {commission.note && <div className="text-xs text-gray-500">{commission.note}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gray-800 px-3 py-1 text-xs capitalize text-gray-300">{commission.status}</span>
                  {commission.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onMarkPaid(commission.id)}
                      className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded border border-dashed border-gray-700 p-4 text-sm text-gray-400">No commissions for this status.</div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children, footer }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/70 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-gray-300">{children}</div>
      {footer && <div className="mt-4 border-t border-gray-800 pt-3 text-right">{footer}</div>}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
}
