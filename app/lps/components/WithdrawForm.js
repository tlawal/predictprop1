'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import toast, { Toaster } from 'react-hot-toast';

export default function WithdrawForm({ onClose, onSuccess, userShares, lockPeriod }) {
  const { user } = usePrivy();
  const [shares, setShares] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);
  const [gasEstimate, setGasEstimate] = useState('0.001');

  useEffect(() => {
    // Mock lock check
    if (lockPeriod) {
      const now = Date.now();
      const lockEnd = new Date(lockPeriod).getTime();
      setLockStatus(lockEnd > now ? 'locked' : 'unlocked');
    }
  }, [lockPeriod]);

  const handleMaxClick = () => {
    setShares(userShares || '0');
  };

  const handleSharesChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setShares(value);
    }
  };

  const handleCheckLock = () => {
    if (lockPeriod) {
      const now = new Date();
      const lockEnd = new Date(lockPeriod);
      const timeLeft = lockEnd.getTime() - now.getTime();

      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        toast.error(`Funds locked for ${days}d ${hours}h`);
      } else {
        toast.success('Funds are unlocked and ready for withdrawal');
        setLockStatus('unlocked');
      }
    }
  };

  const handleWithdraw = async () => {
    if (!shares || parseFloat(shares) <= 0) {
      toast.error('Please enter a valid amount of shares');
      return;
    }

    if (parseFloat(shares) > parseFloat(userShares || '0')) {
      toast.error('Insufficient shares');
      return;
    }

    if (lockStatus === 'locked') {
      toast.error('Funds are still locked. Please wait for the lock period to end.');
      return;
    }

    setIsLoading(true);

    try {
      toast.loading('Withdrawing funds...', { id: 'withdraw' });

      // Mock withdrawal transaction
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast.success('Withdrawal successful!', { id: 'withdraw' });

      // Generate mock transaction hash
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);

      setTimeout(() => {
        toast.success(
          <div>
            <p>Withdrawal confirmed!</p>
            <a
              href={`https://polygonscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              View on PolygonScan
            </a>
          </div>,
          { duration: 5000 }
        );
      }, 1000);

      onSuccess();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Withdrawal failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidShares = shares && parseFloat(shares) > 0 && parseFloat(shares) <= parseFloat(userShares || '0');
  const canWithdraw = lockStatus !== 'locked' && isValidShares;

  return (
    <>
      <div className="withdraw-modal-overlay" onClick={onClose}>
        <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
          <div className="withdraw-modal-header">
            <h3>Withdraw Funds</h3>
            <button className="withdraw-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="withdraw-modal-body">
            {/* Shares Input */}
            <div className="withdraw-form-group">
              <label className="withdraw-label">ppLP Shares</label>
              <div className="withdraw-input-wrapper">
                <input
                  type="text"
                  value={shares}
                  onChange={handleSharesChange}
                  placeholder="0.00"
                  className="withdraw-input"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="withdraw-max-btn"
                  onClick={handleMaxClick}
                  disabled={isLoading}
                >
                  Max
                </button>
              </div>
              <p className="withdraw-balance">
                Available: {parseFloat(userShares || '0').toLocaleString()} shares
              </p>
            </div>

            {/* Lock Status */}
            <div className="withdraw-lock-status">
              <div className="withdraw-lock-header">
                <span className="withdraw-lock-label">Lock Status</span>
                <button
                  className="withdraw-check-btn"
                  onClick={handleCheckLock}
                  disabled={isLoading}
                >
                  Check Lock
                </button>
              </div>

              {lockStatus === 'locked' && (
                <div className="withdraw-lock-warning">
                  <span className="withdraw-warning-icon">⚠️</span>
                  <span className="withdraw-warning-text">
                    Funds are locked until {lockPeriod ? new Date(lockPeriod).toLocaleDateString() : 'lock period ends'}
                  </span>
                </div>
              )}

              {lockStatus === 'unlocked' && (
                <div className="withdraw-lock-success">
                  <span className="withdraw-success-icon">✅</span>
                  <span className="withdraw-success-text">Funds are unlocked and ready for withdrawal</span>
                </div>
              )}
            </div>

            {/* Gas Estimate */}
            <div className="withdraw-gas-estimate">
              <span className="withdraw-gas-label">Estimated Gas:</span>
              <span className="withdraw-gas-value">~{gasEstimate} MATIC</span>
            </div>

            {/* Action Buttons */}
            <div className="withdraw-actions">
              <button
                className="withdraw-cancel-btn"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="withdraw-submit-btn"
                onClick={handleWithdraw}
                disabled={!canWithdraw || isLoading}
              >
                {isLoading ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #374151',
          },
        }}
      />

      <style jsx>{`
        .withdraw-modal-overlay {
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

        .withdraw-modal {
          background: var(--background);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .withdraw-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .withdraw-modal-header h3 {
          margin: 0;
          color: var(--text-color);
          font-size: 20px;
          font-weight: 600;
        }

        .withdraw-modal-close {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .withdraw-modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .withdraw-modal-body {
          padding: 24px;
        }

        .withdraw-form-group {
          margin-bottom: 24px;
        }

        .withdraw-label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-color);
          font-size: 14px;
          font-weight: 500;
        }

        .withdraw-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .withdraw-input {
          width: 100%;
          padding: 12px 100px 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text-color);
          font-size: 16px;
          transition: border-color 0.3s ease;
        }

        .withdraw-input:focus {
          outline: none;
          border-color: #2DD4BF;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
        }

        .withdraw-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .withdraw-max-btn {
          position: absolute;
          right: 12px;
          padding: 6px 12px;
          background: rgba(45, 212, 191, 0.1);
          border: 1px solid rgba(45, 212, 191, 0.3);
          border-radius: 6px;
          color: #2DD4BF;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .withdraw-max-btn:hover:not(:disabled) {
          background: rgba(45, 212, 191, 0.2);
          border-color: rgba(45, 212, 191, 0.5);
        }

        .withdraw-max-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .withdraw-balance {
          margin-top: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .withdraw-lock-status {
          margin-bottom: 24px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .withdraw-lock-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .withdraw-lock-label {
          color: var(--text-color);
          font-size: 14px;
          font-weight: 500;
        }

        .withdraw-check-btn {
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          color: #3B82F6;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .withdraw-check-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .withdraw-check-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .withdraw-lock-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #EF4444;
        }

        .withdraw-warning-icon {
          font-size: 16px;
        }

        .withdraw-warning-text {
          font-size: 14px;
          font-weight: 500;
        }

        .withdraw-lock-success {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #22C55E;
        }

        .withdraw-success-icon {
          font-size: 16px;
        }

        .withdraw-success-text {
          font-size: 14px;
          font-weight: 500;
        }

        .withdraw-gas-estimate {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .withdraw-gas-label {
          color: var(--text-color);
          font-size: 14px;
          font-weight: 500;
        }

        .withdraw-gas-value {
          color: #2DD4BF;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        .withdraw-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .withdraw-cancel-btn,
        .withdraw-submit-btn {
          flex: 1;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .withdraw-cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: var(--text-color);
        }

        .withdraw-cancel-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .withdraw-submit-btn {
          background: linear-gradient(135deg, #2DD4BF, #14B8A6);
          border: none;
          color: #1A1A1A;
        }

        .withdraw-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(45, 212, 191, 0.4);
        }

        .withdraw-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .withdraw-modal-overlay {
            padding: 16px;
          }

          .withdraw-modal {
            max-width: 100%;
          }

          .withdraw-modal-header,
          .withdraw-modal-body {
            padding: 20px;
          }

          .withdraw-actions {
            flex-direction: column;
          }

          .withdraw-cancel-btn,
          .withdraw-submit-btn {
            width: 100%;
          }

          .withdraw-lock-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
}
