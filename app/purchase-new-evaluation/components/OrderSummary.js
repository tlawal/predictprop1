import React from 'react';

const OrderSummary = ({ accountType, selectedPlan, affiliateDiscount, selectedAddons, total }) => {
  if (!selectedPlan) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="text-center text-slate-400">Loading plan details...</div>
      </div>
    );
  }

  const originalPrice = selectedPlan.fee;
  const discountAmount = (originalPrice * affiliateDiscount) / 100;
  const finalPrice = total;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 sticky top-6">
      <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>

      {/* Account Type */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-medium text-white">{selectedPlan.name}</h3>
            <p className="text-slate-400 text-sm">${selectedPlan.balance.toLocaleString()} Starting Balance</p>
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="border-t border-slate-700 pt-4 space-y-3">
        {/* Original Price */}
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Evaluation Fee</span>
          <span className="text-white">${originalPrice.toFixed(2)}</span>
        </div>

        {/* Add-ons */}
        {selectedAddons.map((addon) => (
          <div key={addon.id} className="flex justify-between items-center">
            <span className="text-slate-300">{addon.name}</span>
            <span className="text-white">+${addon.price.toFixed(2)}</span>
          </div>
        ))}

        {/* Affiliate Discount */}
        {affiliateDiscount > 0 && (
          <div className="flex justify-between items-center text-green-400">
            <span>Affiliate Discount ({affiliateDiscount}%)</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex justify-between items-center border-t border-slate-600 pt-3">
          <span className="text-white font-medium">Total</span>
          <span className="text-2xl font-bold text-teal-400">${finalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* What's Included */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <h4 className="text-white font-medium mb-3">What&apos;s Included:</h4>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
            ${selectedPlan.balance.toLocaleString()} virtual trading account
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
            Real-time market data access
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
            Advanced trading analytics
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
            Performance tracking dashboard
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-teal-400 rounded-full mr-3 flex-shrink-0"></span>
            Risk management tools
          </li>
        </ul>
      </div>

      {/* Challenge Rules Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <h4 className="text-white font-medium mb-3">Challenge Rules:</h4>
        <div className="space-y-2 text-sm text-slate-300">
          {accountType === '1-step' ? (
            <>
              <div className="flex justify-between">
                <span>Profit Target:</span>
                <span className="text-teal-400">8%</span>
              </div>
              <div className="flex justify-between">
                <span>Maximum Drawdown:</span>
                <span className="text-red-400">5%</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum Trading Days:</span>
                <span className="text-yellow-400">5 days</span>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-teal-400 font-medium mb-2">Phase 1</h5>
                  <div className="space-y-1 text-xs">
                    <div>Profit Target: <span className="text-teal-400">8%</span></div>
                    <div>Max Drawdown: <span className="text-red-400">5%</span></div>
                    <div>Min Days: <span className="text-yellow-400">5</span></div>
                  </div>
                </div>
                <div>
                  <h5 className="text-teal-400 font-medium mb-2">Phase 2</h5>
                  <div className="space-y-1 text-xs">
                    <div>Profit Target: <span className="text-teal-400">5%</span></div>
                    <div>Max Drawdown: <span className="text-red-400">5%</span></div>
                    <div>Min Days: <span className="text-yellow-400">5</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-slate-400">
            Your billing information is encrypted and secure. We never store payment method details.
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
