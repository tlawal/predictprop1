'use client';

import { useEffect, useState } from 'react';

export default function AffiliateEditModal({ open, affiliate, onClose, onSave }) {
  const [payoutEmail, setPayoutEmail] = useState('');
  const [autoWithdrawEmail, setAutoWithdrawEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [customCommission, setCustomCommission] = useState('');
  const [withdrawalDelay, setWithdrawalDelay] = useState('');
  const [withdrawalThreshold, setWithdrawalThreshold] = useState('');
  const [promotionInfo, setPromotionInfo] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    if (!affiliate) return;
    setPayoutEmail(affiliate.payoutEmail || '');
    setAutoWithdrawEmail(affiliate.autoWithdrawEmail || '');
    setWebsite(affiliate.website || '');
    setCustomCommission(
      affiliate.customCommission === null || affiliate.customCommission === undefined
        ? ''
        : String(affiliate.customCommission)
    );
    setWithdrawalDelay(
      affiliate.withdrawalDelay === null || affiliate.withdrawalDelay === undefined ? '' : String(affiliate.withdrawalDelay)
    );
    setWithdrawalThreshold(
      affiliate.withdrawalThreshold === null || affiliate.withdrawalThreshold === undefined
        ? ''
        : String(affiliate.withdrawalThreshold)
    );
    setPromotionInfo(affiliate.promotionInfo || '');
    setCustomUrl(affiliate.customUrl || '');
  }, [affiliate, open]);

  if (!open) return null;

  const handleSave = () => {
    onSave({
      payoutEmail: payoutEmail || null,
      autoWithdrawEmail: autoWithdrawEmail || null,
      website: website || null,
      customCommission: customCommission === '' ? null : Number(customCommission),
      withdrawalDelay: withdrawalDelay === '' ? null : Number(withdrawalDelay),
      withdrawalThreshold: withdrawalThreshold === '' ? null : Number(withdrawalThreshold),
      promotionInfo: promotionInfo || null,
      customUrl: customUrl || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Edit Affiliate Details</h3>
          <button type="button" onClick={onClose} className="rounded bg-gray-800 p-2 text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        {affiliate ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
                Payout Email
                <input
                  type="email"
                  value={payoutEmail}
                  onChange={(event) => setPayoutEmail(event.target.value)}
                  className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
                Auto Withdraw Email
                <input
                  type="email"
                  value={autoWithdrawEmail}
                  onChange={(event) => setAutoWithdrawEmail(event.target.value)}
                  className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
            <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
              Website URL
              <input
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
                Custom Commission (%)
                <input
                  type="number"
                  step="0.01"
                  value={customCommission}
                  onChange={(event) => setCustomCommission(event.target.value)}
                  className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
                Withdrawal Threshold
                <input
                  type="number"
                  step="0.01"
                  value={withdrawalThreshold}
                  onChange={(event) => setWithdrawalThreshold(event.target.value)}
                  className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
                Withdrawal Delay (days)
                <input
                  type="number"
                  value={withdrawalDelay}
                  onChange={(event) => setWithdrawalDelay(event.target.value)}
                  className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
                Custom URL
                <input
                  value={customUrl}
                  onChange={(event) => setCustomUrl(event.target.value)}
                  className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
            <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
              Promotion Info
              <textarea
                rows={4}
                value={promotionInfo}
                onChange={(event) => setPromotionInfo(event.target.value)}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </label>
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
                onClick={handleSave}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Affiliate record not available.</div>
        )}
      </div>
    </div>
  );
}
