'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import useOddsStore from '../../../lib/stores/oddsStore';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Stable empty array reference for Zustand selectors
const EMPTY_ARRAY = [];

// Custom hook to get price history without Zustand infinite loop issues
const usePriceHistory = (tokenId) => {
  const [priceHistory, setPriceHistory] = useState(EMPTY_ARRAY);

  useEffect(() => {
    // Get initial value
    setPriceHistory(useOddsStore.getState().priceHistory.get(tokenId) || EMPTY_ARRAY);

    // Subscribe to changes
    const unsubscribe = useOddsStore.subscribe((state) => {
      const newHistory = state.priceHistory.get(tokenId) || EMPTY_ARRAY;
      setPriceHistory(newHistory);
    });

    return unsubscribe;
  }, [tokenId]);

  return priceHistory;
};

const ProbabilitySparkline = ({ tokenId, yesPrice }) => {
  const priceHistory = usePriceHistory(tokenId);

  if (!tokenId) {
    return (
      <div className="flex items-center justify-center h-10 w-full rounded bg-slate-700/50 text-[10px] text-gray-400 uppercase tracking-wide">
        No data
      </div>
    );
  }

  if (!priceHistory.length) {
    return (
      <div className="flex items-center justify-center h-10 w-full rounded bg-slate-700/30 text-[10px] text-gray-400 uppercase tracking-wide">
        No data
      </div>
    );
  }

  // Prepare chart data
  const values = priceHistory.map(entry => ((entry.yesProb ?? entry.yesPrice) || 0) * 100);
  if (values.length === 1) {
    values.push(values[0]);
  }

  const chartData = {
    labels: values.map((_, index) => index),
    datasets: [
      {
        data: values,
        borderColor: yesPrice > 0.5 ? '#10b981' : '#ef4444', // Green for >50%, red for <50%
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0, // Hide points
        tension: 0.1, // Slight curve
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false, // Disable tooltips for sparkline
      },
    },
    scales: {
      x: {
        display: false, // Hide x-axis
      },
      y: {
        display: false, // Hide y-axis
        min: 0,
        max: 100,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  return (
    <div style={{ height: '40px', width: '80px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ProbabilitySparkline;
