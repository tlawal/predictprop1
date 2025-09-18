'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MarketsTable from './components/MarketsTable';
import OrderModal from './components/OrderModal';
// Removed old oddsStore import - now using usePolymarketWebSocket hook

function MarketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'open'); // Default to open/active markets
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  // Removed old oddsStore usage - now handled by MarketsTable component

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedStatus) params.set('status', selectedStatus);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/markets';
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, selectedCategory, selectedStatus, router]);

  // Set predefined categories on mount
  useEffect(() => {
    // Use predefined categories that are commonly used in Polymarket
    const predefinedCategories = [
      'Politics',
      'Crypto',
      'Sports',
      'Economics',
      'Tech',
      'Entertainment',
      'Weather',
      'Science',
      'Health',
      'International'
    ];
    setCategories(predefinedCategories);
  }, []);

  const handleMarketClick = (market) => {
    setSelectedMarket(market);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMarket(null);
  };

  const toggleCategory = (category) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const toggleStatus = (status) => {
    setSelectedStatus(selectedStatus === status ? '' : status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-teal-500/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <span className="text-2xl">🚀</span>
            <span className="text-sm font-semibold text-white">Live Markets</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Explore Live Prediction Markets
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Trade on real-world events with live odds updates and instant execution
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 text-lg bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:border-r-0 lg:bg-transparent ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6">
              {/* Mobile close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">Filters</h2>
              
              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Category</h3>
                <div className="space-y-2">
                  {['politics', 'crypto', 'sports', 'economics'].map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        selectedCategory === category
                          ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                          : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="capitalize">{category}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Status</h3>
                <div className="space-y-2">
                  {['open', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        selectedStatus === status
                          ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                          : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="capitalize">{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedStatus('');
                  setSearchQuery('');
                }}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-all"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Mobile filter button */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
              </button>
            </div>

            {/* Markets Table */}
            <MarketsTable
              searchQuery={debouncedSearch}
              category={selectedCategory}
              status={selectedStatus}
              onMarketClick={handleMarketClick}
            />
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {modalOpen && selectedMarket && (
        <OrderModal
          market={selectedMarket}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading markets...</div>
      </div>
    }>
      <MarketsPageContent />
    </Suspense>
  );
}