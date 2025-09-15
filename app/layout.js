'use client';
import { PrivyProvider } from '@privy-io/react-auth';
import { ThemeProvider } from './ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import './globals.css';

// export const metadata = {
//   title: 'PredictProp',
//   description: 'Decentralized Prop Trading Platform',
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl'}
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