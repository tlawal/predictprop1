'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  payoutEmail: yup.string().email('Invalid email').nullable().transform(emptyToNull),
  autoWithdrawEmail: yup.string().email('Invalid email').nullable().transform(emptyToNull),
  websiteUrl: yup.string().url('Invalid URL').nullable().transform(emptyToNull),
  withdrawalDelay: yup
    .number()
    .typeError('Enter a number')
    .min(0, 'Must be zero or more')
    .nullable()
    .transform(emptyToNull),
  withdrawalThreshold: yup
    .number()
    .typeError('Enter a number')
    .min(0, 'Must be zero or more')
    .nullable()
    .transform(emptyToNull),
  customCommission: yup
    .string()
    .test('json', 'Must be valid JSON', (value) => {
      if (!value || !value.trim()) return true;
      try {
        JSON.parse(value);
        return true;
      } catch (_error) {
        return false;
      }
    })
    .nullable()
    .transform(emptyToNull),
  promotionInfo: yup.string().nullable().transform(emptyToNull)
});

export default function EditModal({ open, affiliate, onClose, onSave, saving }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: buildDefaults(affiliate)
  });

  useEffect(() => {
    if (affiliate) {
      reset(buildDefaults(affiliate));
    }
  }, [affiliate, reset, open]);

  if (!open) return null;

  const onSubmit = (values) => {
    onSave({
      payoutEmail: values.payoutEmail,
      autoWithdrawEmail: values.autoWithdrawEmail,
      websiteUrl: values.websiteUrl,
      withdrawalDelay: toNumberOrNull(values.withdrawalDelay),
      withdrawalThreshold: toNumberOrNull(values.withdrawalThreshold),
      customCommission: parseJson(values.customCommission),
      promotionInfo: values.promotionInfo
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Affiliate Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-800 p-2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Payout Email" error={errors.payoutEmail?.message}>
              <input
                {...register('payoutEmail')}
                type="email"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </Field>
            <Field label="Auto Withdraw Email" error={errors.autoWithdrawEmail?.message}>
              <input
                {...register('autoWithdrawEmail')}
                type="email"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </Field>
          </div>
          <Field label="Website URL" error={errors.websiteUrl?.message}>
            <input
              {...register('websiteUrl')}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Withdrawal Delay (days)" error={errors.withdrawalDelay?.message}>
              <input
                {...register('withdrawalDelay')}
                type="number"
                min="0"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </Field>
            <Field label="Withdrawal Threshold" error={errors.withdrawalThreshold?.message}>
              <input
                {...register('withdrawalThreshold')}
                type="number"
                min="0"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </Field>
          </div>
          <Field label="Custom Commission JSON" error={errors.customCommission?.message}>
            <textarea
              {...register('customCommission')}
              rows={6}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              placeholder='{"1":{"referral_threshold":0,"payout_percent":5}}'
            />
          </Field>
          <Field label="Promotion Info" error={errors.promotionInfo?.message}>
            <textarea
              {...register('promotionInfo')}
              rows={4}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
      {label}
      {children}
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </label>
  );
}

function buildDefaults(affiliate) {
  if (!affiliate) {
    return {
      payoutEmail: '',
      autoWithdrawEmail: '',
      websiteUrl: '',
      withdrawalDelay: '',
      withdrawalThreshold: '',
      customCommission: '',
      promotionInfo: ''
    };
  }

  return {
    payoutEmail: affiliate.payoutEmail || '',
    autoWithdrawEmail: affiliate.autoWithdrawEmail || '',
    websiteUrl: affiliate.websiteUrl || '',
    withdrawalDelay: affiliate.withdrawalDelay ?? '',
    withdrawalThreshold: affiliate.withdrawalThreshold ?? '',
    customCommission: affiliate.customCommission ? JSON.stringify(affiliate.customCommission, null, 2) : '',
    promotionInfo: affiliate.promotionInfo || ''
  };
}

function emptyToNull(value) {
  return value === '' || value === undefined ? null : value;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseJson(value) {
  if (!value || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}
