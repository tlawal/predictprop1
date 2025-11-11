'use client';

import React, { useState } from 'react';
import CertGenerator from './CertGenerator';

export default function ProgressTracker({ challengeData, challengeSize, onChallengeComplete, isDemoMode = true }) {
  const [showCertificate, setShowCertificate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data - in real implementation this would come from props
  const phase1Target = (challengeSize * 0.06); // 6% ROI target
  const phase1Progress = challengeData?.phase1Progress || 0;
  const phase1Percentage = Math.min((phase1Progress / phase1Target) * 100, 100);

  const legacyWinRate = challengeData?.winRate;
  const accuracyValue = (() => {
    if (typeof challengeData?.accuracy === 'number') {
      return challengeData.accuracy;
    }
    if (typeof legacyWinRate === 'number') {
      return legacyWinRate > 1 ? legacyWinRate : legacyWinRate * 100;
    }
    return 0;
  })();
  const accuracyPercentage = Math.min(Math.max(accuracyValue, 0), 100);

  const resolvedMarkets = challengeData?.resolvedMarkets || 0;
  const totalMarkets = 10; // Minimum required for phase 1

  const drawdown = challengeData?.maxDrawdown || 0;
  const exposure = challengeData?.maxExposure || 0;

  // Check if challenge is completed
  const isChallengeCompleted = () => {
    return (
      phase1Percentage >= 100 &&
      accuracyPercentage >= 70 &&
      resolvedMarkets >= totalMarkets &&
      drawdown <= 5 &&
      exposure <= 15
    );
  };

  const handleEndChallenge = async () => {
    if (!isChallengeCompleted() || isProcessing) return;

    setIsProcessing(true);
    try {
      if (onChallengeComplete) {
        await onChallengeComplete();
      }
      setShowCertificate(true);
    } catch (error) {
      console.error('Error ending challenge:', error);
      alert('Error ending challenge. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Phase Progress Bars */}
      <div className={`backdrop-blur-sm rounded-2xl p-6 ${
        isDemoMode
          ? 'bg-slate-800/50 border-2 border-yellow-500/50'
          : 'bg-slate-800/50 border border-green-500/50'
      }`}>
        <h3 className="text-lg font-semibold text-white mb-6">Challenge Progress</h3>

        <div className="space-y-6">
          {/* Phase 1 Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">Phase 1</span>
                <span className="text-xs text-gray-500">Min 6% ROI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {formatCurrency(phase1Progress)} / {formatCurrency(phase1Target)}
                </span>
                <span className={`text-sm font-medium ${phase1Percentage >= 100 ? 'text-green-400' : 'text-gray-300'}`}>
                  {formatPercentage(phase1Percentage)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  phase1Percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${phase1Percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Accuracy Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-300">Accuracy</span>
                <span className="text-xs text-gray-500">Min 70%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Target: 70%</span>
                <span className={`text-sm font-medium ${accuracyPercentage >= 70 ? 'text-green-400' : 'text-gray-300'}`}>
                  {formatPercentage(accuracyPercentage)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  accuracyPercentage >= 70 ? 'bg-green-500' : accuracyPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${accuracyPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Resolved Markets */}
        <div className={`backdrop-blur-sm rounded-2xl p-6 ${
          isDemoMode
            ? 'bg-slate-800/50 border border-yellow-500/30'
            : 'bg-slate-800/50 border border-green-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Resolved Markets</p>
              <p className="text-2xl font-bold text-white">{resolvedMarkets}/10</p>
            </div>
            <div className={`p-2 rounded-lg ${resolvedMarkets >= 10 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              📊
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className={`backdrop-blur-sm rounded-2xl p-6 ${
          isDemoMode
            ? 'bg-slate-800/50 border border-yellow-500/30'
            : 'bg-slate-800/50 border border-green-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Accuracy</p>
              <p className={`text-2xl font-bold ${accuracyPercentage >= 70 ? 'text-green-400' : 'text-white'}`}>
                {formatPercentage(accuracyPercentage)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${accuracyPercentage >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              🎯
            </div>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className={`backdrop-blur-sm rounded-2xl p-6 ${
          isDemoMode
            ? 'bg-slate-800/50 border border-yellow-500/30'
            : 'bg-slate-800/50 border border-green-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Max Drawdown</p>
              <p className={`text-2xl font-bold ${drawdown <= 5 ? 'text-green-400' : 'text-red-400'}`}>
                -{formatPercentage(Math.abs(drawdown))}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${drawdown <= 5 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              📉
            </div>
          </div>
        </div>

        {/* Max Exposure */}
        <div className={`backdrop-blur-sm rounded-2xl p-6 ${
          isDemoMode
            ? 'bg-slate-800/50 border border-yellow-500/30'
            : 'bg-slate-800/50 border border-green-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Max Exposure</p>
              <p className={`text-2xl font-bold ${exposure <= 15 ? 'text-green-400' : 'text-yellow-400'}`}>
                {formatPercentage(exposure)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${exposure <= 15 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              📊
            </div>
          </div>
        </div>
      </div>

      {/* End Challenge Button */}
      {isChallengeCompleted() && (
        <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 backdrop-blur-sm border border-green-500/50 rounded-2xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
              🏆
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Congratulations!</h3>
            <p className="text-green-400 mb-6">
              You have successfully completed all challenge requirements!
            </p>
            <button
              onClick={handleEndChallenge}
              disabled={isProcessing}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-2 mx-auto disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  🎉 End Challenge
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Challenge Rules */}
      <div className={`backdrop-blur-sm rounded-2xl p-6 ${
        isDemoMode
          ? 'bg-slate-800/50 border border-yellow-500/50'
          : 'bg-slate-800/50 border border-green-500/50'
      }`}>
        <h4 className="text-lg font-semibold text-white mb-4">Challenge Rules</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-300 mb-2">Phase 1 Requirements:</h5>
            <ul className="space-y-1 text-gray-400">
              <li>• 10 minimum resolved markets</li>
              <li>• 70% minimum accuracy</li>
              <li>• Max drawdown &lt; 5%</li>
              <li>• Max exposure &lt; 15% per market</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-300 mb-2">Phase 2 Requirements:</h5>
            <ul className="space-y-1 text-gray-400">
              <li>• Phase 1 completion</li>
              <li>• Additional 10 resolved markets</li>
              <li>• Maintain accuracy ≥ 70%</li>
              <li>• Consistent risk management</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Certificate Generator Modal */}
      <CertGenerator
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        traderName="Demo Trader" // This would come from user data
        planName="1-Step Challenge"
        challengeSize={`$${challengeSize?.toLocaleString() || '5,000'}`}
        completionDate={new Date().toLocaleDateString()}
        onDownload={async (blob) => {
          // Send congratulatory email with certificate attachment
          try {
            const formData = new FormData();
            formData.append('certificate', blob, 'certificate.png');
            formData.append('type', 'challenge_completion');
            formData.append('userId', 'demo-user'); // In real app, get from user context
            formData.append('planName', '1-Step Challenge');
            formData.append('challengeSize', `$${challengeSize?.toLocaleString() || '5,000'}`);

            await fetch('/api/email', {
              method: 'POST',
              body: formData,
            });

            console.log('Certificate email sent successfully');
          } catch (error) {
            console.error('Error sending certificate email:', error);
          }
        }}
      />
    </div>
  );
}
