'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ThemeProvider } from './ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { SupabaseAuthProvider } from './components/SupabaseAuthProvider';
import '../lib/i18n';
import { usePathname } from 'next/navigation';

function LayoutContent({ children }) {
  const pathname = usePathname();
  const hideHeader = pathname === '/traders';

  return (
    <ThemeProvider>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmf779kit0058ld0boewrfnqe'}
        config={{
          loginMethods: ['email', 'google', 'twitter', 'wallet'],
          appearance: {
            theme: 'dark',
            accentColor: '#2DD4BF',
            logo: 'https://polymarket.com/images/logo.svg'
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets'
          }
        }}
      >
        <SupabaseAuthProvider>
          {!hideHeader && <Header />}
          {children}
          <Footer />
        </SupabaseAuthProvider>
      </PrivyProvider>
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
