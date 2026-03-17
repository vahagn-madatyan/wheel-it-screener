import { create } from 'zustand';

type ScanPhase = 'idle' | 'running' | 'complete' | 'error';

interface ScanStore {
  phase: ScanPhase;
  phaseLabel: string;
  progress: number;
  currentTicker: string;
  scannedCount: number;
  totalCount: number;
  candidateCount: number;
  error: string | null;
  earningsMap: Map<string, string>;
  failedTickers: string[];
  earningsWarning: string | null;

  startScan: (totalCount: number) => void;
  tickProgress: (ticker: string) => void;
  incrementCandidates: () => void;
  setPhaseLabel: (label: string) => void;
  completeScan: (
    failedTickers: string[],
    earningsWarning: string | null,
  ) => void;
  failScan: (error: string) => void;
  resetScan: () => void;
  setEarningsMap: (map: Map<string, string>) => void;
}

export const useScanStore = create<ScanStore>()((set) => ({
  phase: 'idle',
  phaseLabel: '',
  progress: 0,
  currentTicker: '',
  scannedCount: 0,
  totalCount: 0,
  candidateCount: 0,
  error: null,
  earningsMap: new Map(),
  failedTickers: [],
  earningsWarning: null,

  startScan: (totalCount) =>
    set({
      phase: 'running',
      phaseLabel: '',
      progress: 0,
      currentTicker: '',
      scannedCount: 0,
      totalCount,
      candidateCount: 0,
      error: null,
      failedTickers: [],
      earningsWarning: null,
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

  setPhaseLabel: (label) => set({ phaseLabel: label }),

  completeScan: (failedTickers, earningsWarning) =>
    set({ phase: 'complete', progress: 1, failedTickers, earningsWarning }),

  failScan: (error) => set({ phase: 'error', error }),

  resetScan: () =>
    set({
      phase: 'idle',
      phaseLabel: '',
      progress: 0,
      currentTicker: '',
      scannedCount: 0,
      totalCount: 0,
      candidateCount: 0,
      error: null,
      failedTickers: [],
      earningsWarning: null,
    }),

  setEarningsMap: (map) => set({ earningsMap: map }),
}));
