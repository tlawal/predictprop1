# Polymarket Integration Setup

This application now uses **real, live data** from Polymarket's official APIs and WebSocket infrastructure.

## 🚀 Quick Start

### 1. No API Key Required!

The Gamma API is **publicly accessible** and doesn't require authentication for basic market data. The application will work out of the box with real Polymarket data.

### 2. Optional: Advanced Features

For advanced features like trading or private endpoints, you can optionally configure an API key:

Create a `.env.local` file in the project root:

```bash
# Optional: For advanced features (trading, private endpoints)
NEXT_PUBLIC_POLYMARKET_API_KEY=your_actual_api_key_here
```

### 3. Start Development

```bash
npm install
npm run dev
```

## 🏗️ Architecture

### Real-Time Data Flow

```
Polymarket Gamma API → Next.js API Routes → React Components
     ↓
WebSocket (CLOB) → Custom Events → Live Price Updates
     ↓
Fallback Polling → Midpoint API → Price Updates
```

### Key Components

- **`/lib/services/polymarket.js`**: Core service for API and WebSocket integration
- **`/lib/hooks/usePolymarket.js`**: React hooks for data management
- **`/app/api/markets/route.js`**: API route with caching
- **`/app/markets/components/MarketsTable.js`**: Real-time market display

## 📊 Features

### Live Market Data
- ✅ **Real markets** from Polymarket's Gamma API
- ✅ **Live price updates** via WebSocket
- ✅ **Automatic reconnection** with exponential backoff
- ✅ **Smart caching** (5-minute TTL)
- ✅ **Error handling** with graceful fallbacks

### Market Information
- **Question**: Market description
- **Yes/No Odds**: Live prices with visual indicators
- **Volume**: Trading volume in USD
- **End Date**: Market resolution date
- **Category**: Politics, Crypto, Sports, Economics
- **Status**: Open/Closed markets

### Real-Time Updates
- **Live indicators**: Green/red dots for active price updates
- **Smooth transitions**: CSS animations for price changes
- **WebSocket status**: Connection indicator
- **Auto-subscription**: Automatically subscribes to visible markets

## 🔧 API Endpoints

### Markets API
```
GET /api/markets?q=bitcoin&category=crypto&status=open&limit=20
```

**Parameters:**
- `q`: Search query
- `category`: Filter by category
- `status`: Filter by status (open/closed)
- `limit`: Number of results (default: 20)
- `cursor`: Pagination cursor

### Midpoint API
```
GET /api/midpoint/[tokenId]
```

Returns current midpoint prices for a specific market.

## 🌐 WebSocket Integration

### Connection
- **URL**: `wss://clob.polymarket.com/ws`
- **Authentication**: Uses API key for authenticated access
- **Channels**: `price_updates` for live price data

### Price Updates
```javascript
// Custom event dispatched for price updates
window.addEventListener('polymarket:price_update', (event) => {
  const { tokenId, yesPrice, noPrice, timestamp } = event.detail;
  // Update UI with new prices
});
```

## 🎯 React Hooks

### `usePolymarketMarkets(params)`
```javascript
const { markets, loading, error, hasMore, loadMore } = usePolymarketMarkets({
  q: 'bitcoin',
  category: 'crypto',
  status: 'open'
});
```

### `usePolymarketWebSocket()`
```javascript
const { isConnected, subscribeToTokens, priceUpdates } = usePolymarketWebSocket();
```

### `usePolymarketPrice(tokenId)`
```javascript
const { price, isLive } = usePolymarketPrice('0x123');
```

## 🚀 Production Deployment

### Environment Variables
```bash
NEXT_PUBLIC_POLYMARKET_API_KEY=your_production_api_key
```

### Caching
- **Development**: In-memory cache (5-minute TTL)
- **Production**: Consider Redis for distributed caching

### Rate Limits
- Polymarket has rate limits on their API
- Current implementation includes caching to reduce API calls
- Monitor usage and implement additional caching if needed

## 🔍 Troubleshooting

### No Markets Showing
1. Check API key is valid
2. Verify network connection
3. Check browser console for errors

### WebSocket Not Connecting
1. Verify API key has WebSocket permissions
2. Check firewall/proxy settings
3. Monitor connection status indicator

### Price Updates Not Working
1. Ensure WebSocket is connected (green indicator)
2. Check if markets have valid token IDs
3. Verify subscription is active

## 📈 Performance

### Optimizations
- **Smart caching**: Reduces API calls
- **Efficient subscriptions**: Only subscribes to visible markets
- **Connection pooling**: Reuses WebSocket connections
- **Error boundaries**: Graceful error handling

### Monitoring
- Connection status indicators
- Error logging in console
- Performance metrics in browser dev tools

## 🔐 Security

### API Key Management
- Store API keys in environment variables
- Never commit API keys to version control
- Use different keys for development/production

### WebSocket Security
- Authenticated connections only
- Rate limiting on client side
- Input validation for all parameters

## 📚 Resources

- [Polymarket Documentation](https://docs.polymarket.com/)
- [Gamma API Reference](https://gamma-api.polymarket.com/)
- [CLOB WebSocket Docs](https://docs.polymarket.com/websocket/wss-overview)

---

**Built with ❤️ for the Polymarket ecosystem**
