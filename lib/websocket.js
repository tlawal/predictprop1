'use client';

import toast from 'react-hot-toast';

class PolymarketWebSocket {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.subscriptions = new Set();
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseReconnectDelay = 1000; // 1 second base delay
    this.maxReconnectDelay = 30000; // 30 seconds max delay
    this.reconnectTimeoutId = null;
    this.wsUrl = 'wss://clob.polymarket.com/ws';

    // Watch-related state
    this.watchedMarkets = new Set();
    this.lastPrices = new Map(); // marketId -> { yesPrice, noPrice, timestamp }
    this.isLoadingWatches = false;
  }

  /**
   * Connect to Polymarket WebSocket
   */
  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        // Set a timeout for connection
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.warn('WebSocket connection timeout, falling back to polling');
            this.ws.close();
            this.isConnected = false;
            resolve(); // Resolve anyway to allow polling fallback
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('Connected to Polymarket WebSocket');

          // Authenticate the connection
          this.authenticate().then(() => {
            this.isConnected = true;
            this.reconnectAttempts = 0;

            // Re-subscribe to existing subscriptions
            if (this.subscriptions.size > 0) {
              this.subscribeToPriceUpdates(Array.from(this.subscriptions));
            }

            // Load watched markets for notifications
            this.loadWatchedMarkets();

            resolve();
          }).catch((authError) => {
            console.warn('WebSocket authentication failed:', authError);
            this.ws.close();
            this.isConnected = false;
            resolve(); // Allow fallback to polling
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('Polymarket WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;

          // Only try to reconnect if it wasn't a manual close
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.warn('Polymarket WebSocket error, falling back to polling:', error);
          this.isConnected = false;
          // Don't try to reconnect on error, just fall back to polling
          resolve(); // Resolve to allow polling fallback
        };

      } catch (error) {
        console.warn('Failed to create WebSocket connection, falling back to polling:', error);
        this.isConnected = false;
        resolve(); // Resolve to allow polling fallback
      }
    });
  }

  /**
   * Authenticate the WebSocket connection
   */
  async authenticate() {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const apiKey = typeof window !== 'undefined' ?
        window.process?.env?.NEXT_PUBLIC_POLYMARKET_API_KEY :
        process.env.NEXT_PUBLIC_POLYMARKET_API_KEY;

      if (!apiKey) {
        console.warn('No Polymarket API key found, attempting unauthenticated connection. For full WebSocket functionality, add NEXT_PUBLIC_POLYMARKET_API_KEY to your environment variables.');
        resolve(); // Allow connection without auth for basic functionality
        return;
      }

      // Set a timeout for authentication
      const authTimeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 5000);

      // Send authentication message - try different formats
      const authMessage = JSON.stringify({
        type: 'auth',
        api_key: apiKey,
        timestamp: Date.now()
      });

      // Alternative auth format (uncomment if needed)
      // const authMessage = JSON.stringify({
      //   type: 'authenticate',
      //   key: apiKey
      // });

      this.ws.send(authMessage);
      console.log('Sent WebSocket authentication with API key');

      // Listen for authentication response
      const handleAuthResponse = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'auth_success') {
            clearTimeout(authTimeout);
            this.ws.removeEventListener('message', handleAuthResponse);
            console.log('WebSocket authentication successful');
            resolve();
          } else if (data.type === 'auth_error') {
            clearTimeout(authTimeout);
            this.ws.removeEventListener('message', handleAuthResponse);
            console.warn('WebSocket authentication failed:', data.message);
            reject(new Error(data.message || 'Authentication failed'));
          }
        } catch (error) {
          console.warn('Error parsing auth response:', error);
        }
      };

      this.ws.addEventListener('message', handleAuthResponse);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    if (data.type === 'price_change' && data.asset_id) {
      // Update Zustand store with new price data
      if (typeof window !== 'undefined') {
        try {
          // Dynamically import the store to avoid circular dependencies
          import('./stores/oddsStore').then(({ default: useOddsStore }) => {
            const store = useOddsStore.getState();
            store.updateMarketOdds(data.asset_id, data.yes_price, data.no_price);
          }).catch(err => {
            console.warn('Failed to update odds store:', err);
          });
        } catch (error) {
          console.warn('Error updating odds store:', error);
        }
      }

      // Check for significant price changes and trigger notifications
      this.checkPriceChange(data.asset_id, data.yes_price, data.no_price);

      // Dispatch custom event for React components to listen to
      const event = new CustomEvent('polymarket:price_update', {
        detail: {
          tokenId: data.asset_id,
          yesPrice: data.yes_price,
          noPrice: data.no_price,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Subscribe to price updates for specific tokenIds
   */
  subscribeToPriceUpdates(tokenIds) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not open, cannot subscribe. Will attempt to subscribe on reconnect.');
      tokenIds.forEach(tokenId => this.subscriptions.add(tokenId));
      return;
    }

    const newSubscriptions = tokenIds.filter(tokenId => !this.subscriptions.has(tokenId));

    if (newSubscriptions.length > 0) {
      // Try different subscription formats as Polymarket's format may vary
      const message = JSON.stringify({
        type: 'subscribe',
        channels: ['price_updates'],
        assets: newSubscriptions
      });

      // Alternative format (try this if the above doesn't work)
      // const message = JSON.stringify({
      //   type: 'subscribe',
      //   assets_ids: newSubscriptions
      // });

      this.ws.send(message);
      newSubscriptions.forEach(tokenId => this.subscriptions.add(tokenId));
      console.log('Subscribed to price updates for:', newSubscriptions);
    }
  }

  /**
   * Unsubscribe from price updates for specific tokenIds
   */
  unsubscribeFromPriceUpdates(tokenIds) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      tokenIds.forEach(tokenId => this.subscriptions.delete(tokenId));
      return;
    }

    const message = JSON.stringify({
      type: 'unsubscribe',
      assets_ids: tokenIds
    });
    this.ws.send(message);
    tokenIds.forEach(tokenId => this.subscriptions.delete(tokenId));
    console.log('Unsubscribed from price updates for:', tokenIds);
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    // Clear any existing reconnection timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`🚫 Max reconnection attempts (${this.maxReconnectAttempts}) reached, falling back to polling`);
      return;
    }

    // Calculate exponential backoff delay with jitter
    const baseDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    const jitter = Math.random() * 0.1 * baseDelay; // Add up to 10% jitter
    const delay = Math.min(baseDelay + jitter, this.maxReconnectDelay);

    this.reconnectAttempts++;

    console.log(`🔄 Scheduling reconnection in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      console.log(`🔌 Attempting reconnection (attempt ${this.reconnectAttempts})`);

      this.connect().then(() => {
        console.log('✅ Reconnection successful');
      }).catch((error) => {
        console.warn(`❌ Reconnection failed: ${error.message}`);
        // Schedule next attempt if we haven't reached max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    // Clear any pending reconnection timeout
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client initiated disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.subscriptions.clear();
    this.reconnectAttempts = 0;
    console.log('Polymarket WebSocket disconnected manually.');
  }

  /**
   * Load watched markets from localStorage
   */
  loadWatchedMarkets() {
    if (this.isLoadingWatches) return;

    try {
      this.isLoadingWatches = true;
      const localWatches = localStorage.getItem('watchedMarkets');
      if (localWatches) {
        this.watchedMarkets = new Set(JSON.parse(localWatches));
      } else {
        this.watchedMarkets = new Set();
      }
    } catch (error) {
      console.error('Failed to load watched markets:', error);
      this.watchedMarkets = new Set();
    } finally {
      this.isLoadingWatches = false;
    }
  }

  /**
   * Add market to watch list
   */
  addWatchedMarket(marketId) {
    this.watchedMarkets.add(marketId);
  }

  /**
   * Remove market from watch list
   */
  removeWatchedMarket(marketId) {
    this.watchedMarkets.delete(marketId);
    this.lastPrices.delete(marketId); // Clear price history
  }

  /**
   * Check if price change exceeds threshold and trigger notification
   */
  checkPriceChange(marketId, newYesPrice, newNoPrice, marketQuestion = '') {
    if (!this.watchedMarkets.has(marketId)) return;

    const lastPrice = this.lastPrices.get(marketId);
    if (!lastPrice) {
      // First price update, store it
      this.lastPrices.set(marketId, {
        yesPrice: newYesPrice,
        noPrice: newNoPrice,
        timestamp: Date.now()
      });
      return;
    }

    // Calculate percentage changes
    const yesChange = Math.abs((newYesPrice - lastPrice.yesPrice) / lastPrice.yesPrice) * 100;
    const noChange = Math.abs((newNoPrice - lastPrice.noPrice) / lastPrice.noPrice) * 100;
    const maxChange = Math.max(yesChange, noChange);

    // Trigger notification if change > 10%
    if (maxChange >= 10) {
      const direction = newYesPrice > lastPrice.yesPrice ? '↑' : '↓';
      const question = marketQuestion || `Market ${marketId}`;
      const shortQuestion = question.length > 30 ? question.substring(0, 27) + '...' : question;

      toast(`Prob shifted on "${shortQuestion}"! ${direction} ${maxChange.toFixed(1)}%`, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#1f2937',
          color: '#f3f4f6',
          border: '1px solid #374151'
        },
        icon: direction === '↑' ? '📈' : '📉'
      });
    }

    // Update stored price
    this.lastPrices.set(marketId, {
      yesPrice: newYesPrice,
      noPrice: newNoPrice,
      timestamp: Date.now()
    });
  }

  /**
   * Get current connection status and subscriptions
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      subscriptions: Array.from(this.subscriptions),
      watchedMarkets: Array.from(this.watchedMarkets)
    };
  }
}

// Create singleton instance
const polymarketWebSocket = new PolymarketWebSocket();
export default polymarketWebSocket;
