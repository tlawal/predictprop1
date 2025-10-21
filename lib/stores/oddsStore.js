import { create } from 'zustand';

const MAX_HISTORY_POINTS = 20;

const useOddsStore = create((set, get) => ({
  // State
  marketOdds: new Map(), // tokenId -> { yesPrice, noPrice, timestamp }
  priceHistory: new Map(), // tokenId -> Array of {timestamp, yesPrice, noPrice, yesProb} (last 20)
  lastUpdate: null,

  // Sort state
  sortConfig: [], // Array of {key, direction: 'asc'|'desc'} for multi-column sorting

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
      const prevHistory = newPriceHistory.get(tokenId) || [];
      const history = [
        ...prevHistory,
        {
          timestamp,
          yesPrice: parseFloat(yesPrice),
          noPrice: parseFloat(noPrice),
          yesProb: parseFloat(yesPrice)
        }
      ].slice(-MAX_HISTORY_POINTS);
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
        const prevHistory = [...(newPriceHistory.get(tokenId) || [])];
        const history = [
          ...prevHistory,
          {
            timestamp,
            yesPrice: parseFloat(odds.yesPrice),
            noPrice: parseFloat(odds.noPrice),
            yesProb: parseFloat(odds.yesPrice)
          }
        ].slice(-MAX_HISTORY_POINTS);
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

  // Sort actions
  setSortConfig: (sortConfig) => {
    set({ sortConfig });
  },

  toggleSort: (key, multiColumn = false) => {
    set((state) => {
      let newSortConfig = [...state.sortConfig];

      // Find existing sort for this key
      const existingIndex = newSortConfig.findIndex(sort => sort.key === key);

      if (existingIndex >= 0) {
        // Toggle direction
        const currentDirection = newSortConfig[existingIndex].direction;
        if (currentDirection === 'asc') {
          newSortConfig[existingIndex] = { key, direction: 'desc' };
        } else {
          // Remove this sort if it was desc
          newSortConfig.splice(existingIndex, 1);
        }
      } else {
        // Add new sort
        if (multiColumn) {
          // Add to existing sorts
          newSortConfig.push({ key, direction: 'asc' });
        } else {
          // Replace all sorts with this one
          newSortConfig = [{ key, direction: 'asc' }];
        }
      }

      return { sortConfig: newSortConfig };
    });
  },

  clearSort: () => {
    set({ sortConfig: [] });
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
