'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import toast, { Toaster } from 'react-hot-toast';

export default function DepositForm({ onClose, onSuccess, userBalance }) {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const walletClient = wallets?.[0]; // Get the first wallet
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('input'); // 'input', 'approving', 'depositing'

  const handleMaxClick = () => {
    setAmount(userBalance || '0');
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
      setAmount(value);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(userBalance || '0')) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Approve USDC
      setStep('approving');
      toast.loading('Approving USDC...', { id: 'approve' });

      // Mock approval transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('USDC approved successfully!', { id: 'approve' });

      // Step 2: Deposit
      setStep('depositing');
      toast.loading('Depositing funds...', { id: 'deposit' });

      // Mock deposit transaction
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast.success('Deposit successful! Yield accruing.', { id: 'deposit' });

      // Generate mock transaction hash
      const txHash = '0x' + Math.random().toString(16).substr(2, 64);

      setTimeout(() => {
        toast.success(
          <div>
            <p>Deposit confirmed!</p>
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
      console.error('Deposit error:', error);
      toast.error('Deposit failed. Please try again.');
    } finally {
      setIsLoading(false);
      setStep('input');
    }
  };

  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(userBalance || '0');

  return (
    <>
      <div className="deposit-modal-overlay" onClick={onClose}>
        <div className="deposit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="deposit-modal-header">
            <h3>Deposit USDC</h3>
            <button className="deposit-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="deposit-modal-body">
            {step === 'input' && (
              <>
                {/* Amount Input */}
                <div className="deposit-form-group">
                  <label className="deposit-label">Amount (USDC)</label>
                  <div className="deposit-input-wrapper">
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className="deposit-input"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="deposit-max-btn"
                      onClick={handleMaxClick}
                      disabled={isLoading}
                    >
                      Max
                    </button>
                  </div>
                  <p className="deposit-balance">
                    Balance: ${parseFloat(userBalance || '0').toLocaleString()}
                  </p>
                </div>

                {/* Slippage Slider */}
                <div className="deposit-form-group">
                  <label className="deposit-label">Slippage: {slippage}%</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.1"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value))}
                    className="deposit-slider"
                    disabled={isLoading}
                  />
                  <div className="deposit-slippage-labels">
                    <span>0.5%</span>
                    <span>1%</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="deposit-actions">
                  <button
                    className="deposit-cancel-btn"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="deposit-submit-btn"
                    onClick={handleDeposit}
                    disabled={!isValidAmount || isLoading}
                  >
                    Approve & Deposit
                  </button>
                </div>
              </>
            )}

            {step === 'approving' && (
              <div className="deposit-loading">
                <div className="deposit-spinner"></div>
                <h4>Approving USDC...</h4>
                <p>Please confirm the transaction in your wallet</p>
              </div>
            )}

            {step === 'depositing' && (
              <div className="deposit-loading">
                <div className="deposit-spinner"></div>
                <h4>Depositing Funds...</h4>
                <p>This may take a few moments</p>
              </div>
            )}
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
        .deposit-modal-overlay {
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

        .deposit-modal {
          background: var(--background);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .deposit-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .deposit-modal-header h3 {
          margin: 0;
          color: var(--text-color);
          font-size: 20px;
          font-weight: 600;
        }

        .deposit-modal-close {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .deposit-modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .deposit-modal-body {
          padding: 24px;
        }

        .deposit-form-group {
          margin-bottom: 24px;
        }

        .deposit-label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-color);
          font-size: 14px;
          font-weight: 500;
        }

        .deposit-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .deposit-input {
          width: 100%;
          padding: 12px 100px 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--text-color);
          font-size: 16px;
          transition: border-color 0.3s ease;
        }

        .deposit-input:focus {
          outline: none;
          border-color: #2DD4BF;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
        }

        .deposit-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .deposit-max-btn {
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

        .deposit-max-btn:hover:not(:disabled) {
          background: rgba(45, 212, 191, 0.2);
          border-color: rgba(45, 212, 191, 0.5);
        }

        .deposit-max-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .deposit-balance {
          margin-top: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .deposit-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .deposit-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2DD4BF;
          cursor: pointer;
          border: 2px solid white;
        }

        .deposit-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2DD4BF;
          cursor: pointer;
          border: 2px solid white;
        }

        .deposit-slippage-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .deposit-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .deposit-cancel-btn,
        .deposit-submit-btn {
          flex: 1;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .deposit-cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: var(--text-color);
        }

        .deposit-cancel-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .deposit-submit-btn {
          background: linear-gradient(135deg, #2DD4BF, #14B8A6);
          border: none;
          color: #1A1A1A;
        }

        .deposit-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(45, 212, 191, 0.4);
        }

        .deposit-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .deposit-loading {
          text-align: center;
          padding: 40px 20px;
        }

        .deposit-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(45, 212, 191, 0.2);
          border-top: 4px solid #2DD4BF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .deposit-loading h4 {
          margin: 0 0 8px 0;
          color: var(--text-color);
          font-size: 18px;
        }

        .deposit-loading p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .deposit-modal-overlay {
            padding: 16px;
          }

          .deposit-modal {
            max-width: 100%;
          }

          .deposit-modal-header,
          .deposit-modal-body {
            padding: 20px;
          }

          .deposit-actions {
            flex-direction: column;
          }

          .deposit-cancel-btn,
          .deposit-submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
