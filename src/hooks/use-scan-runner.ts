import { useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { runScan, type ScanResult, type ScanPhaseLabel } from "@/lib/scan";
import { useScanStore } from "@/stores/scan-store";
import { useResultsStore } from "@/stores/results-store";
import { useFilterStore } from "@/stores/filter-store";
import { useApiKeyStore } from "@/stores/api-key-store";
import { getTickerList } from "@/lib/utils";
import type { FilterState } from "@/types";

/** Phase labels for display */
const PHASE_LABELS: Record<ScanPhaseLabel, string> = {
  earnings: "Loading earnings calendar…",
  quotes: "Scanning stocks…",
  profiles: "Enriching profiles…",
  recommendations: "Loading analyst data…",
  filtering: "Applying filters…",
};

export function useScanRunner() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation<ScanResult, Error>({
    mutationFn: async () => {
      // Snapshot all mutable state at call time — no stale closures
      const filterSnapshot = { ...useFilterStore.getState() } as FilterState;
      const finnhubKey = useApiKeyStore.getState().finnhubKey;
      const tickers = getTickerList(filterSnapshot);

      if (!finnhubKey) throw new Error("Finnhub API key not set");
      if (tickers.length === 0) throw new Error("No tickers to scan");

      // Fresh AbortController per run
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const scanStore = useScanStore.getState();
      scanStore.startScan(tickers.length);

      return runScan({
        tickers,
        finnhubKey,
        filters: filterSnapshot,
        signal: controller.signal,
        onTick: (ticker) => useScanStore.getState().tickProgress(ticker),
        onCandidateFound: () => useScanStore.getState().incrementCandidates(),
        onPhaseChange: (_phase: ScanPhaseLabel) => {
          // Phase tracking — store can be extended later for phase display
        },
      });
    },

    onSuccess: (result) => {
      useResultsStore.getState().setResults(result.allResults, result.filteredResults);
      useScanStore.getState().completeScan();
      abortControllerRef.current = null;
    },

    onError: (error) => {
      if (error.name === "AbortError" || error.message === "Scan aborted") {
        useScanStore.getState().resetScan();
      } else {
        useScanStore.getState().failScan(error.message);
      }
      abortControllerRef.current = null;
    },
  });

  const startScan = useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  // Derive UI-facing state from scan store
  const phase = useScanStore((s) => s.phase);
  const progress = useScanStore((s) => s.progress);
  const currentTicker = useScanStore((s) => s.currentTicker);
  const error = useScanStore((s) => s.error);

  return {
    runScan: startScan,
    cancel,
    phase,
    progress,
    currentTicker,
    error,
    isRunning: phase === "running",
  };
}

export { PHASE_LABELS };
