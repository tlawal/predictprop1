'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Chart.js components to avoid SSR issues
const LineChart = dynamic(() => import('./ChartComponent'), {
  ssr: false,
  loading: () => <div className="h-80 bg-slate-700/50 rounded flex items-center justify-center">Loading chart...</div>
});

export default function EquityCurveChart({ equityHistory, positions }) {
  const [chartRef, setChartRef] = useState(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Create annotations for position end dates
  const annotations = {};
  positions.forEach((position, index) => {
    if (position.status === 'open') {
      const endDate = new Date(position.endDate);
      annotations[`endDate_${index}`] = {
        type: 'line',
        xMin: endDate.getTime(),
        xMax: endDate.getTime(),
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        borderDash: [5, 5],
        label: {
          content: `Expires: ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          enabled: true,
          position: 'top',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          font: {
            size: 10
          },
          padding: 4
        }
      };
    }
  });

  const data = {
    datasets: [
      {
        label: 'Equity Curve',
        data: equityHistory.map(point => ({
          x: new Date(point.timestamp).getTime(),
          y: point.equity,
          pnlDelta: point.pnlDelta,
          tradeId: point.tradeId
        })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(59, 130, 246)',
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.1,
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
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          },
          label: function(context) {
            const point = context.raw;
            return [
              `Equity: ${formatCurrency(point.y)}`,
              `P&L Delta: ${formatCurrency(point.pnlDelta)}`
            ];
          }
        }
      },
      annotation: {
        annotations: annotations
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
        limits: {
          x: {
            min: new Date('2025-01-01').getTime(),
            max: new Date('2025-12-31').getTime(),
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: {
            month: 'MMM yyyy',
            day: 'MMM d',
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Date',
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value) {
            return formatCurrency(value);
          },
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Equity ($)',
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        }
      },
    },
    elements: {
      point: {
        hoverBorderWidth: 2,
        hoverBorderColor: 'rgba(255, 255, 255, 0.5)',
      }
    }
  };

  // Reset zoom function
  const resetZoom = () => {
    if (chartRef) {
      chartRef.resetZoom();
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Equity Curve</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetZoom}
            className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded transition-colors"
            title="Reset zoom"
          >
            Reset Zoom
          </button>
          <div className="text-xs text-gray-500">
            Drag to zoom • Ctrl+drag to pan
          </div>
        </div>
      </div>

      <LineChart
        data={data}
        options={options}
        onChartRef={setChartRef}
      />

      {/* Chart Legend */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Equity Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 border-t border-dashed border-white opacity-30"></div>
            <span>Market Expiry</span>
          </div>
        </div>
        <div className="text-gray-500">
          Starting balance: $5,000
        </div>
      </div>
    </div>
  );
}
