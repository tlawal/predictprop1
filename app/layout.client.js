'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from './ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { SupabaseAuthProvider } from './components/SupabaseAuthProvider';
import '../lib/i18n';
import { usePathname } from 'next/navigation';

function LayoutContent({ children }) {
  const pathname = usePathname();
  const hideHeader = pathname.startsWith('/traders');

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
