'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

export default function VaultStatsCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  aiInsight,
  onClick,
  disabled = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Fetch yield data for APY card
  const { data: yieldData } = useSWR(
    title === 'Projected APY' ? '/api/yield?tvl=50000' : null,
    (url) => fetch(url).then(res => res.json()),
    { refreshInterval: 300000 } // 5 minutes
  );

  // Update value if we have yield data
  const displayValue = title === 'Projected APY' && yieldData?.apy
    ? `${yieldData.apy}%`
    : value;

  const displayAiInsight = title === 'Projected APY' && yieldData?.aiInsight
    ? yieldData.aiInsight
    : aiInsight;

  const formatValue = (val, type) => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  const getValueType = () => {
    if (title.includes('TVL') || title.includes('Yield')) return 'currency';
    return 'text';
  };

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div
      className={`vault-stats-card ${isHovered && !disabled ? 'hovered' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className="vault-stats-card-header">
        <div className="vault-stats-card-icon">
          <span className="icon-emoji">{icon}</span>
        </div>
        {badge && (
          <div className="vault-stats-badge">
            <span>{badge}</span>
          </div>
        )}
      </div>

        <div className="vault-stats-card-content">
        <h3 className="vault-stats-title">{title}</h3>
        <div className="vault-stats-value">
          {formatValue(displayValue, getValueType())}
        </div>
        <p className="vault-stats-subtitle">{subtitle}</p>

        {displayAiInsight && (
          <div className="vault-stats-ai-insight">
            <span className="ai-icon">🤖</span>
            <span className="ai-text">{displayAiInsight}</span>
          </div>
        )}
      </div>

      <div className="vault-stats-card-border"></div>

      <style jsx>{`
        .vault-stats-card {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .vault-stats-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(45, 212, 191, 0.3);
          border-color: rgba(45, 212, 191, 0.4);
        }

        .vault-stats-card.hovered::before {
          opacity: 1;
        }

        .vault-stats-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.1), transparent);
          transition: left 0.6s ease;
          opacity: 0;
        }

        .vault-stats-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .vault-stats-card-icon {
          width: 48px;
          height: 48px;
          background: rgba(45, 212, 191, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-emoji {
          font-size: 24px;
        }

        .vault-stats-badge {
          background: linear-gradient(135deg, #2DD4BF, #14B8A6);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .vault-stats-card-content {
          flex: 1;
          position: relative;
          z-index: 2;
        }

        .vault-stats-title {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .vault-stats-value {
          font-size: 32px;
          font-weight: 800;
          color: #2DD4BF;
          margin-bottom: 4px;
          font-family: 'Courier New', monospace;
        }

        .vault-stats-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 12px;
        }

        .vault-stats-ai-insight {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(45, 212, 191, 0.05);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 8px;
        }

        .ai-icon {
          font-size: 12px;
        }

        .ai-text {
          font-size: 11px;
          color: #2DD4BF;
          font-weight: 500;
        }

        .vault-stats-card-border {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            rgba(45, 212, 191, 0.5),
            rgba(30, 58, 138, 0.5),
            rgba(45, 212, 191, 0.5));
          border-radius: 0 0 16px 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .vault-stats-card:hover .vault-stats-card-border {
          opacity: 1;
        }

        .vault-stats-card.disabled {
          opacity: 0.6;
          filter: grayscale(20%);
        }

        .vault-stats-card.disabled:hover {
          transform: none;
          box-shadow: none;
          border-color: rgba(45, 212, 191, 0.1);
        }

        .vault-stats-card.disabled .vault-stats-value {
          color: rgba(45, 212, 191, 0.5);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .vault-stats-card {
            padding: 20px;
            min-height: 160px;
          }

          .vault-stats-card-icon {
            width: 40px;
            height: 40px;
          }

          .icon-emoji {
            font-size: 20px;
          }

          .vault-stats-title {
            font-size: 13px;
          }

          .vault-stats-value {
            font-size: 28px;
          }

          .vault-stats-subtitle {
            font-size: 11px;
          }

          .vault-stats-ai-insight {
            padding: 6px 10px;
          }

          .ai-text {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
