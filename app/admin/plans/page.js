'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetcher } from '../lib/fetcher';

const PHASE_NAMES = {
  phase1: 'Phase 1',
  phase2: 'Phase 2'
};

const toInputString = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toString() : '';
};

const toPercentInputString = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }

  return (numeric * 100).toString();
};

const createDefaultPhaseParams = () => ({
  min_days: '',
  profit_target: { percent: '', amount: '' },
  drawdown_max: { percent: '', amount: '' },
  exposure_cap: { percent: '', amount: '' }
});

const createDefaultOneStepParams = () => ({
  starting_balance: '',
  win_rate: '',
  min_days: '',
  profit_target: { percent: '', amount: '' },
  drawdown_max: { percent: '', amount: '' },
  exposure_cap: { percent: '', amount: '' }
});

const createDefaultTwoStepParams = () => ({
  starting_balance: '',
  win_rate: '',
  phases: {
    phase1: createDefaultPhaseParams(),
    phase2: createDefaultPhaseParams()
  }
});

const normalizePhaseParams = (phase) => {
  if (!phase) {
    return createDefaultPhaseParams();
  }

  return {
    min_days: toInputString(phase.min_days),
    profit_target: {
      percent: toPercentInputString(phase.profit_target?.percent),
      amount: toInputString(phase.profit_target?.amount)
    },
    drawdown_max: {
      percent: toPercentInputString(phase.drawdown_max?.percent),
      amount: toInputString(phase.drawdown_max?.amount)
    },
    exposure_cap: {
      percent: toPercentInputString(phase.exposure_cap?.percent),
      amount: toInputString(phase.exposure_cap?.amount)
    }
  };
};

const normalizeParams = (params, type) => {
  if (type === '2-step') {
    if (params?.phases) {
      return {
        starting_balance: toInputString(params.starting_balance),
        win_rate: toInputString(params.win_rate),
        phases: {
          phase1: normalizePhaseParams(params.phases.phase1),
          phase2: normalizePhaseParams(params.phases.phase2)
        }
      };
    }

    const source = params || {};
    const phases = source.phases || {};

    return {
      starting_balance: toInputString(source.starting_balance),
      win_rate: toInputString(source.win_rate),
      phases: {
        phase1: normalizePhaseParams(phases.phase1),
        phase2: normalizePhaseParams(phases.phase2)
      }
    };
  }

  if (params && !params.phases) {
    return {
      starting_balance: toInputString(params.starting_balance),
      win_rate: toInputString(params.win_rate),
      min_days: toInputString(params.min_days),
      profit_target: {
        percent: toPercentInputString(params.profit_target?.percent),
        amount: toInputString(params.profit_target?.amount)
      },
      drawdown_max: {
        percent: toPercentInputString(params.drawdown_max?.percent),
        amount: toInputString(params.drawdown_max?.amount)
      },
      exposure_cap: {
        percent: toPercentInputString(params.exposure_cap?.percent),
        amount: toInputString(params.exposure_cap?.amount)
      }
    };
  }

  const source = params || {};

  return {
    starting_balance: toInputString(source.starting_balance),
    win_rate: toInputString(source.win_rate),
    min_days: toInputString(source.min_days),
    profit_target: {
      percent: toPercentInputString(source.profit_target?.percent),
      amount: toInputString(source.profit_target?.amount)
    },
    drawdown_max: {
      percent: toPercentInputString(source.drawdown_max?.percent),
      amount: toInputString(source.drawdown_max?.amount)
    },
    exposure_cap: {
      percent: toPercentInputString(source.exposure_cap?.percent),
      amount: toInputString(source.exposure_cap?.amount)
    }
  };
};

const parseRequiredNumber = (value, label) => {
  if (value === '' || value === null || value === undefined) {
    throw new Error(`${label} is required`);
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`${label} must be a valid number`);
  }

  return numeric;
};

const parseRequiredPercent = (value, label) => parseRequiredNumber(value, label) / 100;

