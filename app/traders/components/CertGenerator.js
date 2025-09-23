'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import Confetti from 'react-confetti';

export default function CertGenerator({
  isOpen,
  onClose,
  traderName = "John Doe",
  planName = "1-Step Challenge",
  challengeSize = "$5,000",
  completionDate = new Date().toLocaleDateString(),
  onDownload
}) {
  const certificateRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const generateCertificate = async () => {
    if (!certificateRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: '#0f172a', // slate-900
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: 600,
      });

      // Convert to blob for clipboard or download
      canvas.toBlob(async (blob) => {
        const url = URL.createObjectURL(blob);

        // Try to copy to clipboard first (for mobile/screenshots)
        try {
          const clipboardItem = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([clipboardItem]);
          alert('Certificate copied to clipboard! You can paste it anywhere.');
        } catch (clipboardError) {
          // Fallback: download as file
          const link = document.createElement('a');
          link.href = url;
          link.download = `PolyProp_Certificate_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        URL.revokeObjectURL(url);
        setIsGenerating(false);

        // Trigger confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        // Call onDownload callback
        if (onDownload) {
          onDownload(blob);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate. Please try again.');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Confetti Overlay */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={200}
          recycle={false}
        />
      )}

      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">🎉 Challenge Completed!</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Certificate Content */}
          <div className="p-6">
            {/* Certificate Preview */}
            <div
              ref={certificateRef}
              className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-blue-500 rounded-xl p-8 mx-auto max-w-2xl relative overflow-hidden"
              style={{ width: '800px', height: '600px' }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-16 h-16 border border-blue-400 rounded-full"></div>
                <div className="absolute top-8 right-8 w-12 h-12 border border-blue-400 rounded-full"></div>
                <div className="absolute bottom-8 left-8 w-14 h-14 border border-blue-400 rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 border border-blue-400 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="text-center mb-8 relative z-10">
                <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                  🏆
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">PolyProp</h1>
                <p className="text-xl text-blue-400">Prediction Trading Certificate</p>
              </div>

              {/* Main Content */}
              <div className="text-center mb-8 relative z-10">
                <p className="text-slate-300 mb-4">This certifies that</p>
                <h2 className="text-3xl font-bold text-white mb-4">{traderName}</h2>
                <p className="text-slate-300 mb-2">has successfully completed the</p>
                <h3 className="text-2xl font-semibold text-blue-400 mb-4">{planName}</h3>
                <p className="text-slate-300 mb-2">with a starting capital of</p>
                <p className="text-2xl font-bold text-green-400">{challengeSize}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm text-slate-400 mb-1">Completion Date</h4>
                  <p className="text-white font-semibold">{completionDate}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm text-slate-400 mb-1">Lifetime Payouts</h4>
                  <p className="text-green-400 font-bold">$0.00</p>
                </div>
              </div>

              {/* Badges Section (Stub) */}
              <div className="mb-8 relative z-10">
                <h4 className="text-center text-slate-300 mb-4">Achievements</h4>
                <div className="flex justify-center gap-4">
                  <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg px-3 py-1">
                    <span className="text-yellow-400 text-sm">🎯 Consistent Trader</span>
                  </div>
                  <div className="bg-blue-600/20 border border-blue-600 rounded-lg px-3 py-1">
                    <span className="text-blue-400 text-sm">📈 Risk Manager</span>
                  </div>
                  <div className="bg-green-600/20 border border-green-600 rounded-lg px-3 py-1">
                    <span className="text-green-400 text-sm">🏆 Challenge Master</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end relative z-10">
                <div className="text-center">
                  <div className="border-b border-slate-600 w-32 mx-auto mb-2"></div>
                  <p className="text-xs text-slate-400">CEO Signature</p>
                  <p className="text-sm text-slate-300">Larry Chen</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-600 w-32 mx-auto mb-2"></div>
                  <p className="text-xs text-slate-400">Approved By</p>
                  <p className="text-sm text-slate-300">PolyProp Platform</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6 relative z-10">
                <p className="text-xs text-slate-500">
                  This certificate is issued electronically and is valid indefinitely.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Certificate ID: {Date.now().toString(36).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={generateCertificate}
                disabled={isGenerating}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    📸 {navigator.clipboard?.write ? 'Copy Certificate' : 'Download Certificate'}
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>

            <div className="text-center text-sm text-slate-400 mt-4">
              {navigator.clipboard?.write
                ? 'Certificate will be copied to your clipboard for easy sharing!'
                : 'Certificate will be downloaded as PNG file.'
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
