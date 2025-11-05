'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  orderId: yup.string().nullable().transform(emptyToNull),
  amount: yup
    .number()
    .typeError('Amount is required')
    .positive('Amount must be greater than zero')
    .required('Amount is required'),
  note: yup.string().nullable().transform(emptyToNull)
});

export default function ManualCommissionModal({
  open,
  orders,
  onClose,
  onSubmit,
  submitting
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { orderId: '', amount: '', note: '' }
  });

  useEffect(() => {
    if (open) {
      reset({ orderId: '', amount: '', note: '' });
    }
  }, [open, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-xl rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Manual Affiliate Commission</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-800 p-2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
            Linked Order (optional)
            <select
              {...register('orderId')}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">No linked order</option>
              {(orders || []).map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderRef} • {order.amount}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
            Amount (USD)
            <input
              {...register('amount')}
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            {errors.amount && <span className="text-xs text-rose-400">{errors.amount.message}</span>}
          </label>

          <label className="grid gap-2 text-xs uppercase tracking-wide text-gray-400">
            Note (optional)
            <textarea
              {...register('note')}
              rows={4}
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>

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
              disabled={submitting}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Create Commission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function emptyToNull(value) {
  return value === '' ? null : value;
}