const buildPhasePayload = (label, values = createDefaultPhaseParams()) => ({
  min_days: parseRequiredNumber(values.min_days, `${label} minimum days`),
  profit_target: {
    percent: parseRequiredPercent(values.profit_target?.percent, `${label} profit target (%)`),
    amount: parseRequiredNumber(values.profit_target?.amount, `${label} profit target ($)`)
  },
  drawdown_max: {
    percent: parseRequiredPercent(values.drawdown_max?.percent, `${label} max drawdown (%)`),
    amount: parseRequiredNumber(values.drawdown_max?.amount, `${label} max drawdown ($)`)
  },
  exposure_cap: {
    percent: parseRequiredPercent(values.exposure_cap?.percent, `${label} max exposure (%)`),
    amount: parseRequiredNumber(values.exposure_cap?.amount, `${label} max exposure ($)`)
  }
});

const buildParamsPayload = (type, params) => {
  if (type === '2-step') {
    const phaseEntries = Object.keys(PHASE_NAMES);

    return {
      starting_balance: parseRequiredNumber(params?.starting_balance, 'Starting balance'),
      win_rate: parseRequiredNumber(params?.win_rate, 'Win rate'),
      phases: phaseEntries.reduce((acc, phaseKey) => {
        const label = PHASE_NAMES[phaseKey] || phaseKey;
        acc[phaseKey] = buildPhasePayload(label, params?.phases?.[phaseKey]);
        return acc;
      }, {})
    };
  }

  return {
    starting_balance: parseRequiredNumber(params?.starting_balance, 'Starting balance'),
    win_rate: parseRequiredNumber(params?.win_rate, 'Win rate'),
    min_days: parseRequiredNumber(params?.min_days, 'Minimum trading days'),
    profit_target: {
      percent: parseRequiredPercent(params?.profit_target?.percent, 'Profit target (%)'),
      amount: parseRequiredNumber(params?.profit_target?.amount, 'Profit target ($)')
    },
    drawdown_max: {
      percent: parseRequiredPercent(params?.drawdown_max?.percent, 'Max drawdown (%)'),
      amount: parseRequiredNumber(params?.drawdown_max?.amount, 'Max drawdown ($)')
    },
    exposure_cap: {
      percent: parseRequiredPercent(params?.exposure_cap?.percent, 'Max exposure (%)'),
      amount: parseRequiredNumber(params?.exposure_cap?.amount, 'Max exposure ($)')
    }
  };
};

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
                <td className="px-2 py-3 text-green-400">${Number(plan.fee || 0).toFixed(2)}</td>
                <td className="px-2 py-3 text-gray-300">
                  <PlanParametersSummary plan={plan} />
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
  const initialType = initialData?.type || '1-step';

  const [formData, setFormData] = useState(() => ({
    type: initialType,
    size: toInputString(initialData?.size),
    fee: toInputString(initialData?.fee),
    params: normalizeParams(initialData?.params, initialType),
    active: initialData?.active ?? true
  }));

  useEffect(() => {
    const nextType = initialData?.type || '1-step';
    setFormData({
      type: nextType,
      size: toInputString(initialData?.size),
      fee: toInputString(initialData?.fee),
      params: normalizeParams(initialData?.params, nextType),
      active: initialData?.active ?? true
    });
  }, [initialData]);

  const isTwoStep = formData.type === '2-step';

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      params: normalizeParams(prev.params, type)
    }));
  };

    const calculateDollarAmount = (percent, size) => {
    if (!percent || !size) return '';
    const percentValue = parseFloat(percent) / 100;
    const sizeValue = parseFloat(size);
    if (isNaN(percentValue) || isNaN(sizeValue)) return '';
    return (percentValue * sizeValue).toFixed(2);
  };

  const handleParamChange = (updater, isPercentageField = false, fieldName = null) => {
    setFormData((prev) => {
      const baseParams = prev.params || (prev.type === '2-step' ? createDefaultTwoStepParams() : createDefaultOneStepParams());
      
      // First apply the update to get the new params
      const updatedParams = updater({...baseParams});
      
      // Helper function to update amount based on percentage and balance
      const updateAmountsFromBalance = (balance) => {
        if (isNaN(balance)) return;
        
        const updateAmount = (obj, percentPath, amountPath) => {
          const percentValue = getNestedValue(updatedParams, percentPath);
          if (percentValue) {
            const amount = calculateDollarAmount(percentValue, balance);
            if (amount) {
              setNestedValue(updatedParams, amountPath, amount);
            }
          }
        };
        
        if (prev.type === '2-step') {
          // Update amounts for both phases in 2-step plan
          Object.keys(updatedParams.phases || {}).forEach(phase => {
            ['profit_target', 'drawdown_max', 'exposure_cap'].forEach(field => {
              const percentPath = `phases.${phase}.${field}.percent`;
              const amountPath = `phases.${phase}.${field}.amount`;
              updateAmount(updatedParams, percentPath, amountPath);
            });
          });
        } else {
          // Update amounts for 1-step plan
          ['profit_target', 'drawdown_max', 'exposure_cap'].forEach(field => {
            updateAmount(updatedParams, `${field}.percent`, `${field}.amount`);
          });
        }
      };
      
      // Check if this is a starting balance change by comparing with previous value
      const isStartingBalanceChange = 
        (fieldName === 'starting_balance' || 
         (updatedParams.starting_balance && 
          updatedParams.starting_balance !== baseParams.starting_balance));
      
      // If starting balance changed, update all calculated amounts
      if (isStartingBalanceChange && updatedParams.starting_balance) {
        const balance = parseFloat(updatedParams.starting_balance);
        updateAmountsFromBalance(balance);
      }
      // If this is a percentage field change and we have a starting balance, update the corresponding amount
      else if (isPercentageField && fieldName && updatedParams.starting_balance) {
        const percentValue = getNestedValue(updatedParams, fieldName);
        const size = parseFloat(updatedParams.starting_balance);
        
        if (percentValue && !isNaN(size)) {
          const amount = calculateDollarAmount(percentValue, size);
          if (amount) {
            const amountField = fieldName.replace('.percent', '.amount');
            setNestedValue(updatedParams, amountField, amount);
          }
        }
      }
      
      return {
        ...prev,
        params: updatedParams
      };
    });
  };
  
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((o, p) => o?.[p], obj);
  };
  
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const lastObj = keys.reduce((o, key) => o[key] = o[key] || {}, obj);
    lastObj[lastKey] = value;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    try {
      const paramsPayload = buildParamsPayload(formData.type, formData.params);

      onSubmit({
        type: formData.type,
        size: parseRequiredNumber(formData.size, 'Account size'),
        fee: parseRequiredNumber(formData.fee, 'Plan fee'),
        params: paramsPayload,
        active: formData.active
      });
    } catch (error) {
      toast.error(error.message || 'Invalid plan configuration. Please review the fields and try again.');
    }
  };

  const renderOneStepFields = () => {
    const params = formData.params || createDefaultOneStepParams();

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Starting Balance ($)</label>
            <input
              type="number"
              value={params.starting_balance}
              onChange={(e) =>
                handleParamChange((current) => ({
                  ...current,
                  starting_balance: e.target.value
                }))
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="5000"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Required Win Rate (%)</label>
            <input
              type="number"
              value={params.win_rate}
              onChange={(e) =>
                handleParamChange((current) => ({
                  ...current,
                  win_rate: e.target.value
                }))
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="70"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Minimum Trading Days</label>
          <input
            type="number"
            value={params.min_days}
            onChange={(e) =>
              handleParamChange((current) => ({
                ...current,
                min_days: e.target.value
              }))
            }
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
            placeholder="5"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Profit Target (%)</label>
            <input
              type="number"
              value={params.profit_target?.percent ?? ''}
              onChange={(e) =>
                handleParamChange(
                  (current) => ({
                    ...current,
                    profit_target: {
                      ...current.profit_target,
                      percent: e.target.value
                    }
                  }),
                  true,
                  'profit_target.percent'
                )
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="10"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Profit Target ($)</label>
            <input
              type="number"
              value={params.profit_target?.amount ?? ''}
              onChange={(e) =>
                handleParamChange((current) => ({
                  ...current,
                  profit_target: {
                    ...current.profit_target,
                    amount: e.target.value
                  }
                }))
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Max Drawdown (%)</label>
            <input
              type="number"
              value={params.drawdown_max?.percent ?? ''}
              onChange={(e) =>
                handleParamChange(
                  (current) => ({
                    ...current,
                    drawdown_max: {
                      ...current.drawdown_max,
                      percent: e.target.value
                    }
                  }),
                  true,
                  'drawdown_max.percent'
                )
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="5"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Max Drawdown ($)</label>
            <input
              type="number"
              value={params.drawdown_max?.amount ?? ''}
              onChange={(e) =>
                handleParamChange((current) => ({
                  ...current,
                  drawdown_max: {
                    ...current.drawdown_max,
                    amount: e.target.value
                  }
                }))
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="250"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Max Exposure (%)</label>
            <input
              type="number"
              value={params.exposure_cap?.percent ?? ''}
              onChange={(e) =>
                handleParamChange(
                  (current) => ({
                    ...current,
                    exposure_cap: {
                      ...current.exposure_cap,
                      percent: e.target.value
                    }
                  }),
                  true,
                  'exposure_cap.percent'
                )
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="15"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Max Exposure ($)</label>
            <input
              type="number"
              value={params.exposure_cap?.amount ?? ''}
              onChange={(e) =>
                handleParamChange((current) => ({
                  ...current,
                  exposure_cap: {
                    ...current.exposure_cap,
                    amount: e.target.value
                  }
                }))
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="750"
              required
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">Enter percentage fields as whole numbers (e.g. 10 for 10%).</p>
      </div>
    );
  };

  const renderTwoStepFields = () => {
    const params = formData.params || createDefaultTwoStepParams();
    const phases = params.phases || {};

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Starting Balance ($)</label>
            <input
              type="number"
              value={params.starting_balance}
              onChange={(e) =>
                handleParamChange((current) => ({
                  ...current,
                  starting_balance: e.target.value
                }))
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="5000"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Required Win Rate (%)</label>
            <input
              type="number"
              value={params.win_rate}
              onChange={(e) =>
                handleParamChange((current) => ({
                  ...current,
                  win_rate: e.target.value
                }))
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
              placeholder="70"
              required
            />
          </div>
        </div>

        <p className="text-xs text-gray-400">Configure each evaluation phase below. Enter percentages as whole numbers.</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.keys(PHASE_NAMES).map((phaseKey) => {
            const phaseLabel = PHASE_NAMES[phaseKey] || phaseKey;
            const phaseValues = phases[phaseKey] || createDefaultPhaseParams();

            return (
              <div key={phaseKey} className="rounded-lg border border-gray-600 bg-gray-700/40 p-4 space-y-4">
                <h4 className="text-sm font-semibold text-teal-300 uppercase tracking-wide">{phaseLabel}</h4>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">Minimum Trading Days</label>
                  <input
                    type="number"
                    value={phaseValues.min_days}
                    onChange={(e) =>
                      handleParamChange((current) => ({
                        ...current,
                        phases: {
                          ...current.phases,
                          [phaseKey]: {
                            ...current.phases[phaseKey],
                            min_days: e.target.value
                          }
                        }
                      }))
                    }
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
                    placeholder="5"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Profit Target (%)</label>
                    <input
                      type="number"
                      value={phaseValues.profit_target?.percent ?? ''}
                      onChange={(e) =>
                        handleParamChange((current) => ({
                          ...current,
                          phases: {
                            ...current.phases,
                            [phaseKey]: {
                              ...current.phases[phaseKey],
                              profit_target: {
                                ...current.phases[phaseKey]?.profit_target,
                                percent: e.target.value
                              }
                            }
                          }
                        }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
                      placeholder="6"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Profit Target ($)</label>
                    <input
                      type="number"
                      value={phaseValues.profit_target?.amount ?? ''}
                      onChange={(e) =>
                        handleParamChange((current) => ({
                          ...current,
                          phases: {
                            ...current.phases,
                            [phaseKey]: {
                              ...current.phases[phaseKey],
                              profit_target: {
                                ...current.phases[phaseKey]?.profit_target,
                                amount: e.target.value
                              }
                            }
                          }
                        }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
                      placeholder="300"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Max Drawdown (%)</label>
                    <input
                      type="number"
                      value={phaseValues.drawdown_max?.percent ?? ''}
                      onChange={(e) =>
                        handleParamChange((current) => ({
                          ...current,
                          phases: {
                            ...current.phases,
                            [phaseKey]: {
                              ...current.phases[phaseKey],
                              drawdown_max: {
                                ...current.phases[phaseKey]?.drawdown_max,
                                percent: e.target.value
                              }
                            }
                          }
                        }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
                      placeholder="4"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Max Drawdown ($)</label>
                    <input
                      type="number"
                      value={phaseValues.drawdown_max?.amount ?? ''}
                      onChange={(e) =>
                        handleParamChange((current) => ({
                          ...current,
                          phases: {
                            ...current.phases,
                            [phaseKey]: {
                              ...current.phases[phaseKey],
                              drawdown_max: {
                                ...current.phases[phaseKey]?.drawdown_max,
                                amount: e.target.value
                              }
                            }
                          }
                        }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
                      placeholder="200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Max Exposure (%)</label>
                    <input
                      type="number"
                      value={phaseValues.exposure_cap?.percent ?? ''}
                      onChange={(e) =>
                        handleParamChange((current) => ({
                          ...current,
                          phases: {
                            ...current.phases,
                            [phaseKey]: {
                              ...current.phases[phaseKey],
                              exposure_cap: {
                                ...current.phases[phaseKey]?.exposure_cap,
                                percent: e.target.value
                              }
                            }
                          }
                        }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
                      placeholder="10"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Max Exposure ($)</label>
                    <input
                      type="number"
                      value={phaseValues.exposure_cap?.amount ?? ''}
                      onChange={(e) =>
                        handleParamChange((current) => ({
                          ...current,
                          phases: {
                            ...current.phases,
                            [phaseKey]: {
                              ...current.phases[phaseKey],
                              exposure_cap: {
                                ...current.phases[phaseKey]?.exposure_cap,
                                amount: e.target.value
                              }
                            }
                          }
                        }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"
                      placeholder="500"
                      required
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Type</label>
        <select
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value)}
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
        <h4 className="mb-1 text-sm font-semibold text-gray-200">Plan Parameters</h4>
        {isTwoStep ? renderTwoStepFields() : renderOneStepFields()}
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

function PlanParametersSummary({ plan }) {
  if (!plan?.params) {
    return <span className="text-gray-500 text-xs">No parameters defined</span>;
  }

  const { params } = plan;

  if (plan.type === '1-step') {
    return (
      <div className="text-xs space-y-1">
        <div>
          Profit Target: <span className="text-teal-300">{formatPercent(params.profit_target?.percent)} ({formatCurrency(params.profit_target?.amount)})</span>
        </div>
        <div>
          Max Drawdown: <span className="text-red-300">{formatPercent(params.drawdown_max?.percent)} ({formatCurrency(params.drawdown_max?.amount)})</span>
        </div>
        <div>
          Max Exposure: <span className="text-yellow-300">{formatPercent(params.exposure_cap?.percent)} ({formatCurrency(params.exposure_cap?.amount)})</span>
        </div>
        <div>
          Min Days: <span className="text-sky-300">{params.min_days || 0}</span>
        </div>
        <div>
          Win Rate: <span className="text-purple-300">{params.win_rate || 0}%</span>
        </div>
      </div>
    );
  }

  const phases = params.phases || {};

  return (
    <div className="text-xs space-y-2">
      {Object.entries(phases).map(([phaseKey, phase]) => (
        <div key={phaseKey} className="border border-gray-700 rounded-md p-2">
          <div className="font-semibold text-teal-300 mb-1 uppercase">{phaseKey.replace('phase', 'Phase ')}</div>
          <div>Profit Target: <span className="text-teal-200">{formatPercent(phase.profit_target?.percent)} ({formatCurrency(phase.profit_target?.amount)})</span></div>
          <div>Max Drawdown: <span className="text-red-200">{formatPercent(phase.drawdown_max?.percent)} ({formatCurrency(phase.drawdown_max?.amount)})</span></div>
          <div>Max Exposure: <span className="text-yellow-200">{formatPercent(phase.exposure_cap?.percent)} ({formatCurrency(phase.exposure_cap?.amount)})</span></div>
          <div>Min Days: <span className="text-sky-200">{phase.min_days || 0}</span></div>
        </div>
      ))}
      <div>
        Win Rate: <span className="text-purple-300">{params.win_rate || 0}%</span>
      </div>
    </div>
  );
}

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0';
  const amount = Number(value);
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  })}`;
};

const formatPercent = (value) => {
  if (value === undefined || value === null) return '0%';
  return `${Math.round(Number(value) * 100)}%`;
};
