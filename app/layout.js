import RootLayoutClient from './layout.client';
import './globals.css';

export const metadata = {
  title: 'PredictProp',
  description: 'Decentralized Prop Trading Platform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }) {
  return <RootLayoutClient>{children}</RootLayoutClient>;
}