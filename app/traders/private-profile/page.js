'use client';

import React from 'react';

export default function PrivateProfilePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Private Profile</h1>
        <p className="text-gray-400 mt-2">Your private profile information</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Profile Details</h2>
        <p className="text-gray-400">Private profile content coming soon...</p>
      </div>
    </div>
  );
}
