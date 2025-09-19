'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function YieldGraph({ yieldData }) {
  const chartRef = useRef(null);

  // Generate mock data if no real data provided
  const mockData = yieldData.length > 0 ? yieldData : generateMockData();

  function generateMockData() {
    const data = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const baseYield = Math.random() * 100 + 50;
      const fees = baseYield * 0.6; // 60% fees
      const splits = baseYield * 0.4; // 40% splits

      data.push({
        date: date.toISOString().split('T')[0],
        fees: Math.round(fees * 100) / 100,
        splits: Math.round(splits * 100) / 100,
        total: Math.round(baseYield * 100) / 100,
      });
    }

    return data;
  }

  const data = {
    labels: mockData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Fees',
        data: mockData.map(item => item.fees),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Splits',
        data: mockData.map(item => item.splits),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Total Yield',
        data: mockData.map(item => item.total),
        borderColor: 'rgba(0, 0, 0, 0.8)',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(45, 212, 191, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            const date = new Date(mockData[context[0].dataIndex].date);
            return date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          },
          label: function(context) {
            const value = context.parsed.y;
            const label = context.dataset.label;
            return `${label}: $${value.toFixed(2)}`;
          },
          afterBody: function(context) {
            if (context.length > 1) {
              const total = context.reduce((sum, item) => sum + item.parsed.y, 0);
              return `\nTotal: $${total.toFixed(2)}`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: 'Date',
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11,
          },
          callback: function(value) {
            return '$' + value.toFixed(0);
          },
        },
        title: {
          display: true,
          text: 'Yield ($)',
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
    },
    elements: {
      point: {
        hoverBorderWidth: 2,
        hoverBorderColor: 'rgba(255, 255, 255, 0.5)',
      },
    },
  };

  return (
    <div className="yield-graph-container">
      <div className="yield-graph-wrapper">
        <Line ref={chartRef} data={data} options={options} />
      </div>

      <style jsx>{`
        .yield-graph-container {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .yield-graph-wrapper {
          height: 400px;
          width: 100%;
          position: relative;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .yield-graph-container {
            padding: 16px;
          }

          .yield-graph-wrapper {
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
