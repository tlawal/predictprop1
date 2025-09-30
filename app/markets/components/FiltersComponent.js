'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Listbox, Dialog, Transition, Combobox, Menu } from '@headlessui/react';
import {
  ChevronUpDownIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  BookmarkIcon,
  TrashIcon,
  InformationCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  FireIcon,
  StarIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import Slider from 'react-slider';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import useSWR from 'swr';
import toast from 'react-hot-toast';

// Utility functions
const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
};

// Searchable Multi-select component
function SearchableMultiSelect({ label, options, selected, onChange, placeholder = "Search and select...", tooltip }) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    return options.filter(option =>
      option.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        {tooltip && (
          <InformationCircleIcon
            className="w-4 h-4 text-gray-400 cursor-help"
            data-tooltip-id={`${label.toLowerCase()}-tooltip`}
            data-tooltip-content={tooltip}
          />
        )}
      </div>

      <Combobox value={selected} onChange={onChange} multiple>
        <div className="relative">
          <Combobox.Input
            className="w-full rounded-lg bg-slate-700/50 py-3 pl-3 pr-10 text-gray-300 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder={placeholder}
            displayValue={() => selected.length === 0 ? '' : `${selected.length} selected`}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </Combobox.Button>

          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-700 py-1 border border-slate-600 shadow-lg">
              {filteredOptions.map((option) => (
                <Combobox.Option
                  key={option}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-teal-500/20 text-teal-300' : 'text-gray-300'
                    }`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium text-teal-400' : 'font-normal'}`}>
                        {option}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-400">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(item => (
            <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs">
              {item}
              <button
                onClick={() => onChange(selected.filter(s => s !== item))}
                className="hover:bg-teal-500/30 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Range Slider Component
function RangeSlider({ label, min, max, value, onChange, step = 1, formatValue = (v) => v, tooltip }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-300">
          {label}: {formatValue(localValue[0])} - {formatValue(localValue[1])}
        </label>
        {tooltip && (
          <InformationCircleIcon
            className="w-4 h-4 text-gray-400 cursor-help"
            data-tooltip-id={`${label.toLowerCase().replace(/\s+/g, '-')}-tooltip`}
            data-tooltip-content={tooltip}
          />
        )}
      </div>

      <div className="px-2">
        <Slider
          className="slider"
          value={localValue}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          renderTrack={(props, state) => (
            <div
              {...props}
              className={`h-1 rounded ${
                state.index === 1 ? 'bg-teal-500' : 'bg-slate-600'
              }`}
            />
          )}
          renderThumb={(props, state) => (
            <div
              {...props}
              className="w-4 h-4 bg-teal-500 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            />
          )}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}

// Date Range Picker Component
function DateRangePicker({ label, startDate, endDate, onChange, tooltip }) {
  const [dateRange, setDateRange] = useState([startDate, endDate]);

  useEffect(() => {
    setDateRange([startDate, endDate]);
  }, [startDate, endDate]);

  const handleChange = (update) => {
    setDateRange(update);
    onChange(update);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-300">
      {label}
        </label>
        {tooltip && (
          <InformationCircleIcon
            className="w-4 h-4 text-gray-400 cursor-help"
            data-tooltip-id={`${label.toLowerCase().replace(/\s+/g, '-')}-tooltip`}
            data-tooltip-content={tooltip}
          />
        )}
      </div>

      <DatePicker
        selectsRange={true}
        startDate={dateRange[0]}
        endDate={dateRange[1]}
        onChange={handleChange}
        className="w-full rounded-lg bg-slate-700/50 py-3 px-3 text-gray-300 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        placeholderText="Select date range"
        dateFormat="MMM dd, yyyy"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        calendarClassName="bg-slate-700 border-slate-600 text-gray-300"
      />
    </div>
  );
}

// Filter Preset Management
function PresetManager({ filters, onLoadPreset, onSavePreset, onDeletePreset }) {
  const [presets, setPresets] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    // Load presets from localStorage
    const saved = localStorage.getItem('marketFilterPresets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to load filter presets:', e);
      }
    }
  }, []);

  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('marketFilterPresets', JSON.stringify(updatedPresets));

    setPresetName('');
    setShowSaveDialog(false);
    toast.success(`Preset "${presetName}" saved!`);
  };

  const deletePreset = (id) => {
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    localStorage.setItem('marketFilterPresets', JSON.stringify(updatedPresets));
    toast.success('Preset deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Saved Filters</h4>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-1 px-3 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded text-xs"
        >
          <BookmarkIcon className="w-3 h-3" />
          Save Current
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="text-xs text-gray-500">No saved presets yet</p>
      ) : (
        <div className="space-y-2">
          {presets.map(preset => (
            <div key={preset.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
              <div className="flex-1">
                <div className="text-sm text-gray-300">{preset.name}</div>
                <div className="text-xs text-gray-500">
                  {new Date(preset.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onLoadPreset(preset.filters)}
                  className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs"
                >
                  Load
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center">
            <Dialog.Panel className="bg-slate-800 p-6 rounded-lg border border-slate-600 w-full max-w-md">
              <Dialog.Title className="text-lg font-medium text-white mb-4">
                Save Filter Preset
              </Dialog.Title>
              <input
                type="text"
                placeholder="Preset name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white mb-4"
                onKeyDown={(e) => e.key === 'Enter' && savePreset()}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
                >
                  Cancel
                </button>
      <button
                  onClick={savePreset}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded"
      >
                  Save
      </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// Quick preset filters
const PRESET_FILTERS = {
  'High Edge': {
    probabilityMin: 45,
    probabilityMax: 55,
    volume24hrMin: 10000,
    spreadMax: 5,
    liquidityMin: 5000
  },
  'Large Cap': {
    volumeMin: 100000,
    liquidityMin: 50000,
    probabilityMin: 30,
    probabilityMax: 70
  },
  'New Markets': {
    createdAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    volume24hrMin: 1000
  },
  'Low Risk': {
    probabilityMin: 40,
    probabilityMax: 60,
    spreadMax: 2,
    liquidityMin: 10000
  }
};

export default function FiltersComponent({
  filters,
  onFiltersChange,
  resultCount = 0,
  isModal = false,
  isMobile = false,
  isOpen = false,
  onClose = () => {},
  markets = []
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    presets: false
  });

  // Fetch categories and tags from API
  const { data: categoriesData } = useSWR('/api/markets/categories', (url) =>
    fetch(url).then(res => res.json())
  );

  const availableCategories = categoriesData?.categories || [];
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    markets.forEach(market => {
      if (market.tags && Array.isArray(market.tags)) {
        market.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            tagSet.add(tag.toLowerCase());
          }
        });
      }
    });
    return Array.from(tagSet).sort().map(tag =>
      tag.charAt(0).toUpperCase() + tag.slice(1)
    );
  }, [markets]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Auto-apply filters on change (debounced)
  const [applyTimeout, setApplyTimeout] = useState(null);
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Clear existing timeout
    if (applyTimeout) clearTimeout(applyTimeout);

    // Set new timeout for auto-apply
    const timeout = setTimeout(() => {
    onFiltersChange(newFilters);
    }, 300); // 300ms debounce

    setApplyTimeout(timeout);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    if (isMobile) onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      // Basic filters
      categories: [],
      tags: [],
      status: [],
      featured: false,
      restricted: false,

      // Advanced filters
      probabilityMin: 0,
      probabilityMax: 100,
      volumeMin: 0,
      volumeMax: 10000000,
      volume24hrMin: 0,
      volume24hrMax: 10000000,
      liquidityMin: 0,
      liquidityMax: 10000000,
      spreadMax: 20,
      createdAfter: null,
      expiresBefore: null,
      creator: '',

      // Date ranges
      dateRange: [null, null]
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    toast.success('All filters cleared');
  };

  const loadPreset = (presetFilters) => {
    const newFilters = { ...localFilters, ...presetFilters };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
    toast.success('Preset loaded');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.categories?.length > 0) count += localFilters.categories.length;
    if (localFilters.tags?.length > 0) count += localFilters.tags.length;
    if (localFilters.status?.length > 0) count += localFilters.status.length;
    if (localFilters.featured) count++;
    if (localFilters.restricted) count++;
    if (localFilters.probabilityMin > 0 || localFilters.probabilityMax < 100) count++;
    if (localFilters.volumeMin > 0 || localFilters.volumeMax < 10000000) count++;
    if (localFilters.volume24hrMin > 0 || localFilters.volume24hrMax < 10000000) count++;
    if (localFilters.liquidityMin > 0 || localFilters.liquidityMax < 10000000) count++;
    if (localFilters.spreadMax < 20) count++;
    if (localFilters.createdAfter) count++;
    if (localFilters.expiresBefore) count++;
    if (localFilters.creator) count++;
    if (localFilters.dateRange?.[0] || localFilters.dateRange?.[1]) count++;
    return count;
  }, [localFilters]);

  const content = (
    <div className="space-y-6">
      {/* Header with filter count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-300">Filters</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {resultCount} results
          </span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs">
              {activeFilterCount} active
            </span>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('presets')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Quick Presets</span>
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expandedSections.presets ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.presets && (
          <div className="grid grid-cols-2 gap-2 pl-6">
            {Object.entries(PRESET_FILTERS).map(([name, preset]) => (
              <button
                key={name}
                onClick={() => loadPreset(preset)}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded text-xs text-gray-300 hover:text-white transition-colors text-left"
              >
                {name}
              </button>
            ))}
          </div>
        )}
        </div>

      {/* Basic Filters */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('basic')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-300">Basic Filters</span>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expandedSections.basic ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.basic && (
          <div className="space-y-4 pl-2">
            {/* Categories & Tags */}
            <SearchableMultiSelect
        label="Categories"
        options={availableCategories}
              selected={localFilters.categories || []}
        onChange={(value) => handleFilterChange('categories', value)}
              placeholder="Search categories..."
              tooltip="Filter by market categories like Politics, Sports, Crypto, etc."
            />

            <SearchableMultiSelect
              label="Tags"
              options={availableTags}
              selected={localFilters.tags || []}
              onChange={(value) => handleFilterChange('tags', value)}
              placeholder="Search tags..."
              tooltip="Filter by specific market tags and keywords"
            />

            {/* Status Toggles */}
      <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-300">Market Status</label>
                <InformationCircleIcon
                  className="w-4 h-4 text-gray-400 cursor-help"
                  data-tooltip-id="market-status-tooltip"
                  data-tooltip-content="Filter by market availability and status"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'open', label: 'Active', icon: EyeIcon },
                  { key: 'closed', label: 'Resolved', icon: EyeSlashIcon },
                  { key: 'featured', label: 'Featured', icon: StarIcon },
                  { key: 'restricted', label: 'Restricted', icon: UserIcon }
                ].map(({ key, label, icon: Icon }) => (
                  <label key={key} className="flex items-center p-2 bg-slate-700/30 rounded cursor-pointer hover:bg-slate-600/30">
              <input
                type="checkbox"
                      checked={key === 'featured' || key === 'restricted'
                        ? localFilters[key] || false
                        : (localFilters.status || []).includes(key)
                      }
                onChange={(e) => {
                        if (key === 'featured' || key === 'restricted') {
                          handleFilterChange(key, e.target.checked);
                        } else {
                  const newStatus = e.target.checked
                            ? [...(localFilters.status || []), key]
                            : (localFilters.status || []).filter(s => s !== key);
                  handleFilterChange('status', newStatus);
                        }
                }}
                className="rounded border-slate-600 text-teal-500 focus:ring-teal-500 bg-slate-700/50"
              />
                    <Icon className="w-4 h-4 ml-2 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('advanced')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Advanced Filters</span>
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expandedSections.advanced ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.advanced && (
          <div className="space-y-4 pl-2">
            {/* Probability Range */}
            <RangeSlider
              label="Probability"
              min={0}
              max={100}
              value={[localFilters.probabilityMin || 0, localFilters.probabilityMax || 100]}
              onChange={([min, max]) => {
                handleFilterChange('probabilityMin', min);
                handleFilterChange('probabilityMax', max);
              }}
              step={1}
              formatValue={(v) => `${v}%`}
              tooltip="Filter by Yes probability range. Markets near 50% often have better odds."
            />

            {/* Volume Range */}
            <RangeSlider
              label="Total Volume"
              min={0}
              max={10000000}
              value={[localFilters.volumeMin || 0, localFilters.volumeMax || 10000000]}
              onChange={([min, max]) => {
                handleFilterChange('volumeMin', min);
                handleFilterChange('volumeMax', max);
              }}
              step={1000}
              formatValue={formatCurrency}
              tooltip="Filter by total trading volume across market lifetime"
            />

            {/* 24h Volume Range */}
            <RangeSlider
              label="24h Volume"
              min={0}
              max={10000000}
              value={[localFilters.volume24hrMin || 0, localFilters.volume24hrMax || 10000000]}
              onChange={([min, max]) => {
                handleFilterChange('volume24hrMin', min);
                handleFilterChange('volume24hrMax', max);
              }}
              step={1000}
              formatValue={formatCurrency}
              tooltip="Filter by trading volume in the last 24 hours"
            />

            {/* Liquidity Range */}
            <RangeSlider
              label="Liquidity"
              min={0}
              max={10000000}
              value={[localFilters.liquidityMin || 0, localFilters.liquidityMax || 10000000]}
              onChange={([min, max]) => {
                handleFilterChange('liquidityMin', min);
                handleFilterChange('liquidityMax', max);
              }}
              step={1000}
              formatValue={formatCurrency}
              tooltip="Filter by available liquidity. Higher liquidity means better tradability."
            />

            {/* Spread Range */}
            <RangeSlider
              label="Max Spread"
              min={0}
              max={20}
              value={[0, localFilters.spreadMax || 20]}
              onChange={([min, max]) => handleFilterChange('spreadMax', max)}
              step={0.1}
              formatValue={(v) => `${v.toFixed(1)}%`}
              tooltip="Maximum bid-ask spread. Lower spreads indicate better market efficiency."
            />

            {/* Date Range */}
            <DateRangePicker
              label="Created Between"
              startDate={localFilters.createdAfter}
              endDate={localFilters.createdBefore}
              onChange={([start, end]) => {
                handleFilterChange('createdAfter', start);
                handleFilterChange('createdBefore', end);
              }}
              tooltip="Filter markets created within a specific date range"
            />

            {/* Expires Before */}
            <DateRangePicker
              label="Expires Before"
              startDate={null}
              endDate={localFilters.expiresBefore}
              onChange={([start, end]) => handleFilterChange('expiresBefore', end)}
              tooltip="Only show markets that expire before this date"
            />

            {/* Creator Search */}
      <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-300">Creator</label>
                <InformationCircleIcon
                  className="w-4 h-4 text-gray-400 cursor-help"
                  data-tooltip-id="creator-tooltip"
                  data-tooltip-content="Search markets by creator username or address"
                />
              </div>
              <input
                type="text"
                placeholder="Search by creator..."
                value={localFilters.creator || ''}
                onChange={(e) => handleFilterChange('creator', e.target.value)}
                className="w-full rounded-lg bg-slate-700/50 py-3 px-3 text-gray-300 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
        </div>
        )}
      </div>

      {/* Preset Manager */}
      <PresetManager
        filters={localFilters}
        onLoadPreset={loadPreset}
        onSavePreset={() => {}} // Will be implemented
        onDeletePreset={() => {}} // Will be implemented
      />

      {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-600">
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
          >
          Apply Filters ({resultCount} results)
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>

      {/* Tooltips */}
      <Tooltip id="categories-tooltip" place="right" />
      <Tooltip id="tags-tooltip" place="right" />
      <Tooltip id="market-status-tooltip" place="right" />
      <Tooltip id="probability-tooltip" place="right" />
      <Tooltip id="total-volume-tooltip" place="right" />
      <Tooltip id="24h-volume-tooltip" place="right" />
      <Tooltip id="liquidity-tooltip" place="right" />
      <Tooltip id="max-spread-tooltip" place="right" />
      <Tooltip id="created-between-tooltip" place="right" />
      <Tooltip id="expires-before-tooltip" place="right" />
      <Tooltip id="creator-tooltip" place="right" />
    </div>
  );

  // Handle different display modes
  if (isModal) {
    return content;
  }

  if (isMobile) {
    return (
      <Transition appear show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-700 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                      Advanced Filters
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                  {content}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // Default sidebar mode
  return (
    <div className="w-80 h-full bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 overflow-y-auto">
      <div className="p-6">
      {content}
      </div>
    </div>
  );
}
