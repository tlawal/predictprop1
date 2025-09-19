'use client';

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
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Re-subscribe to existing subscriptions
          if (this.subscriptions.size > 0) {
            this.subscribeToPriceUpdates(Array.from(this.subscriptions));
          }

          resolve();
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
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    if (data.type === 'price_change' && data.asset_id) {
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
      const message = JSON.stringify({
        type: 'subscribe',
        assets_ids: newSubscriptions
      });
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
   * Get current connection status and subscriptions
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      subscriptions: Array.from(this.subscriptions)
    };
  }
}

// Create singleton instance
const polymarketWebSocket = new PolymarketWebSocket();
export default polymarketWebSocket;
