import { create } from 'zustand';
import type { ChainData } from '@/types';

interface ChainStore {
  chainData: ChainData | null;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  symbol: string | null;
  setChainData: (data: ChainData) => void;
  setSelectedExpiry: (expiry: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearChain: () => void;
  open: (symbol: string) => void;
  close: () => void;
}

export const useChainStore = create<ChainStore>()((set) => ({
  chainData: null,
  loading: false,
  error: null,
  isOpen: false,
  symbol: null,

  setChainData: (data) => set({ chainData: data, loading: false, error: null }),

  setSelectedExpiry: (expiry) =>
    set((state) => {
      if (!state.chainData) return state;
      return { chainData: { ...state.chainData, selectedExpiry: expiry } };
    }),

  setLoading: (loading) => set({ loading, error: null }),

  setError: (error) => set({ error, loading: false }),

  clearChain: () => set({ chainData: null, loading: false, error: null }),

  open: (symbol) =>
    set({ isOpen: true, symbol, chainData: null, loading: false, error: null }),

  close: () =>
    set({
      isOpen: false,
      symbol: null,
      chainData: null,
      loading: false,
      error: null,
    }),
}));
