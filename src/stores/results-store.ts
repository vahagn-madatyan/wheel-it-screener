import { create } from 'zustand';
import type { StockResult } from '@/types';

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: keyof StockResult;
  direction: SortDirection;
}

interface ResultsStore {
  allResults: StockResult[];
  filteredResults: StockResult[];
  sort: SortConfig;
  setResults: (all: StockResult[], filtered: StockResult[]) => void;
  setSortKey: (key: keyof StockResult) => void;
  clearResults: () => void;
}

export const useResultsStore = create<ResultsStore>()((set) => ({
  allResults: [],
  filteredResults: [],
  sort: { key: 'wheelScore', direction: 'desc' },

  setResults: (all, filtered) =>
    set({ allResults: all, filteredResults: filtered }),

  setSortKey: (key) =>
    set((state) => ({
      sort: {
        key,
        direction:
          state.sort.key === key && state.sort.direction === 'desc'
            ? 'asc'
            : 'desc',
      },
    })),

  clearResults: () => set({ allResults: [], filteredResults: [] }),
}));
