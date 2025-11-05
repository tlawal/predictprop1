import dayjs from 'dayjs';

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-200 border border-amber-500/40',
  approved: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/40',
  processing: 'bg-sky-500/10 text-sky-200 border border-sky-500/40',
  paid: 'bg-indigo-500/10 text-indigo-200 border border-indigo-500/40',
  rejected: 'bg-rose-500/10 text-rose-200 border border-rose-500/40',
  failed: 'bg-rose-500/10 text-rose-200 border border-rose-500/40'
};

const STATUS_ACTIONS = {
  pending: [
    { label: 'Approve', status: 'approved', tone: 'emerald' },
    { label: 'Reject', status: 'rejected', tone: 'rose' }
  ],
  approved: [
    { label: 'Start Processing', status: 'processing', tone: 'sky' },
    { label: 'Mark Paid', status: 'paid', tone: 'indigo' },
    { label: 'Reject', status: 'rejected', tone: 'rose' }
  ],
  processing: [
    { label: 'Mark Paid', status: 'paid', tone: 'indigo' },
    { label: 'Fail', status: 'failed', tone: 'rose' }
  ],
  failed: [{ label: 'Retry', status: 'processing', tone: 'sky' }],
  rejected: [{ label: 'Reopen', status: 'approved', tone: 'emerald' }]
};

const toneClass = (tone) => {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-600 hover:bg-emerald-500';
    case 'sky':
      return 'bg-sky-600 hover:bg-sky-500';
    case 'indigo':
      return 'bg-indigo-600 hover:bg-indigo-500';
    case 'rose':
      return 'bg-rose-600 hover:bg-rose-500';
    default:
      return 'bg-slate-600 hover:bg-slate-500';
  }
};

export default function AffiliatePayoutTable({ payouts, isLoading, onUpdateStatus, processingId, currencyFormatter }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-900/60 py-12 text-sm text-gray-400">
        Loading payouts…
      </div>
    );
  }

  if (!payouts?.length) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-900/60 py-12 text-sm text-gray-400">
        No affiliate payouts found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-800 text-sm">
        <thead className="bg-gray-900/70 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="px-4 py-3 text-left">Affiliate</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-left">Method</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Requested</th>
            <th className="px-4 py-3 text-left">Processed</th>
            <th className="px-4 py-3 text-left">Notes</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {payouts.map((payout) => (
            <tr key={payout.id} className="hover:bg-gray-900/40">
              <td className="px-4 py-4 align-top">
                <div className="text-white">{payout.affiliates?.custom_name || payout.affiliates?.name || payout.affiliates?.affiliate_id || 'Affiliate'}</div>
                <div className="text-xs text-gray-400">{payout.affiliates?.affiliate_id || payout.affiliate_id}</div>
              </td>
              <td className="px-4 py-4 align-top text-right text-white">
                {currencyFormatter.format(Number(payout.amount || 0))}
                <div className="text-xs text-gray-500">{payout.currency || 'USD'}</div>
              </td>
              <td className="px-4 py-4 align-top text-gray-300">{payout.method || '—'}</td>
              <td className="px-4 py-4 align-top">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs capitalize ${
                    STATUS_STYLES[payout.status] || 'bg-slate-600/20 text-slate-200 border border-slate-500/40'
                  }`}
                >
                  {payout.status}
                </span>
              </td>
              <td className="px-4 py-4 align-top text-gray-300">
                {payout.requested_at ? dayjs(payout.requested_at).format('MMM D, YYYY HH:mm') : '—'}
              </td>
              <td className="px-4 py-4 align-top text-gray-300">
                {payout.processed_at ? dayjs(payout.processed_at).format('MMM D, YYYY HH:mm') : '—'}
                {payout.processed_by && (
                  <div className="text-xs text-gray-500">{payout.processed_by}</div>
                )}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="text-gray-300">{payout.notes || '—'}</div>
                {payout.admin_notes && <div className="text-xs text-gray-500">Admin: {payout.admin_notes}</div>}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex flex-wrap gap-2">
                  {(STATUS_ACTIONS[payout.status] || []).map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={processingId === payout.id}
                      onClick={() => onUpdateStatus?.(payout, action.status)}
                      className={`rounded px-3 py-1 text-xs font-medium text-white transition ${
                        toneClass(action.tone)
                      } ${processingId === payout.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {processingId === payout.id ? 'Updating…' : action.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
