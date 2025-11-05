'use client';

import AffiliatesPanel from '../components/AffiliatesPanel';

export default function AffiliatesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="text-white">
        <h1 className="text-3xl font-semibold">Affiliates Portal</h1>
        <p className="mt-2 text-slate-300">
          Track your referrals, commissions, and customize your affiliate links.
        </p>
      </header>

      <AffiliatesPanel />
    </div>
  );
}
