import React from 'react';

const AccountBalanceSelector = ({ plans, selectedPlanId, onPlanSelect, filterType }) => {
  const filteredPlans = filterType ? plans.filter(plan => plan.type === filterType) : plans;

  const groupedPlans = filteredPlans.reduce((acc, plan) => {
    if (!acc[plan.type]) {
      acc[plan.type] = [];
    }
    acc[plan.type].push(plan);
    return acc;
  }, {});

  Object.keys(groupedPlans).forEach(type => {
    groupedPlans[type].sort((a, b) => a.size - b.size);
  });

  const getChallengeTypeLabel = (type) => {
    switch (type) {
      case '1-step':
        return '1-Step Challenge';
      case '2-step':
        return '2-Step Challenge';
      default:
        return type;
    }
  };

  const getChallengeTypeDescription = (type) => {
    switch (type) {
      case '1-step':
        return 'Single phase evaluation';
      case '2-step':
        return 'Two phase evaluation';
      default:
        return '';
    }
  };

  const entries = Object.entries(groupedPlans);

  if (!entries.length) {
    return (
      <div className="p-4 text-center text-slate-400 border border-slate-700 rounded-lg bg-slate-800/40">
        No plans available for the selected evaluation type.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(([type, typePlans]) => (
        <div key={type} className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">
              {getChallengeTypeLabel(type)}
            </h3>
            <p className="text-slate-400 text-sm">
              {getChallengeTypeDescription(type)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {typePlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => onPlanSelect(plan.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedPlanId === plan.id
                    ? 'border-teal-400 bg-teal-400/10 text-teal-300 shadow-lg shadow-teal-400/20'
                    : 'border-slate-600 hover:border-slate-500 text-slate-300 hover:bg-slate-700/30'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    ${plan.size ? plan.size.toLocaleString() : '0'}
                  </div>
                  <div className="text-sm opacity-75 mb-2">
                    Account Size
                  </div>
                  <div className="text-lg font-semibold text-teal-400">
                    ${typeof plan.fee === 'number' ? plan.fee.toFixed(2) : '0.00'}
                  </div>
                  <div className="text-xs opacity-60">
                    Evaluation Fee
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountBalanceSelector;
