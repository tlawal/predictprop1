'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { fetcher } from '../../../lib/fetcher';
import AffiliateDetails from '../components/AffiliateDetails';
import EditModal from '../components/EditModal';
import ManualCommissionModal from '../components/ManualCommissionModal';

const AFFILIATE_DETAILS_KEY = (id) => (id ? `/api/affiliates/details/${id}` : null);

export default function AffiliateDetailsPage() {
  const { id } = useParams();

  const [customUrl, setCustomUrl] = useState('');
  const [customUrlPristine, setCustomUrlPristine] = useState(true);
  const [customUrlSaving, setCustomUrlSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [commissionOpen, setCommissionOpen] = useState(false);
  const [commissionSaving, setCommissionSaving] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(AFFILIATE_DETAILS_KEY(id), fetcher, {
    revalidateOnFocus: false
  });

  const affiliate = data?.affiliate;
  const tiers = data?.tiers || [];

  useEffect(() => {
    if (affiliate) {
      setCustomUrl(affiliate.customUrl || '');
      setCustomUrlPristine(true);
    }
  }, [affiliate]);

  const handleCustomUrlChange = useCallback((value) => {
    setCustomUrl(value);
    setCustomUrlPristine(false);
  }, []);

  const handleCustomUrlReset = useCallback(() => {
    setCustomUrl(affiliate?.customUrl || '');
    setCustomUrlPristine(true);
  }, [affiliate]);

  const handleCustomUrlSave = useCallback(async () => {
    if (!id) return;
    setCustomUrlSaving(true);
    try {
      const response = await fetch(`/api/affiliates/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customAffiliateUrl: customUrl || null })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || payload.message || 'Failed to update custom URL');
      }

      toast.success('Custom affiliate URL updated');
      setCustomUrlPristine(true);
      mutate();
    } catch (requestError) {
      toast.error(requestError.message || 'Failed to update custom URL');
    } finally {
      setCustomUrlSaving(false);
    }
  }, [customUrl, id, mutate]);

  const handleEditSave = useCallback(
    async (values) => {
      if (!id) return;
      setEditSaving(true);
      try {
        const response = await fetch(`/api/affiliates/${id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payoutEmail: values.payoutEmail,
            autoWithdrawEmail: values.autoWithdrawEmail,
            websiteUrl: values.websiteUrl,
            withdrawalDelay: values.withdrawalDelay,
            withdrawalThreshold: values.withdrawalThreshold,
            customCommission: values.customCommission,
            promotionInfo: values.promotionInfo
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || payload.message || 'Failed to update affiliate');
        }

        toast.success('Affiliate settings updated');
        setEditOpen(false);
        mutate();
      } catch (updateError) {
        toast.error(updateError.message || 'Failed to update affiliate');
      } finally {
        setEditSaving(false);
      }
    },
    [id, mutate]
  );

  const handleManualCommission = useCallback(
    async (values) => {
      if (!id) return;
      setCommissionSaving(true);
      try {
        const response = await fetch('/api/commissions/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affiliateId: id,
            orderId: values.orderId || null,
            amount: Number(values.amount),
            note: values.note || null
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || payload.message || 'Failed to create commission');
        }

        toast.success('Manual commission recorded');
        setCommissionOpen(false);
        mutate();
      } catch (submissionError) {
        toast.error(submissionError.message || 'Failed to create commission');
      } finally {
        setCommissionSaving(false);
      }
    },
    [id, mutate]
  );

  const ordersForModal = useMemo(() => {
    if (!affiliate?.recentOrders?.length) return [];
    return affiliate.recentOrders.map((order) => ({
      id: order.id,
      orderRef: order.orderRef,
      amount: order.amount
    }));
  }, [affiliate?.recentOrders]);

  if (error) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/70 p-6 text-sm text-rose-300">
        Failed to load affiliate details.
      </div>
    );
  }

  if (isLoading || !affiliate) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/70 p-6 text-sm text-gray-300">
        Loading affiliate details…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AffiliateDetails
        affiliate={affiliate}
        tiers={tiers}
        customUrlValue={customUrl}
        onCustomUrlChange={handleCustomUrlChange}
        onCustomUrlSave={handleCustomUrlSave}
        onCustomUrlReset={handleCustomUrlReset}
        customUrlSaving={customUrlSaving}
        isCustomUrlDirty={!customUrlPristine}
        onEditClick={() => setEditOpen(true)}
        onManualCommissionClick={() => setCommissionOpen(true)}
      />

      <EditModal
        open={editOpen}
        affiliate={affiliate}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        saving={editSaving}
      />

      <ManualCommissionModal
        open={commissionOpen}
        orders={ordersForModal}
        onClose={() => setCommissionOpen(false)}
        onSubmit={handleManualCommission}
        submitting={commissionSaving}
      />
    </div>
  );
}
