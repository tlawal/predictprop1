'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrivy } from '@privy-io/react-auth';
import useSWR from 'swr';
import { Copy, ExternalLink, Users, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AffiliatesPanel() {
  const { t } = useTranslation();
  const { user } = usePrivy();
  const [customUrl, setCustomUrl] = useState('');

  // Fetch affiliate data
  const { data: affiliateData, error, isLoading, mutate } = useSWR(
    user ? `/api/affiliates?userId=${user.id}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const handleCopyCode = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleUpdateCustomUrl = async () => {
    if (!customUrl.trim()) return;

    try {
      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          customUrl: customUrl.trim()
        })
      });

      if (response.ok) {
        toast.success('Custom URL updated successfully!');
        mutate(); // Refresh data
        setCustomUrl('');
      } else {
        toast.error('Failed to update custom URL');
      }
    } catch (error) {
      toast.error('Error updating custom URL');
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'text-yellow-600 bg-yellow-100',
      silver: 'text-gray-600 bg-gray-100',
      gold: 'text-yellow-500 bg-yellow-50',
      platinum: 'text-purple-600 bg-purple-100'
    };
    return colors[tier] || colors.bronze;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
        <div className="text-center">
          <p className="text-red-400">Failed to load affiliate data</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
        <div className="text-center">
          <p className="text-slate-400">Loading affiliate program...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Affiliate Overview */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Affiliate Program
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Total Referrals</div>
            <div className="text-2xl font-bold text-white">{affiliateData.totalReferrals}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Active Referrals</div>
            <div className="text-2xl font-bold text-green-400">{affiliateData.activeReferrals}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Total Earned</div>
            <div className="text-2xl font-bold text-yellow-400">${affiliateData.totalEarned}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Pending Payout</div>
            <div className="text-2xl font-bold text-blue-400">${affiliateData.pendingPayout}</div>
          </div>
        </div>

        {/* Tier Status */}
        <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
          <div>
            <div className="text-white font-medium">Current Tier</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getTierColor(affiliateData.tier)}`}>
              {affiliateData.tier} - {affiliateData.tierPayout}% Payout
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-sm">Next Tier</div>
            <div className="text-white text-sm">
              {affiliateData.tier === 'platinum' ? 'Max Tier Reached' : 'Gold (15% payout)'}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Links */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Referral Links</h4>

        <div className="space-y-4">
          {/* Affiliate Code */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Affiliate Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={affiliateData.affiliateCode}
                readOnly
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <button
                onClick={() => handleCopyCode(affiliateData.affiliateCode)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          {/* Referral URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Referral URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={affiliateData.referralUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
              />
              <button
                onClick={() => handleCopyCode(affiliateData.referralUrl)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <a
                href={affiliateData.referralUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Visit
              </a>
            </div>
          </div>

          {/* Custom URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Custom URL (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="your-custom-slug"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <button
                onClick={handleUpdateCustomUrl}
                disabled={!customUrl.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg"
              >
                Update
              </button>
            </div>
            {affiliateData.customUrl && (
              <div className="mt-2 p-2 bg-slate-700/50 rounded text-sm text-slate-300">
                Current: <code>{affiliateData.customUrl}</code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Recent Referrals</h4>

        {affiliateData.recentReferrals?.length > 0 ? (
          <div className="space-y-3">
            {affiliateData.recentReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <div className="text-white font-medium">{referral.email}</div>
                  <div className="text-slate-400 text-sm">
                    Joined {new Date(referral.joinedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  referral.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {referral.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No referrals yet</p>
            <p className="text-sm">Share your referral link to start earning!</p>
          </div>
        )}
      </div>

      {/* Tier Requirements */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tier Requirements
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(affiliateData.tierRequirements).map(([tier, requirements]) => (
            <div
              key={tier}
              className={`p-4 rounded-lg border ${
                affiliateData.tier === tier
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium capitalize ${affiliateData.tier === tier ? 'text-blue-400' : 'text-white'}`}>
                  {tier}
                </span>
                <span className="text-sm text-slate-400">
                  {tier === affiliateData.tier ? 'Current' : `${getTierPayout(tier)}% payout`}
                </span>
              </div>
              <div className="text-sm text-slate-400">
                {requirements.referrals} referrals • ${requirements.volume} volume
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function for tier payout (should match API)
function getTierPayout(tier) {
  const payouts = {
    bronze: 5,
    silver: 10,
    gold: 15,
    platinum: 20
  };
  return payouts[tier] || 5;
}
