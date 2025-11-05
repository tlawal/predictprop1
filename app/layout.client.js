'use client';

import { useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from './ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { SupabaseAuthProvider } from './components/SupabaseAuthProvider';
import '../lib/i18n';
import { usePathname, useSearchParams } from 'next/navigation';

function LayoutContent({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hideHeader = pathname.startsWith('/traders');

  useEffect(() => {
    if (typeof window === 'undefined' || !searchParams) {
      return;
    }

    const code = searchParams.get('aff') || searchParams.get('ref');
    const normalized = code?.trim();

    if (normalized) {
      try {
        localStorage.setItem('affiliateCode', normalized);
        document.cookie = `affiliate_code=${encodeURIComponent(normalized)}; path=/; max-age=${60 * 60 * 24 * 30}`;
      } catch (error) {
        console.warn('Failed to persist affiliate code', error);
      }
    }
  }, [searchParams]);

  return (
    <ThemeProvider>
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: 'dark',
          variables: {
            colorPrimary: '#2DD4BF'
          }
        }}
      >
        <SupabaseAuthProvider>
          {!hideHeader && <Header />}
          {children}
          <Footer />
        </SupabaseAuthProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default function RootLayoutClient({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
