"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import AffiliatePayoutTable from "../components/AffiliatePayoutTable";
import { fetcher } from "../../lib/fetcher";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Processing", value: "processing" },
  { label: "Paid", value: "paid" },
  { label: "Rejected", value: "rejected" },
  { label: "Failed", value: "failed" }
];

const SORT_OPTIONS = [
  { label: "Newest", value: "requested_at", direction: "desc" },
  { label: "Oldest", value: "requested_at", direction: "asc" },
  { label: "Amount (High)", value: "amount", direction: "desc" },
  { label: "Amount (Low)", value: "amount", direction: "asc" }
];

export default function AffiliatePayoutsPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [processingId, setProcessingId] = useState(null);

  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    params.set("sort", sort.value);
    params.set("direction", sort.direction);
    if (statusFilter.value) params.set("status", statusFilter.value);
    return `/api/admin/affiliates/payouts?${params.toString()}`;
  }, [statusFilter, sort]);

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, { revalidateOnFocus: false });

  const payouts = data?.payouts || [];

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }),
    []
  );

  const handleStatusUpdate = async (payout, status) => {
    setProcessingId(payout.id);
    try {
      const response = await fetch("/api/admin/affiliates/payouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: payout.id, status, adminId: "admin" })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || "Failed to update payout");
      }

      toast.success(`Payout marked as ${status}`);
      mutate();
    } catch (updateError) {
      toast.error(updateError.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Affiliate Payouts</h1>
            <p className="text-sm text-gray-400">Review, approve, and track affiliate commission payouts.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <select
              value={statusFilter.value}
              onChange={(event) => {
                const selected = STATUS_FILTERS.find((item) => item.value === event.target.value) || STATUS_FILTERS[0];
                setStatusFilter(selected);
              }}
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value} className="bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={`${sort.value}:${sort.direction}`}
              onChange={(event) => {
                const [value, direction] = event.target.value.split(":");
                const selected = SORT_OPTIONS.find((item) => item.value === value && item.direction === direction) || SORT_OPTIONS[0];
                setSort(selected);
              }}
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={`${option.value}:${option.direction}`} value={`${option.value}:${option.direction}`} className="bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            Failed to load affiliate payouts.
          </div>
        )}
      </header>

      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <AffiliatePayoutTable
          payouts={payouts}
          isLoading={isLoading}
          onUpdateStatus={handleStatusUpdate}
          processingId={processingId}
          currencyFormatter={currencyFormatter}
        />
      </section>
    </div>
  );
}
