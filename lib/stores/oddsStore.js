import { create } from 'zustand';

const useOddsStore = create((set, get) => ({
  // State
  marketOdds: new Map(), // tokenId -> { yesPrice, noPrice, timestamp }
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
      return {
        marketOdds: newMarketOdds,
        lastUpdate: timestamp
      };
    });
  },

  updateMultipleMarketOdds: (oddsUpdates) => {
    const timestamp = Date.now();
    set((state) => {
      const newMarketOdds = new Map(state.marketOdds);
      Object.entries(oddsUpdates).forEach(([tokenId, odds]) => {
        newMarketOdds.set(tokenId, {
          yesPrice: parseFloat(odds.yesPrice),
          noPrice: parseFloat(odds.noPrice),
          timestamp
        });
      });
      return {
        marketOdds: newMarketOdds,
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

  clearMarketOdds: () => {
    set({ marketOdds: new Map(), lastUpdate: null });
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
