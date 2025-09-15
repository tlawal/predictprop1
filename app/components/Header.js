'use client';

import Link from 'next/link';
import { useTheme } from '../ThemeContext';
import { usePrivy } from '@privy-io/react-auth';
import styles from '../styles/Header.module.css';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { ready, authenticated, user, login, logout } = usePrivy();

  const handleAuth = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  return (
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
        <nav className={styles.nav}>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/traders">Traders</Link></li>
            <li><Link href="/lps">LPs</Link></li>
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
              {ready && (
                <button className={styles.connectOrb} onClick={handleAuth}>
                  {authenticated ? (
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
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}