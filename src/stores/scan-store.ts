import { create } from "zustand";

type ScanPhase = "idle" | "running" | "complete" | "error";

interface ScanStore {
  phase: ScanPhase;
  progress: number;
  currentTicker: string;
  scannedCount: number;
  totalCount: number;
  candidateCount: number;
  error: string | null;
  earningsMap: Map<string, string>;

  startScan: (totalCount: number) => void;
  tickProgress: (ticker: string) => void;
  incrementCandidates: () => void;
  completeScan: () => void;
  failScan: (error: string) => void;
  resetScan: () => void;
  setEarningsMap: (map: Map<string, string>) => void;
}

export const useScanStore = create<ScanStore>()((set) => ({
  phase: "idle",
  progress: 0,
  currentTicker: "",
  scannedCount: 0,
  totalCount: 0,
  candidateCount: 0,
  error: null,
  earningsMap: new Map(),

  startScan: (totalCount) =>
    set({
      phase: "running",
      progress: 0,
      currentTicker: "",
      scannedCount: 0,
      totalCount,
      candidateCount: 0,
      error: null,
    }),

  tickProgress: (ticker) =>
    set((state) => {
      const scannedCount = state.scannedCount + 1;
      return {
        currentTicker: ticker,
        scannedCount,
        progress: state.totalCount > 0 ? scannedCount / state.totalCount : 0,
      };
    }),

  incrementCandidates: () =>
    set((state) => ({ candidateCount: state.candidateCount + 1 })),

  completeScan: () => set({ phase: "complete", progress: 1 }),

  failScan: (error) => set({ phase: "error", error }),

  resetScan: () =>
    set({
      phase: "idle",
      progress: 0,
      currentTicker: "",
      scannedCount: 0,
      totalCount: 0,
      candidateCount: 0,
      error: null,
    }),

  setEarningsMap: (map) => set({ earningsMap: map }),
}));
