'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';

const navigation = [
  { name: 'Dashboard', href: '/traders/dashboard', icon: '📊' },
  { name: 'Private Profile', href: '/traders/private-profile', icon: '👤' },
  { name: 'Public Profile', href: '/traders/public-profile', icon: '🌐' },
  { name: 'Certificates', href: '/traders/certificates', icon: '🏆' },
  { name: 'Buy Evaluation', href: '/traders/buy-evaluation', icon: '💰' },
  { name: 'Settings', href: '/traders/settings', icon: '⚙️' },
  { name: 'Payouts', href: '/traders/payouts', icon: '💸' },
  { name: 'FAQ', href: '/traders/faq', icon: '❓' },
  { name: 'Leaderboard', href: '/traders/leaderboard', icon: '🏅' },
];

const secondaryNavigation = [
  { name: 'Language', href: '#', icon: '🌍' },
  { name: 'Wallet', href: '#', icon: '👛' },
  { name: 'Affiliates Portal', href: '#', icon: '🤝' },
];

export default function TradersLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Auth check
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/?error=unauth');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-gray-800 dark:bg-gray-900 transform transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Collapse Toggle */}
          <div className="flex items-center justify-between h-16 px-4 bg-gray-900 dark:bg-gray-800 border-b border-gray-700">
            {!sidebarCollapsed && <h1 className="text-xl font-bold text-white">PolyProp</h1>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Primary Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                    <span className="text-lg">{item.icon}</span>
                    {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 my-6"></div>

            {/* Secondary Navigation */}
            <div className="space-y-1">
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors`}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className={`border-t border-gray-700 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">PolyProp</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>


        {/* Page content */}
        <main className="flex-1 p-6 bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
