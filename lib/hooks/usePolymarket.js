/**
 * React hook for Polymarket integration
 * Provides real-time market data and WebSocket connection management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import polymarketService from '../services/polymarket.js';

export function usePolymarketMarkets(params = {}) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);

  const fetchMarkets = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const fetchParams = {
        ...params,
        cursor: reset ? null : nextCursor,
        limit: params.limit || 20
      };

      const data = await polymarketService.fetchMarkets(fetchParams);
      
      if (reset) {
        setMarkets(data.markets);
      } else {
        setMarkets(prev => [...prev, ...data.markets]);
      }
      
      setNextCursor(data.next);
      setHasMore(!!data.next);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params, nextCursor, loading]);

  // Initial fetch
  useEffect(() => {
    fetchMarkets(true);
  }, [params.q, params.category, params.status]);

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchMarkets(false);
    }
  }, [hasMore, loading, fetchMarkets]);

  return {
    markets,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchMarkets(true)
  };
}

export function usePolymarketWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState(new Set());
  const [priceUpdates, setPriceUpdates] = useState({});
  const reconnectTimeoutRef = useRef(null);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      await polymarketService.connectWebSocket();
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to Polymarket WebSocket:', error);
      setIsConnected(false);
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    polymarketService.disconnect();
    setIsConnected(false);
    setSubscriptions(new Set());
    setPriceUpdates({});
  }, []);

  // Subscribe to price updates
  const subscribeToTokens = useCallback((tokenIds) => {
    if (!Array.isArray(tokenIds)) {
      tokenIds = [tokenIds];
    }

    const newSubscriptions = new Set([...subscriptions, ...tokenIds]);
    setSubscriptions(newSubscriptions);
    
    polymarketService.subscribeToPriceUpdates(tokenIds);
  }, [subscriptions]);

  // Unsubscribe from price updates
  const unsubscribeFromTokens = useCallback((tokenIds) => {
    if (!Array.isArray(tokenIds)) {
      tokenIds = [tokenIds];
    }

    const newSubscriptions = new Set(subscriptions);
    tokenIds.forEach(tokenId => newSubscriptions.delete(tokenId));
    setSubscriptions(newSubscriptions);
    
    polymarketService.unsubscribeFromPriceUpdates(tokenIds);
  }, [subscriptions]);

  // Handle price update events
  useEffect(() => {
    const handlePriceUpdate = (event) => {
      const { tokenId, yesPrice, noPrice, timestamp } = event.detail;
      setPriceUpdates(prev => ({
        ...prev,
        [tokenId]: {
          yesPrice,
          noPrice,
          timestamp
        }
      }));
    };

    window.addEventListener('polymarket:price_update', handlePriceUpdate);
    
    return () => {
      window.removeEventListener('polymarket:price_update', handlePriceUpdate);
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect().catch(() => {
      console.warn('Initial WebSocket connection failed, using polling fallback');
    });
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [connect, disconnect]);

  // Fallback polling for price updates when WebSocket is not connected
  useEffect(() => {
    if (!isConnected && subscriptions.length > 0) {
      console.log(`Starting polling fallback for ${subscriptions.length} tokens`);
      
      const pollInterval = setInterval(async () => {
        try {
          const pricePromises = subscriptions.map(tokenId => 
            polymarketService.fetchMidpoint(tokenId).catch(() => null)
          );
          const prices = await Promise.all(pricePromises);
          
          prices.forEach((price, index) => {
            if (price) {
              const event = new CustomEvent('polymarket:price_update', {
                detail: {
                  tokenId: subscriptions[index],
                  yesPrice: price.yesPrice,
                  noPrice: price.noPrice,
                  timestamp: Date.now()
                }
              });
              window.dispatchEvent(event);
            }
          });
        } catch (error) {
          console.warn('Polling error:', error);
        }
      }, 10000); // Poll every 10 seconds (less aggressive)

      return () => {
        clearInterval(pollInterval);
        console.log('Stopped polling fallback');
      };
    }
  }, [isConnected, subscriptions]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = polymarketService.getConnectionStatus();
      setIsConnected(status.isConnected);
      setSubscriptions(new Set(status.subscriptions));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mock price updates for demonstration when no real data is available
  useEffect(() => {
    if (!isConnected && subscriptions.length > 0) {
      const mockInterval = setInterval(() => {
        subscriptions.forEach(tokenId => {
          // Generate small random price movements for demonstration
          const event = new CustomEvent('polymarket:price_update', {
            detail: {
              tokenId,
              yesPrice: 0.5 + (Math.random() - 0.5) * 0.1, // Small random movement around 0.5
              noPrice: 0.5 + (Math.random() - 0.5) * 0.1,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(event);
        });
      }, 15000); // Mock updates every 15 seconds

      return () => clearInterval(mockInterval);
    }
  }, [isConnected, subscriptions]);

  return {
    isConnected,
    subscriptions: Array.from(subscriptions),
    priceUpdates,
    connect,
    disconnect,
    subscribeToTokens,
    unsubscribeFromTokens
  };
}

export function usePolymarketPrice(tokenId) {
  const [price, setPrice] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!tokenId) return;

    const handlePriceUpdate = (event) => {
      const { tokenId: updatedTokenId, yesPrice, noPrice, timestamp } = event.detail;
      
      if (updatedTokenId === tokenId) {
        setPrice({
          yesPrice,
          noPrice,
          timestamp
        });
        setIsLive(true);
        
        // Reset live indicator after 5 seconds
        setTimeout(() => setIsLive(false), 5000);
      }
    };

    window.addEventListener('polymarket:price_update', handlePriceUpdate);
    
    return () => {
      window.removeEventListener('polymarket:price_update', handlePriceUpdate);
    };
  }, [tokenId]);

  return { price, isLive };
}

export function usePolymarketMarket(marketId) {
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarket = useCallback(async () => {
    if (!marketId) return;
    
    setLoading(true);
    setError(null);

    try {
      const data = await polymarketService.fetchMarket(marketId);
      setMarket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  return {
    market,
    loading,
    error,
    refetch: fetchMarket
  };
}
