'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ThemeProvider } from './ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';

export default function RootLayoutClient({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
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
            <Header />
            {children}
            <Footer />
          </PrivyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
