'use client';

import { useState } from 'react';

export default function ContractsPage() {
  const [selectedContract, setSelectedContract] = useState(null);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Contracts Management</h2>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-slate-700/30 p-4">
          <h3 className="mb-3 font-semibold text-white">Terms of Service</h3>
          <p className="mb-4 text-sm text-slate-300">Current version: 2.1 (Effective: Jan 2024)</p>
          <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
            View Document
          </button>
        </div>

        <div className="rounded-lg bg-slate-700/30 p-4">
          <h3 className="mb-3 font-semibold text-white">Privacy Policy</h3>
          <p className="mb-4 text-sm text-slate-300">Current version: 1.3 (Effective: Dec 2023)</p>
          <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
            View Document
          </button>
        </div>

        <div className="rounded-lg bg-slate-700/30 p-4">
          <h3 className="mb-3 font-semibold text-white">Trading Agreement</h3>
          <p className="mb-4 text-sm text-slate-300">Current version: 1.5 (Effective: Feb 2024)</p>
          <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
            View Document
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-4 font-semibold text-white">Pending Signatures</h3>
        <div className="text-slate-400">No pending contracts to review</div>
      </div>
    </div>
  );
}
