'use client';

import useSWR from 'swr';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { fetcher } from '../lib/fetcher';

export default function AddOnsPage() {
  const { data: addonsData, mutate } = useSWR('/api/addons?includeInactive=true', fetcher);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);

  const createAddon = async (addonData) => {
    try {
      const response = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addonData)
      });

      if (response.ok) {
        mutate();
        setShowCreateForm(false);
        toast.success('Add-on created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create add-on');
      }
    } catch (error) {
      console.error('Error creating add-on:', error);
      toast.error('Error creating add-on');
    }
  };

  const updateAddon = async (addonId, addonData) => {
    try {
      const response = await fetch('/api/addons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: addonId, ...addonData })
      });

      if (response.ok) {
        mutate();
        setEditingAddon(null);
        toast.success('Add-on updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update add-on');
      }
    } catch (error) {
      console.error('Error updating add-on:', error);
      toast.error('Error updating add-on');
    }
  };

  const deleteAddon = async (addonId) => {
    if (!confirm('Are you sure you want to deactivate this add-on?')) return;

    try {
      const response = await fetch(`/api/addons?id=${addonId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        mutate();
        toast.success('Add-on deactivated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to deactivate add-on');
      }
    } catch (error) {
      console.error('Error deleting add-on:', error);
      toast.error('Error deactivating add-on');
    }
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Add-Ons Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700"
        >
          Create Add-On
        </button>
      </div>

      {(showCreateForm || editingAddon) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              {editingAddon ? 'Edit Add-On' : 'Create New Add-On'}
            </h3>
            <AddOnForm
              initialData={editingAddon}
              onSubmit={(data) => {
                if (editingAddon) {
                  updateAddon(editingAddon.id, data);
                } else {
                  createAddon(data);
                }
              }}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingAddon(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-600 text-gray-400">
            <tr>
              <th className="px-2 py-3 text-left">Name</th>
              <th className="px-2 py-3 text-left">Description</th>
              <th className="px-2 py-3 text-left">Price</th>
              <th className="px-2 py-3 text-left">Parameter Key</th>
              <th className="px-2 py-3 text-left">Parameter Value</th>
              <th className="px-2 py-3 text-left">Status</th>
              <th className="px-2 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addonsData?.addons?.map((addon) => (
              <tr key={addon.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="px-2 py-3 font-medium text-white">{addon.name}</td>
                <td className="max-w-xs truncate px-2 py-3 text-gray-300" title={addon.description}>
                  {addon.description}
                </td>
                <td className="px-2 py-3 text-green-400">${addon.price}</td>
                <td className="px-2 py-3 font-mono text-xs text-blue-400">{addon.param_key}</td>
                <td className="px-2 py-3 text-gray-300">
                  <div className="max-w-xs truncate rounded bg-gray-700/50 p-1 text-xs">
                    {JSON.stringify(addon.param_value)}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      addon.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {addon.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingAddon(addon)}
                      className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAddon(addon.id)}
                      className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                    >
                      {addon.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )) || (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-400">
                  No add-ons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddOnForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    param_key: initialData?.param_key || '',
    param_value: initialData?.param_value || {},
    active: initialData?.active ?? true
  });

  const [paramValueString, setParamValueString] = useState(
    initialData?.param_value ? JSON.stringify(initialData.param_value, null, 2) : '{\n  \n}'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const paramValue = JSON.parse(paramValueString);
      onSubmit({
        ...formData,
        param_value: paramValue,
        price: parseFloat(formData.price)
      });
    } catch (error) {
      toast.error('Invalid JSON in parameter value');
    }
  };

  const updateParamValue = (value) => {
    setParamValueString(value);
    try {
      const parsed = JSON.parse(value);
      setFormData((prev) => ({ ...prev, param_value: parsed }));
    } catch (error) {
      // Ignore until valid JSON
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          placeholder="e.g., 90/10 Profit Split"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className="h-20 w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          placeholder="Describe what this add-on does"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Price ($)</label>
        <input
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          placeholder="5.00"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Parameter Key *</label>
        <input
          type="text"
          value={formData.param_key}
          onChange={(e) => setFormData((prev) => ({ ...prev, param_key: e.target.value }))}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          placeholder="e.g., profit_split"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Parameter Value (JSON) *</label>
        <textarea
          value={paramValueString}
          onChange={(e) => updateParamValue(e.target.value)}
          className="h-24 w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 font-mono text-sm text-white"
          placeholder='{"trader": 90, "platform": 10}'
          required
        />
        <p className="mt-1 text-xs text-gray-400">JSON object defining the parameter values.</p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="addon-active"
          checked={formData.active}
          onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-400 focus:ring-teal-400"
        />
        <label htmlFor="addon-active" className="ml-2 text-sm text-gray-300">
          Active
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700"
        >
          {initialData ? 'Update' : 'Create'} Add-On
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
