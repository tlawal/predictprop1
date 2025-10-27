'use client';

import useSWR from 'swr';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { fetcher } from '../lib/fetcher';

export default function PlansPage() {
  const { data: plansData, mutate } = useSWR('/api/plans?includeInactive=true', fetcher);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const createPlan = async (planData) => {
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      if (response.ok) {
        mutate();
        setShowCreateForm(false);
        toast.success('Plan created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Error creating plan');
    }
  };

  const updatePlan = async (planId, planData) => {
    try {
      const response = await fetch('/api/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: planId, ...planData })
      });

      if (response.ok) {
        mutate();
        setEditingPlan(null);
        toast.success('Plan updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Error updating plan');
    }
  };

  const deletePlan = async (planId) => {
    if (!confirm('Are you sure you want to deactivate this plan?')) return;

    try {
      const response = await fetch(`/api/plans?id=${planId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        mutate();
        toast.success('Plan deactivated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to deactivate plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Error deactivating plan');
    }
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Plans Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700"
        >
          Create Plan
        </button>
      </div>

      {(showCreateForm || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            <PlanForm
              initialData={editingPlan}
              onSubmit={(data) => {
                if (editingPlan) {
                  updatePlan(editingPlan.id, data);
                } else {
                  createPlan(data);
                }
              }}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingPlan(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-600 text-gray-400">
            <tr>
              <th className="px-2 py-3 text-left">Type</th>
              <th className="px-2 py-3 text-left">Size</th>
              <th className="px-2 py-3 text-left">Fee</th>
              <th className="px-2 py-3 text-left">Parameters</th>
              <th className="px-2 py-3 text-left">Status</th>
              <th className="px-2 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plansData?.plans?.map((plan) => (
              <tr key={plan.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="px-2 py-3 text-white capitalize">{plan.type}</td>
                <td className="px-2 py-3 text-white">${plan.size?.toLocaleString()}</td>
                <td className="px-2 py-3 text-green-400">${plan.fee}</td>
                <td className="px-2 py-3 text-gray-300">
                  <div className="text-xs">
                    {plan.params && (
                      <div>
                        ROI: {plan.params.roi || plan.params.profit_target}%<br />
                        Drawdown: {plan.params.drawdown_max}% <br />
                        Exposure: {plan.params.exposure_cap}% <br />
                        Min Days: {plan.params.min_days}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      plan.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {plan.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                    >
                      {plan.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )) || (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400">
                  No plans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: initialData?.type || '1-step',
    size: initialData?.size || '',
    fee: initialData?.fee || '',
    params: initialData?.params || {
      roi: 8,
      drawdown_max: 5,
      exposure_cap: 15,
      min_days: 5
    },
    active: initialData?.active ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateParam = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      params: {
        ...prev.params,
        [key]: parseFloat(value) || value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
        >
          <option value="1-step">1-Step</option>
          <option value="2-step">2-Step</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Account Size</label>
        <input
          type="number"
          value={formData.size}
          onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          placeholder="5000"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Fee ($)</label>
        <input
          type="number"
          value={formData.fee}
          onChange={(e) => setFormData((prev) => ({ ...prev, fee: e.target.value }))}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          placeholder="99"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Parameters</label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.params.roi}
              onChange={(e) => updateParam('roi', e.target.value)}
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="ROI %"
            />
            <span className="self-center text-gray-400">ROI %</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.params.drawdown_max}
              onChange={(e) => updateParam('drawdown_max', e.target.value)}
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="Max Drawdown %"
            />
            <span className="self-center text-gray-400">Drawdown %</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.params.exposure_cap}
              onChange={(e) => updateParam('exposure_cap', e.target.value)}
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="Exposure Cap %"
            />
            <span className="self-center text-gray-400">Exposure %</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.params.min_days}
              onChange={(e) => updateParam('min_days', e.target.value)}
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="Min Days"
            />
            <span className="self-center text-gray-400">Min Days</span>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="plan-active"
          checked={formData.active}
          onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-400 focus:ring-teal-400"
        />
        <label htmlFor="plan-active" className="ml-2 text-sm text-gray-300">
          Active
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700"
        >
          {initialData ? 'Update' : 'Create'} Plan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
