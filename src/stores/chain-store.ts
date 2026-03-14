import { create } from "zustand";
import type { ChainData } from "@/types";

interface ChainStore {
  chainData: ChainData | null;
  loading: boolean;
  error: string | null;
  setChainData: (data: ChainData) => void;
  setSelectedExpiry: (expiry: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearChain: () => void;
}

export const useChainStore = create<ChainStore>()((set) => ({
  chainData: null,
  loading: false,
  error: null,

  setChainData: (data) => set({ chainData: data, loading: false, error: null }),

  setSelectedExpiry: (expiry) =>
    set((state) => {
      if (!state.chainData) return state;
      return { chainData: { ...state.chainData, selectedExpiry: expiry } };
    }),

  setLoading: (loading) => set({ loading, error: null }),

  setError: (error) => set({ error, loading: false }),

  clearChain: () => set({ chainData: null, loading: false, error: null }),
}));
