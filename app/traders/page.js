'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TradersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/traders/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white text-lg">Redirecting to dashboard...</div>
    </div>
  );
}
