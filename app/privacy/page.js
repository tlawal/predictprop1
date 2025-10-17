'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400 text-lg">
            How we collect, use, and protect your personal information
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Link href="/purchase-new-evaluation" className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            ← Back to Purchase
          </Link>
        </div>

        {/* Privacy Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="text-slate-300 mb-6">
              We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-slate-300 mb-6">
              We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
            <p className="text-slate-300 mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <p className="text-slate-300 mb-6">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
            <p className="text-slate-300 mb-6">
              You have the right to access, update, or delete your personal information. You may also object to or restrict certain processing of your information.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-slate-300 mb-6">
              We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">7. Third-Party Services</h2>
            <p className="text-slate-300 mb-6">
              Our service may contain links to third-party websites or services that are not owned or controlled by us.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-slate-300 mb-6">
              Our service is not intended for children under 18. We do not knowingly collect personal information from children under 18.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
            <p className="text-slate-300 mb-6">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
            <p className="text-slate-300 mb-6">
              If you have any questions about this Privacy Policy, please contact us through our support channels.
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
