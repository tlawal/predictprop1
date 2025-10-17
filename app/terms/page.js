'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Use</h1>
          <p className="text-slate-400 text-lg">
            Please read these terms carefully before using PolyProp
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Link href="/purchase-new-evaluation" className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            ← Back to Purchase
          </Link>
        </div>

        {/* Terms Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-300 mb-6">
              By accessing and using PolyProp, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p className="text-slate-300 mb-6">
              Permission is granted to temporarily download one copy of the materials on PolyProp&apos;s website for personal, non-commercial transitory viewing only.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">3. Trading Risks</h2>
            <p className="text-slate-300 mb-6">
              Trading prediction markets involves substantial risk of loss and is not suitable for every investor. You should carefully consider whether trading is appropriate for you in light of your circumstances and financial resources.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">4. Age Requirements</h2>
            <p className="text-slate-300 mb-6">
              You must be at least 18 years old to use PolyProp services. By using our platform, you represent and warrant that you are at least 18 years of age.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">5. Account Responsibilities</h2>
            <p className="text-slate-300 mb-6">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">6. Service Availability</h2>
            <p className="text-slate-300 mb-6">
              We strive to provide continuous service but cannot guarantee that the service will be uninterrupted or error-free. We reserve the right to modify or discontinue the service at any time.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-slate-300 mb-6">
              PolyProp shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">8. Governing Law</h2>
            <p className="text-slate-300 mb-6">
              These terms shall be interpreted and governed by the laws of the jurisdiction in which PolyProp operates, without regard to conflict of law provisions.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
            <p className="text-slate-300 mb-6">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Information</h2>
            <p className="text-slate-300 mb-6">
              If you have any questions about these Terms of Use, please contact us through our support channels.
            </p>

            <div className="mt-8 p-4 bg-slate-700/50 rounded-lg">
              <p className="text-slate-400 text-sm">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
