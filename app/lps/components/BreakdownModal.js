'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function BreakdownModal({ onClose, breakdown, aiRecommendations }) {
  const chartRef = useRef(null);

  // Default breakdown if none provided
  const defaultBreakdown = breakdown || { fees: 60, splits: 40 };
  const defaultRecommendations = aiRecommendations || {
    fees: 70,
    splits: 30,
    description: "70% low-risk traders, 30% market makers for optimal yield"
  };

  const currentData = {
    labels: ['Fees', 'Splits'],
    datasets: [{
      data: [defaultBreakdown.fees, defaultBreakdown.splits],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(34, 197, 94, 1)',
      ],
      borderWidth: 2,
    }],
  };

  const recommendedData = {
    labels: ['Fees (Recommended)', 'Splits (Recommended)'],
    datasets: [{
      data: [defaultRecommendations.fees, defaultRecommendations.splits],
      backgroundColor: [
        'rgba(168, 85, 247, 0.8)',
        'rgba(251, 191, 36, 0.8)',
      ],
      borderColor: [
        'rgba(168, 85, 247, 1)',
        'rgba(251, 191, 36, 1)',
      ],
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
          label: function(context) {
            const value = context.parsed;
            return `${context.label}: ${value}% ($${Math.round(value * 2.5)} est.)`;
          },
        },
      },
    },
  };

  return (
    <div className="breakdown-modal-overlay" onClick={onClose}>
      <div className="breakdown-modal" onClick={(e) => e.stopPropagation()}>
        <div className="breakdown-modal-header">
          <h3>Yield Breakdown</h3>
          <button className="breakdown-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="breakdown-modal-body">
          {/* Current Allocation */}
          <div className="breakdown-section">
            <h4 className="breakdown-section-title">Current Allocation</h4>
            <div className="breakdown-chart">
              <Pie data={currentData} options={options} />
            </div>
            <div className="breakdown-stats">
              <div className="breakdown-stat">
                <span className="stat-label">Fees:</span>
                <span className="stat-value">{defaultBreakdown.fees}%</span>
              </div>
              <div className="breakdown-stat">
                <span className="stat-label">Splits:</span>
                <span className="stat-value">{defaultBreakdown.splits}%</span>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="breakdown-section">
            <h4 className="breakdown-section-title">
              🤖 AI Recommendations
            </h4>
            <div className="breakdown-chart">
              <Pie data={recommendedData} options={options} />
            </div>
            <div className="breakdown-recommendation">
              <p className="recommendation-text">{defaultRecommendations.description}</p>
              <div className="recommendation-stats">
                <div className="breakdown-stat">
                  <span className="stat-label">Fees:</span>
                  <span className="stat-value recommended">{defaultRecommendations.fees}%</span>
                </div>
                <div className="breakdown-stat">
                  <span className="stat-label">Splits:</span>
                  <span className="stat-value recommended">{defaultRecommendations.splits}%</span>
                </div>
              </div>
              <div className="recommendation-benefit">
                <span className="benefit-icon">📈</span>
                <span className="benefit-text">Potential +2.3% APY improvement</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="breakdown-actions">
            <button className="breakdown-cancel-btn" onClick={onClose}>
              Close
            </button>
            <button className="breakdown-optimize-btn">
              Apply AI Recommendations
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .breakdown-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .breakdown-modal {
          background: var(--background);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .breakdown-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .breakdown-modal-header h3 {
          margin: 0;
          color: var(--text-color);
          font-size: 20px;
          font-weight: 600;
        }

        .breakdown-modal-close {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .breakdown-modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .breakdown-modal-body {
          padding: 24px;
        }

        .breakdown-section {
          margin-bottom: 32px;
        }

        .breakdown-section-title {
          color: var(--text-color);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breakdown-chart {
          height: 250px;
          margin-bottom: 16px;
        }

        .breakdown-stats {
          display: flex;
          justify-content: space-around;
          gap: 20px;
        }

        .breakdown-stat {
          text-align: center;
        }

        .stat-label {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          color: var(--text-color);
          font-size: 18px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }

        .stat-value.recommended {
          color: #2DD4BF;
        }

        .breakdown-recommendation {
          margin-top: 16px;
          padding: 16px;
          background: rgba(45, 212, 191, 0.05);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 8px;
        }

        .recommendation-text {
          color: var(--text-color);
          font-size: 14px;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .recommendation-stats {
          display: flex;
          justify-content: space-around;
          gap: 20px;
          margin-bottom: 12px;
        }

        .recommendation-benefit {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 6px;
        }

        .benefit-icon {
          font-size: 14px;
        }

        .benefit-text {
          color: #22C55E;
          font-size: 12px;
          font-weight: 600;
        }

        .breakdown-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .breakdown-cancel-btn,
        .breakdown-optimize-btn {
          flex: 1;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .breakdown-cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: var(--text-color);
        }

        .breakdown-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .breakdown-optimize-btn {
          background: linear-gradient(135deg, #2DD4BF, #14B8A6);
          border: none;
          color: #1A1A1A;
        }

        .breakdown-optimize-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(45, 212, 191, 0.4);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .breakdown-modal-overlay {
            padding: 16px;
          }

          .breakdown-modal {
            max-width: 100%;
          }

          .breakdown-modal-header,
          .breakdown-modal-body {
            padding: 20px;
          }

          .breakdown-stats {
            flex-direction: column;
            gap: 12px;
          }

          .recommendation-stats {
            flex-direction: column;
            gap: 8px;
          }

          .breakdown-actions {
            flex-direction: column;
          }

          .breakdown-cancel-btn,
          .breakdown-optimize-btn {
            width: 100%;
          }

          .breakdown-chart {
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
}
