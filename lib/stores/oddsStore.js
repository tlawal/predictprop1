import { create } from 'zustand';

const useOddsStore = create((set, get) => ({
  // State
  marketOdds: new Map(), // tokenId -> { yesPrice, noPrice, timestamp }
  priceHistory: new Map(), // tokenId -> Array of {timestamp, yesPrice, noPrice} (last 10)
  lastUpdate: null,

  // Actions
  updateMarketOdds: (tokenId, yesPrice, noPrice) => {
    const timestamp = Date.now();
    set((state) => {
      const newMarketOdds = new Map(state.marketOdds);
      newMarketOdds.set(tokenId, {
        yesPrice: parseFloat(yesPrice),
        noPrice: parseFloat(noPrice),
        timestamp
      });

      // Update price history
      const newPriceHistory = new Map(state.priceHistory);
      const history = newPriceHistory.get(tokenId) || [];
      history.push({
        timestamp,
        yesPrice: parseFloat(yesPrice),
        noPrice: parseFloat(noPrice)
      });

      // Keep only last 10 entries
      if (history.length > 10) {
        history.shift(); // Remove oldest
      }
      newPriceHistory.set(tokenId, history);

      return {
        marketOdds: newMarketOdds,
        priceHistory: newPriceHistory,
        lastUpdate: timestamp
      };
    });
  },

  updateMultipleMarketOdds: (oddsUpdates) => {
    const timestamp = Date.now();
    set((state) => {
      const newMarketOdds = new Map(state.marketOdds);
      const newPriceHistory = new Map(state.priceHistory);

      Object.entries(oddsUpdates).forEach(([tokenId, odds]) => {
        newMarketOdds.set(tokenId, {
          yesPrice: parseFloat(odds.yesPrice),
          noPrice: parseFloat(odds.noPrice),
          timestamp
        });

        // Update price history
        const history = newPriceHistory.get(tokenId) || [];
        history.push({
          timestamp,
          yesPrice: parseFloat(odds.yesPrice),
          noPrice: parseFloat(odds.noPrice)
        });

        // Keep only last 10 entries
        if (history.length > 10) {
          history.shift(); // Remove oldest
        }
        newPriceHistory.set(tokenId, history);
      });

      return {
        marketOdds: newMarketOdds,
        priceHistory: newPriceHistory,
        lastUpdate: timestamp
      };
    });
  },

  getMarketOdds: (tokenId) => {
    return get().marketOdds.get(tokenId);
  },

  getAllMarketOdds: () => {
    return Object.fromEntries(get().marketOdds);
  },

  getPriceHistory: (tokenId) => {
    return get().priceHistory.get(tokenId) || [];
  },

  getAllPriceHistory: () => {
    return Object.fromEntries(get().priceHistory);
  },

  clearMarketOdds: () => {
    set({
      marketOdds: new Map(),
      priceHistory: new Map(),
      lastUpdate: null
    });
  },

  // Computed values
  hasMarketOdds: (tokenId) => {
    return get().marketOdds.has(tokenId);
  },

  getRecentUpdates: (sinceTimestamp) => {
    const recentUpdates = [];
    get().marketOdds.forEach((odds, tokenId) => {
      if (odds.timestamp > sinceTimestamp) {
        recentUpdates.push({ tokenId, ...odds });
      }
    });
    return recentUpdates;
  }
}));

export default useOddsStore;
