'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../ThemeContext';
import { usePrivy } from '@privy-io/react-auth';
import styles from '../styles/Header.module.css';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleAuth = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  const toggleMoreMenu = () => {
    setIsMoreMenuOpen(!isMoreMenuOpen);
  };

  const closeMoreMenu = () => {
    setIsMoreMenuOpen(false);
  };

  // Debug logging for Privy state
  console.log('Privy Debug:', {
    ready,
    authenticated,
    user: user ? {
      email: user.email?.address,
      wallet: user.wallet?.address?.slice(0, 10) + '...'
    } : null
  });

  return (
    <>
      {/* Top Header - Desktop and Mobile */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.logo}>
            <svg viewBox="0 0 24 24" fill="url(#grad1)">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#1E3A8A', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L20 8v8l-8 4-8-4V8l8-3.5z"/>
            </svg>
            PredictProp
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/traders">Traders</Link></li>
              <li><Link href="/lps">LPs</Link></li>
              <li><Link href="/leaderboard">Leaderboard</Link></li>
              <li><Link href="/refer">Refer & Earn</Link></li>
              <li><Link href="/markets">Markets</Link></li>
              <li>
                <button className={styles.themeToggle} onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                  {theme === 'dark' ? (
                    <svg viewBox="0 0 24 24">
                      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  )}
                </button>
              </li>
              <li>
                <button className={styles.connectOrb} onClick={handleAuth}>
                  {!ready ? (
                    'Loading...'
                  ) : authenticated ? (
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>
                        {user?.email?.address || user?.wallet?.address?.slice(0, 6) + '...' || 'User'}
                      </span>
                      <span className={styles.logoutText}>Logout</span>
                    </div>
                  ) : (
                    'Connect Wallet'
                  )}
                </button>
              </li>
            </ul>
          </nav>


          {/* Mobile Connect Wallet Button */}
          <div className={styles.mobileConnect}>
            <button className={styles.mobileConnectOrb} onClick={handleAuth}>
              {!ready ? (
                <span>Loading...</span>
              ) : authenticated ? (
                <div className={styles.mobileUserInfo}>
                  <span className={styles.mobileUserName}>
                    {user?.email?.address?.slice(0, 8) + '...' || user?.wallet?.address?.slice(0, 6) + '...' || 'User'}
                  </span>
                </div>
              ) : (
                <span>Connect</span>
              )}
            </button>
          </div>
        </div>

      </header>

      {/* Bottom Navigation for Mobile */}
      <nav className={styles.bottomNav}>
        <Link href="/markets" className={styles.bottomNavItem}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          <span>Markets</span>
        </Link>

        <Link href="/traders" className={styles.bottomNavItem}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
          </svg>
          <span>Traders</span>
        </Link>

        <Link href="/lps" className={styles.bottomNavItem}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>LPs</span>
        </Link>

        <button className={styles.bottomNavItem} onClick={toggleMoreMenu}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More Menu Overlay */}
      {isMoreMenuOpen && (
        <div className={styles.mobileMoreOverlay}>
          <div className={styles.mobileMoreContent}>
            <div className={styles.mobileMoreHeader}>
              <h3>More Options</h3>
              <button onClick={closeMoreMenu}>✕</button>
            </div>
            <div className={styles.mobileMoreLinks}>
              <Link href="/leaderboard" onClick={closeMoreMenu}>
                🏆 Leaderboard
              </Link>
              <Link href="/refer" onClick={closeMoreMenu}>
                💰 Refer & Earn
              </Link>
              <Link href="/docs" onClick={closeMoreMenu}>
                📖 Documentation
              </Link>
              <Link href="/support" onClick={closeMoreMenu}>
                💬 Support
              </Link>
              <Link href="/privacy" onClick={closeMoreMenu}>
                🔒 Privacy Policy
              </Link>
              <button className={styles.mobileThemeToggleOverlay} onClick={() => { toggleTheme(); closeMoreMenu(); }}>
                {theme === 'dark' ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}