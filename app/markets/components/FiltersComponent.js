'use client';

import React, { useState, useEffect } from 'react';
import { Listbox, Dialog, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useSWR from 'swr';

// Multi-select listbox component
function MultiSelectListbox({ label, options, selected, onChange, placeholder = "Select options..." }) {
  return (
    <div className="w-full">
      <Listbox value={selected} onChange={onChange} multiple>
        <div className="relative">
          <Listbox.Label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </Listbox.Label>
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-slate-700/50 py-3 pl-3 pr-10 text-left border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
            <span className="block truncate text-gray-300">
              {selected.length === 0
                ? placeholder
                : `${selected.length} selected`
              }
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-700 py-1 border border-slate-600 shadow-lg">
              {options.map((option, optionIdx) => (
                <Listbox.Option
                  key={optionIdx}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-teal-500/20 text-teal-300' : 'text-gray-300'
                    }`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium text-teal-400' : 'font-normal'
                        }`}
                      >
                        {option}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-400">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

// Filter badge component
function FilterBadge({ label, onRemove, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-200 text-blue-800',
    green: 'bg-green-200 text-green-800',
    purple: 'bg-purple-200 text-purple-800',
    red: 'bg-red-200 text-red-800',
    yellow: 'bg-yellow-200 text-yellow-800'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-black/20 rounded-full p-0.5"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function FiltersComponent({
  filters,
  onFiltersChange,
  isModal = false,
  isMobile = false,
  isOpen = false,
  onClose = () => {}
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Fetch categories from API
  const { data: categoriesData } = useSWR('/api/markets/categories', (url) =>
    fetch(url).then(res => res.json())
  );

  const availableCategories = categoriesData?.categories || [];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    if (isMobile) onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      categories: [],
      status: [],
      time: []
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const removeFilter = (type, value) => {
    const newFilters = { ...localFilters };
    newFilters[type] = newFilters[type].filter(item => item !== value);
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const content = (
    <div className="space-y-6">
      {/* Active Filters - Show in modal and sidebar */}
      {(localFilters.categories.length > 0 || localFilters.status.length > 0 || localFilters.time.length > 0) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Active Filters</h3>
          <div className="flex flex-wrap gap-2">
            {localFilters.categories.map(category => (
              <FilterBadge
                key={category}
                label={category}
                onRemove={() => removeFilter('categories', category)}
                color="blue"
              />
            ))}
            {localFilters.status.map(status => (
              <FilterBadge
                key={status}
                label={`${status} markets`}
                onRemove={() => removeFilter('status', status)}
                color="green"
              />
            ))}
            {localFilters.time.map(time => (
              <FilterBadge
                key={time}
                label={time === '<1wk' ? '< 1 Week' : time === '1-4wk' ? '1-4 Weeks' : time}
                onRemove={() => removeFilter('time', time)}
                color="purple"
              />
            ))}
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Categories Filter */}
      <MultiSelectListbox
        label="Categories"
        options={availableCategories}
        selected={localFilters.categories}
        onChange={(value) => handleFilterChange('categories', value)}
        placeholder="Select categories..."
      />

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Market Status
        </label>
        <div className="space-y-2">
          {['open', 'closed'].map(status => (
            <label key={status} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.status.includes(status)}
                onChange={(e) => {
                  const newStatus = e.target.checked
                    ? [...localFilters.status, status]
                    : localFilters.status.filter(s => s !== status);
                  handleFilterChange('status', newStatus);
                }}
                className="rounded border-slate-600 text-teal-500 focus:ring-teal-500 bg-slate-700/50"
              />
              <span className="ml-2 text-gray-300 capitalize">{status} markets</span>
            </label>
          ))}
        </div>
      </div>

      {/* Time Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Time Frame
        </label>
        <div className="space-y-2">
          {[
            { key: '<1wk', label: '< 1 Week' },
            { key: '1-4wk', label: '1-4 Weeks' }
          ].map(time => (
            <label key={time.key} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.time.includes(time.key)}
                onChange={(e) => {
                  const newTime = e.target.checked
                    ? [...localFilters.time, time.key]
                    : localFilters.time.filter(t => t !== time.key);
                  handleFilterChange('time', newTime);
                }}
                className="rounded border-slate-600 text-teal-500 focus:ring-teal-500 bg-slate-700/50"
              />
              <span className="ml-2 text-gray-300">{time.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons - Show in modal and mobile bottom sheet */}
      {(isModal || isMobile) && (
        <div className="flex gap-3 pt-4 border-t border-slate-600">
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );

  // Handle different display modes
  if (isModal) {
    // Modal mode - no wrapper needed, content is rendered in parent modal
    return content;
  }

  if (isMobile) {
    return (
      <Transition appear show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-1"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                      Filters
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-300">Filters</h3>
      {content}
    </div>
  );
}
