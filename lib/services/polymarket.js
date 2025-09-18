/**
 * Polymarket API Service
 * Production-ready integration with Polymarket's Gamma API and CLOB WebSocket
 */

class PolymarketService {
  constructor() {
    this.baseUrl = 'https://gamma-api.polymarket.com';
    this.wsUrl = 'wss://clob.polymarket.com/ws';
    this.apiKey = process.env.NEXT_PUBLIC_POLYMARKET_API_KEY;
    this.ws = null;
    this.isConnected = false;
    this.subscriptions = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Fetch markets from Gamma API
   */
      async fetchMarkets(params = {}) {
        console.log(`🔍 PolymarketService.fetchMarkets called with params:`, params);
        try {
          const searchParams = new URLSearchParams();
      
      // Add parameters - using correct Gamma API parameter names
      if (params.q) searchParams.set('q', params.q);
      if (params.category) {
        // Map our category names to Polymarket's category names
        const categoryMap = {
          'Politics': 'US-current-affairs',
          'Crypto': 'Crypto',
          'Sports': 'Sports',
          'Economics': 'Economics',
          'Tech': 'Tech',
          'Entertainment': 'Pop-Culture',
          'Weather': 'Weather',
          'Science': 'Science',
          'Health': 'Health',
          'International': 'International'
        };
        const mappedCategory = categoryMap[params.category] || params.category;
        searchParams.set('category', mappedCategory);
      }
      // For now, don't filter by active status to get all markets, then filter client-side
      // This is because Polymarket's API returns old data even with active=true
      // if (params.status !== 'closed') {
      //   searchParams.set('active', 'true'); // Only fetch active markets
      // }
      if (params.limit) searchParams.set('limit', params.limit);
      if (params.cursor) searchParams.set('cursor', params.cursor);
      // Note: sort and order parameters cause 422 errors, so they're removed

      // Use the markets endpoint for the markets page, events for ticker
      const endpoint = params.tickerMode ? 'events' : 'markets';

      // Set proper filtering and sorting parameters
      searchParams.set('limit', Math.min(params.limit || 100, 500));
      searchParams.set('offset', params.offset || 0);
      searchParams.set('closed', 'false'); // Only active markets

      // Special handling for ticker mode
      if (params.tickerMode) {
        searchParams.set('featured', 'true'); // Only featured events
        searchParams.set('closed', 'false'); // Only active events
        searchParams.set('order', 'createdAt'); // Order by creation date
        searchParams.set('ascending', 'false'); // Most recent first
      }

      // Add order parameter if provided - use correct Gamma API parameter names
      if (params.order) {
        // Gamma API uses different parameter names
        if (params.order.includes('volume24hr')) {
          searchParams.set('order', 'volumeNum');
          searchParams.set('ascending', params.order.includes('desc') ? 'false' : 'true');
        } else if (params.order.includes('createdAt')) {
          searchParams.set('order', 'createdAt');
          searchParams.set('ascending', params.order.includes('desc') ? 'false' : 'true');
        }
      }

      const url = `${this.baseUrl}/${endpoint}?${searchParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PredictProp/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gamma API error response:', errorText);
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();


      // Handle markets API response structure
      let markets = [];
      if (Array.isArray(responseData)) {
        markets = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        markets = responseData.data;
      } else if (responseData.markets) {
        markets = responseData.markets;
      }

      const transformedMarkets = markets.map(market => this.transformMarket(market));


      // Filter for active markets with future end dates and minimum volume
      const currentDate = new Date();
      let validMarkets;

      if (params.tickerMode) {
        // Return up to 40 featured events
        validMarkets = transformedMarkets.slice(0, 40);
      } else {
        // Normal filtering for markets page
        validMarkets = transformedMarkets
          .filter(market => {
            if (!market.endDate) return false;
            const endDate = new Date(market.endDate);
            return endDate > currentDate; // Only markets that haven't ended
          })
          .filter(market => {
            const volume = parseFloat(market.volume) || 0;
            return volume >= 5000; // Minimum volume of 5000 for markets page
          })
          .sort((a, b) => {
            // Sort by volume first (highest volume first), then by creation date
            const volumeA = parseFloat(b.volume) || 0;
            const volumeB = parseFloat(a.volume) || 0;
            if (volumeA !== volumeB) {
              return volumeA - volumeB; // Higher volume first
            }
            return new Date(b.createdAt || b.endDate) - new Date(a.createdAt || a.endDate);
          });
      }

      // Take the requested number of markets
      const finalMarkets = validMarkets.slice(0, params.limit || 50);

      if (params.tickerMode) {
        console.log(`🎯 Ticker mode: Found ${transformedMarkets.length} raw markets`);
        console.log(`💰 High volume markets (>= $1M): ${transformedMarkets.filter(m => parseFloat(m.volume) >= 1000000).length}`);
        console.log(`📅 Markets within 3 months: ${transformedMarkets.filter(m => {
          if (!m.endDate) return false;
          const endDate = new Date(m.endDate);
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
          return endDate > new Date() && endDate <= threeMonthsFromNow;
        }).length}`);
      }

      console.log(`✅ Found ${finalMarkets.length} active 2025 markets from Polymarket`);
      console.log(`📊 Latest market ends: ${finalMarkets[0]?.endDate ? new Date(finalMarkets[0].endDate).toLocaleDateString() : 'unknown'}`);

      const result = {
        markets: finalMarkets,
        next: responseData.pagination?.hasMore ? (params.offset || 0) + finalMarkets.length : null,
        total: finalMarkets.length,
        pagination: responseData.pagination
      };


      return result;

    } catch (error) {
      console.error('Failed to fetch markets:', error);
      throw error;
    }
  }

  /**
   * Transform market data to our format
   */
  transformMarket(market) {
    // Handle both events and markets data structures
    const isEvent = market.title !== undefined;

    
    // Parse outcome prices from the API response
    let outcomePrices = ['0.5', '0.5']; // Default prices
    if (market.outcomePrices) {
      try {
        outcomePrices = JSON.parse(market.outcomePrices);
      } catch (e) {
        console.warn('Failed to parse outcomePrices:', market.outcomePrices);
      }
    }
    const yesPrice = parseFloat(outcomePrices[0]) || 0.5;
    const noPrice = parseFloat(outcomePrices[1]) || 0.5;
    
    // Parse CLOB token IDs
    let clobTokenIds = [];
    if (market.clobTokenIds) {
      try {
        clobTokenIds = JSON.parse(market.clobTokenIds);
      } catch (e) {
        console.warn('Failed to parse clobTokenIds:', market.clobTokenIds);
      }
    }
    
    // Map Polymarket category names back to our display names
    const categoryMap = {
      'US-current-affairs': 'Politics',
      'Crypto': 'Crypto',
      'Sports': 'Sports',
      'Economics': 'Economics',
      'Tech': 'Tech',
      'Pop-Culture': 'Entertainment',
      'Weather': 'Weather',
      'Science': 'Science',
      'Health': 'Health',
      'International': 'International'
    };
    const displayCategory = categoryMap[market.category] || market.category;

    // Determine if market is actually active based on end date
    const now = new Date();
    const endDate = market.endDate ? new Date(market.endDate) : null;
    const isActuallyActive = endDate ? endDate > now : market.active;

    return {
      id: market.id,
      tokenId: clobTokenIds[0] || market.id, // Use first CLOB token ID or fallback to market ID
      question: market.question || market.title,
      description: market.description,
      yesOdds: yesPrice,
      noOdds: noPrice,
      volume: isEvent ? parseFloat(market.volume) || 0 : (market.volumeNum || parseFloat(market.volume) || 0),
      endDate: market.endDate,
      createdAt: market.createdAt, // Add createdAt for sorting
      category: displayCategory,
      status: isActuallyActive ? 'open' : 'closed',
      source: 'polymarket',
      url: `https://polymarket.com/event/${market.slug || market.ticker || market.id}`,
      liquidity: market.liquidityNum || parseFloat(market.liquidity) || 0,
      lastTradePrice: market.lastTradePrice || 0,
      lastTradeTime: market.lastTradeTime,
      marketMaker: market.marketMakerAddress,
      resolutionSource: market.resolutionSource,
      closed: market.closed,
      archived: market.archived,
      outcomes: market.outcomes ? (typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes) : ['Yes', 'No'],
      isEvent: isEvent
    };
  }

  /**
   * Fetch single market details
   */
  async fetchMarket(marketId) {
    try {
      const response = await fetch(`${this.baseUrl}/markets/${marketId}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PredictProp/1.0',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformMarket(data);

    } catch (error) {
      console.error('Failed to fetch market:', error);
      throw error;
    }
  }

  /**
   * Fetch market midpoint prices
   */
  async fetchMidpoint(tokenId) {
    try {
      const response = await fetch(`${this.baseUrl}/markets/${tokenId}/midpoint`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PredictProp/1.0',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        tokenId,
        yesPrice: data.yes_price || 0.5,
        noPrice: data.no_price || 0.5,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Failed to fetch midpoint:', error);
      throw error;
    }
  }

  /**
   * Connect to Polymarket WebSocket
   */
  async connectWebSocket() {
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
            this.handleWebSocketMessage(data);
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
   * Handle WebSocket messages
   */
  handleWebSocketMessage(data) {
    if (data.type === 'price_updates') {
      data.updates?.forEach(update => {
        const { token_id, yes_price, no_price } = update;
        if (token_id && yes_price !== undefined && no_price !== undefined) {
          // Dispatch custom event for price updates
          const event = new CustomEvent('polymarket:price_update', {
            detail: {
              tokenId: token_id,
              yesPrice: yes_price,
              noPrice: no_price,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(event);
        }
      });
    }
  }

  /**
   * Subscribe to price updates for specific tokens
   */
  subscribeToPriceUpdates(tokenIds) {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket not connected, cannot subscribe');
      return;
    }

    const message = {
      type: 'subscribe',
      channel: 'price_updates',
      token_ids: tokenIds
    };

    this.ws.send(JSON.stringify(message));
    
    // Track subscriptions
    tokenIds.forEach(tokenId => this.subscriptions.add(tokenId));
    
    console.log(`Subscribed to price updates for ${tokenIds.length} tokens`);
  }

  /**
   * Unsubscribe from price updates
   */
  unsubscribeFromPriceUpdates(tokenIds) {
    if (!this.isConnected || !this.ws) {
      return;
    }

    const message = {
      type: 'unsubscribe',
      channel: 'price_updates',
      token_ids: tokenIds
    };

    this.ws.send(JSON.stringify(message));
    
    // Remove from subscriptions
    tokenIds.forEach(tokenId => this.subscriptions.delete(tokenId));
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached, falling back to polling');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket().catch(() => {
        console.warn('Reconnection failed, continuing with polling fallback');
      });
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscriptions.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      subscriptions: Array.from(this.subscriptions),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Fetch midpoint prices for multiple tokenIds
   */
  async fetchMultipleMidpoints(tokenIds) {
    try {
      const promises = tokenIds.map(tokenId => this.fetchMidpoint(tokenId));
      const results = await Promise.allSettled(promises);

      const midpoints = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          midpoints[tokenIds[index]] = result.value;
        }
      });

      return midpoints;
    } catch (error) {
      console.error('Failed to fetch multiple midpoints:', error);
      throw error;
    }
  }
}

// Create singleton instance
const polymarketService = new PolymarketService();

export default polymarketService;
