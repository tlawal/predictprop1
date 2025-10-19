'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import toast, { Toaster } from 'react-hot-toast';

const fetcher = (url) => fetch(url).then((res) => res.json());

function CertificateCard({ certificate }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // In a real implementation, this would call an API to generate/download the certificate
      const response = await fetch('/api/certificates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: certificate.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏆</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">
          Evaluation Certificate
        </h3>

        <div className="space-y-2 mb-4 text-sm text-gray-300">
          <div>Account Size: ${certificate.accountSize?.toLocaleString() || 'N/A'}</div>
          <div>Challenge Type: {certificate.challengeType || 'N/A'}</div>
          <div>Achieved: {new Date(certificate.achievedAt || certificate.created_at).toLocaleDateString()}</div>
          <div>Status: <span className="text-green-400">Verified</span></div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <span>📥</span>
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const { user } = useUser();
  const { data: certificatesData, error, isLoading, mutate } = useSWR(
    user ? `/api/certificates?userId=${user.id}` : null,
    fetcher
  );

  // Mock certificates data for demonstration
  const mockCertificates = [
    {
      id: 'cert-001',
      accountSize: 10000,
      challengeType: '1-step',
      achievedAt: new Date().toISOString(),
      status: 'verified'
    },
    {
      id: 'cert-002',
      accountSize: 5000,
      challengeType: '2-step',
      achievedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      status: 'verified'
    }
  ];

  const certificates = certificatesData?.certificates || mockCertificates;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Certificates</h1>
        <p className="text-gray-400 mt-2">
          Your evaluation completion certificates and achievements
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-white text-lg">Loading certificates...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-red-400 text-lg">Error loading certificates</div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-4">No Certificates Yet</h2>
          <p className="text-gray-400 mb-6">
            Complete your first evaluation challenge to earn your certificate
          </p>
          <a
            href="/traders/buy-evaluation"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Start Evaluation
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {certificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Certificate Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">What are certificates?</h3>
                <p className="text-gray-400 text-sm">
                  Certificates are proof of your successful completion of trading evaluation challenges.
                  They demonstrate your trading skills and can be shared with potential employers or investors.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-2">How to earn certificates</h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Complete evaluation challenges successfully</li>
                  <li>• Meet all trading objectives and rules</li>
                  <li>• Pass the verification process</li>
                  <li>• Certificates are automatically generated</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
}
