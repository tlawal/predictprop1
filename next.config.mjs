/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
      return [
        {
          source: '/api/polymarket',
          destination: 'https://clob.polymarket.com/markets',
        },
        {
          source: '/api/kalshi',
          destination: 'https://trading-api.kalshi.com/trade-api/v2/markets?limit=5',
        },
      ];
    },
  };
  
  export default nextConfig;