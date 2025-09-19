'use client';

import React, { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function RiskAlertBanner({ onViewPositions }) {
  const [dismissed, setDismissed] = useState(false);

  // Fetch risk data from ML-powered API with optimized config
  const { data: riskData, error } = useSWR(
    '/api/risk',
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false, // Don't revalidate on window focus
      dedupingInterval: 60000, // 1 minute deduping interval
      errorRetryCount: 2, // Retry failed requests 2 times
      errorRetryInterval: 10000, // Wait 10 seconds between retries
      suspense: false, // Don't use React Suspense
    }
  );

  if (dismissed || !riskData?.alert) return null;

  const alert = riskData.alert;
  const message = riskData.message;
  const severity = riskData.severity;

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-600/30',
          text: 'text-red-200',
          icon: 'text-red-400',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-600/30',
          text: 'text-yellow-200',
          icon: 'text-yellow-400',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      default:
        return {
          bg: 'bg-blue-900/20',
          border: 'border-blue-600/30',
          text: 'text-blue-200',
          icon: 'text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const styles = getSeverityStyles(severity);

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 ${styles.bg} border ${styles.border} rounded-lg p-4 shadow-lg`}>
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className={`w-6 h-6 flex-shrink-0 ${styles.icon}`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${styles.text} mb-1`}>
            Risk Alert: {severity.charAt(0).toUpperCase() + severity.slice(1)} Priority
          </h4>
          <p className={`text-sm ${styles.text} opacity-90`}>
            {message}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onViewPositions}
            className={`px-3 py-1.5 text-xs font-medium rounded ${styles.button} transition-colors`}
          >
            View Positions
          </button>
          <button
            onClick={() => setDismissed(true)}
            className={`p-1 rounded hover:bg-black/20 transition-colors ${styles.text}`}
            title="Dismiss alert"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
