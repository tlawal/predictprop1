import React from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

const AddOnsSection = ({ selectedAddons, onAddonToggle }) => {
  // Fetch add-ons from API
  const { data: addonsData, error, isLoading } = useSWR('/api/addons', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: false
  });

  const addons = addonsData?.addons || [];

  const handleAddonChange = (addon, checked) => {
    if (checked) {
      onAddonToggle([...selectedAddons, addon]);
    } else {
      onAddonToggle(selectedAddons.filter(a => a.id !== addon.id));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Add-Ons</h2>
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading add-ons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Add-Ons</h2>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">Failed to load add-ons</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (addons.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Add-Ons</h2>
        <div className="text-center py-8">
          <p className="text-slate-400">No add-ons available at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Add-Ons</h2>
      <p className="text-slate-400 text-sm mb-6">
        Enhance your evaluation with optional features. Add-ons are billed once and applied to your account immediately.
      </p>

      <div className="space-y-4">
        {addons.map((addon) => {
          const isSelected = selectedAddons.some(a => a.id === addon.id);

          return (
            <div
              key={addon.id}
              className={`p-4 rounded-lg border transition-colors ${
                isSelected
                  ? 'border-teal-400 bg-teal-400/10'
                  : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={`addon-${addon.id}`}
                  checked={isSelected}
                  onChange={(e) => handleAddonChange(addon, e.target.checked)}
                  className="mt-1 w-4 h-4 text-teal-400 bg-slate-700 border-slate-600 rounded focus:ring-teal-400"
                />

                <div className="flex-1">
                  <label
                    htmlFor={`addon-${addon.id}`}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h3 className="text-white font-medium">{addon.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">{addon.description}</p>
                    </div>
                    <div className="text-teal-400 font-bold text-lg">
                      +${addon.price}
                    </div>
                  </label>

                  {/* Show parameter details when selected */}
                  {isSelected && addon.param_value && (
                    <div className="mt-3 p-3 bg-slate-600/30 rounded-lg border border-slate-500">
                      <div className="text-xs text-slate-300">
                        <strong>Parameters:</strong>
                        <pre className="mt-1 text-xs bg-slate-700/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(addon.param_value, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedAddons.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Add-ons total:</span>
            <span className="text-teal-400 font-bold">
              +${selectedAddons.reduce((sum, addon) => sum + addon.price, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOnsSection;
