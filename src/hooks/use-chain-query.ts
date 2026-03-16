import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { fetchChain, detectChainProvider } from "@/lib/chain";
import { useChainStore } from "@/stores/chain-store";
import { useApiKeyStore } from "@/stores/api-key-store";
import { useFilterStore } from "@/stores/filter-store";
import { useResultsStore } from "@/stores/results-store";
import { TokenBucketRateLimiter } from "@/services/rate-limiter";

/**
 * TanStack Query hook for option chain fetching.
 * Enabled when chain modal is open and symbol is set.
 * Bridges the pure fetchChain() to React with proper lifecycle management.
 */
export function useChainQuery() {
  const { isOpen, symbol } = useChainStore(
    useShallow((s) => ({ isOpen: s.isOpen, symbol: s.symbol })),
  );

  // Snapshot API keys at query time
  const { alpacaKeyId, alpacaSecretKey, massiveKey } = useApiKeyStore(
    useShallow((s) => ({
      alpacaKeyId: s.alpacaKeyId,
      alpacaSecretKey: s.alpacaSecretKey,
      massiveKey: s.massiveKey,
    })),
  );

  const { targetDTE, targetDelta } = useFilterStore(
    useShallow((s) => ({ targetDTE: s.targetDTE, targetDelta: s.targetDelta })),
  );

  // Look up the current price from results store
  const currentPrice = useResultsStore((s) => {
    if (!symbol) return 0;
    const result = s.allResults.find((r) => r.symbol === symbol);
    return result?.price ?? 0;
  });

  const provider = detectChainProvider({ alpacaKeyId, alpacaSecretKey, massiveKey });

  // Rate limiter for Massive — created once, disposed on unmount
  const rateLimiterRef = useRef<TokenBucketRateLimiter | null>(null);

  useEffect(() => {
    return () => {
      rateLimiterRef.current?.dispose();
      rateLimiterRef.current = null;
    };
  }, []);

  const query = useQuery({
    queryKey: ["chain", symbol, provider] as const,
    queryFn: async ({ signal }) => {
      if (!symbol || !provider) {
        throw new Error("No provider configured — set Alpaca or Massive.com API keys");
      }

      // Create/reuse rate limiter for Massive
      let massiveRateLimiter: TokenBucketRateLimiter | undefined;
      if (provider === "massive") {
        if (!rateLimiterRef.current) {
          rateLimiterRef.current = new TokenBucketRateLimiter(5, 5, 60000);
        }
        massiveRateLimiter = rateLimiterRef.current;
      }

      return fetchChain({
        symbol,
        currentPrice,
        targetDTE,
        targetDelta,
        signal,
        provider,
        alpacaKeyId,
        alpacaSecretKey,
        massiveKey,
        massiveRateLimiter,
      });
    },
    enabled: isOpen && symbol !== null && provider !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Sync query state to chain store
  useEffect(() => {
    if (query.isLoading || query.isFetching) {
      useChainStore.getState().setLoading(true);
    }
  }, [query.isLoading, query.isFetching]);

  useEffect(() => {
    if (query.data) {
      useChainStore.getState().setChainData(query.data);
    }
  }, [query.data]);

  useEffect(() => {
    if (query.error) {
      const message =
        query.error instanceof Error
          ? query.error.message
          : "Failed to load option chain";
      console.error(`[chain] error: ${message}`);
      useChainStore.getState().setError(message);
    }
  }, [query.error]);

  return {
    ...query,
    provider,
  };
}
