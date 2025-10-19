'use client';

import React from 'react';

export default function PayoutsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Payouts</h1>
        <p className="text-gray-400 mt-2">Manage your payout requests and history</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Payout History</h2>
        <p className="text-gray-400">No payout history available</p>
      </div>
    </div>
  );
}
