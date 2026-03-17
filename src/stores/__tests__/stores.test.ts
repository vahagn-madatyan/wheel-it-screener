import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFilterStore } from '@/stores/filter-store';
import { useResultsStore } from '@/stores/results-store';
import { useScanStore } from '@/stores/scan-store';
import { useApiKeyStore } from '@/stores/api-key-store';
import { useThemeStore } from '@/stores/theme-store';
import { useChainStore } from '@/stores/chain-store';
import { PRESETS } from '@/lib/constants';
import type { StockResult, ChainData } from '@/types';

// ---- helpers ----
function resetAllStores() {
  useFilterStore.setState(useFilterStore.getInitialState());
  useResultsStore.setState(useResultsStore.getInitialState());
  useScanStore.setState(useScanStore.getInitialState());
  useApiKeyStore.setState(useApiKeyStore.getInitialState());
  useThemeStore.setState(useThemeStore.getInitialState());
  useChainStore.setState(useChainStore.getInitialState());
}

function makeResult(overrides: Partial<StockResult> = {}): StockResult {
  return {
    symbol: 'AAPL',
    name: 'Apple Inc',
    price: 150,
    prevClose: 149,
    dayChange: 0.67,
    dayHigh: 151,
    dayLow: 148,
    marketCap: 2_500_000_000_000,
    pe: 28,
    forwardPE: 26,
    beta: 1.2,
    dividendYield: 0.5,
    avgVolume: 80_000_000,
    avgVolume3M: 78_000_000,
    twoHundredDayAvg: 145,
    fiftyTwoWeekHigh: 180,
    fiftyTwoWeekLow: 120,
    fiftyTwoWeekHighDate: '2025-07-15',
    fiftyTwoWeekLowDate: '2025-01-10',
    roe: 0.45,
    revenueGrowth: 0.08,
    netMargin: 0.25,
    currentRatio: 1.1,
    debtToEquity: 1.5,
    source: 'finnhub',
    wheelScore: 85,
    ...overrides,
  };
}

// ---- filterStore ----
describe('filterStore', () => {
  beforeEach(resetAllStores);

  it('defaults match finviz_cut2 parsed values', () => {
    const state = useFilterStore.getState();
    const preset = PRESETS.finviz_cut2;

    // Number fields match directly
    expect(state.minPrice).toBe(preset.minPrice);
    expect(state.maxPrice).toBe(preset.maxPrice);
    expect(state.minMktCap).toBe(preset.minMktCap);
    expect(state.maxMktCap).toBe(preset.maxMktCap);
    expect(state.minVolume).toBe(preset.minVolume);
    expect(state.maxPE).toBe(preset.maxPE);
    expect(state.minPremium).toBe(preset.minPremium);
    expect(state.maxBP).toBe(preset.maxBP);
    expect(state.minIVRank).toBe(preset.minIVRank);
    expect(state.maxIVRank).toBe(preset.maxIVRank);

    // String→number conversions
    expect(state.targetDTE).toBe(30);
    expect(typeof state.targetDTE).toBe('number');
    expect(state.targetDelta).toBe(0.3);
    expect(typeof state.targetDelta).toBe('number');

    // Boolean field name mapping
    expect(state.requireDividends).toBe(preset.dividends);
    expect(state.aboveSMA200).toBe(preset.sma200);
    expect(state.excludeEarnings).toBe(preset.earnings);
    expect(state.requireWeeklies).toBe(preset.weeklies);
    expect(state.excludeRiskySectors).toBe(preset.riskySectors);

    // Weight defaults
    expect(state.weightPremium).toBe(30);
    expect(state.weightLiquidity).toBe(20);
    expect(state.weightStability).toBe(25);
    expect(state.weightFundamentals).toBe(25);

    // User-specific fields have their own defaults
    expect(state.tickerUniverse).toBe('wheel_popular');
    expect(state.customTickers).toBe('');
  });

  it("applyPreset('conservative') converts string→number correctly", () => {
    useFilterStore.getState().applyPreset('conservative');
    const state = useFilterStore.getState();

    expect(state.targetDTE).toBe(45);
    expect(typeof state.targetDTE).toBe('number');
    expect(state.targetDelta).toBe(0.2);
    expect(typeof state.targetDelta).toBe('number');
    expect(state.requireDividends).toBe(true);
    expect(state.aboveSMA200).toBe(true);
    expect(state.maxPE).toBe(30);
    expect(state.weightPremium).toBe(20);
    expect(state.weightStability).toBe(30);
  });

  it("applyPreset('aggressive') converts string→number correctly", () => {
    useFilterStore.getState().applyPreset('aggressive');
    const state = useFilterStore.getState();

    expect(state.targetDTE).toBe(30);
    expect(state.targetDelta).toBe(0.35);
    expect(state.requireDividends).toBe(false);
    expect(state.excludeRiskySectors).toBe(false);
    expect(state.weightPremium).toBe(40);
    expect(state.minPrice).toBe(5);
  });

  it("applyPreset('finviz_cut2') converts string→number correctly", () => {
    // Apply conservative first, then switch back
    useFilterStore.getState().applyPreset('conservative');
    useFilterStore.getState().applyPreset('finviz_cut2');
    const state = useFilterStore.getState();

    expect(state.targetDTE).toBe(30);
    expect(state.targetDelta).toBe(0.3);
    expect(state.minPrice).toBe(10);
  });

  it('setFilter updates individual fields', () => {
    useFilterStore.getState().setFilter('minPrice', 25);
    expect(useFilterStore.getState().minPrice).toBe(25);

    useFilterStore.getState().setFilter('requireDividends', true);
    expect(useFilterStore.getState().requireDividends).toBe(true);

    useFilterStore.getState().setFilter('tickerUniverse', 'sp500_top');
    expect(useFilterStore.getState().tickerUniverse).toBe('sp500_top');
  });

  it('resetFilters returns to defaults', () => {
    useFilterStore.getState().setFilter('minPrice', 999);
    useFilterStore.getState().setFilter('requireDividends', true);
    useFilterStore.getState().resetFilters();

    const state = useFilterStore.getState();
    expect(state.minPrice).toBe(PRESETS.finviz_cut2.minPrice);
    expect(state.requireDividends).toBe(PRESETS.finviz_cut2.dividends);
    expect(state.targetDTE).toBe(30);
  });

  it("applyPreset with unknown name warns but doesn't crash", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const before = useFilterStore.getState().minPrice;
    useFilterStore.getState().applyPreset('nonexistent');
    expect(useFilterStore.getState().minPrice).toBe(before);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));
    warn.mockRestore();
  });
});

// ---- resultsStore ----
describe('resultsStore', () => {
  beforeEach(resetAllStores);

  it('starts empty with wheelScore desc sort', () => {
    const state = useResultsStore.getState();
    expect(state.allResults).toEqual([]);
    expect(state.filteredResults).toEqual([]);
    expect(state.sort).toEqual({ key: 'wheelScore', direction: 'desc' });
  });

  it('setResults populates both arrays', () => {
    const all = [makeResult(), makeResult({ symbol: 'MSFT' })];
    const filtered = [all[0]];
    useResultsStore.getState().setResults(all, filtered);

    const state = useResultsStore.getState();
    expect(state.allResults).toHaveLength(2);
    expect(state.filteredResults).toHaveLength(1);
  });

  it('clearResults empties both arrays', () => {
    useResultsStore.getState().setResults([makeResult()], [makeResult()]);
    useResultsStore.getState().clearResults();
    expect(useResultsStore.getState().allResults).toEqual([]);
    expect(useResultsStore.getState().filteredResults).toEqual([]);
  });

  it('setSortKey toggles direction on same key', () => {
    // Default: wheelScore desc
    useResultsStore.getState().setSortKey('wheelScore');
    expect(useResultsStore.getState().sort).toEqual({
      key: 'wheelScore',
      direction: 'asc',
    });

    useResultsStore.getState().setSortKey('wheelScore');
    expect(useResultsStore.getState().sort).toEqual({
      key: 'wheelScore',
      direction: 'desc',
    });
  });

  it('setSortKey resets to desc on new key', () => {
    useResultsStore.getState().setSortKey('price');
    expect(useResultsStore.getState().sort).toEqual({
      key: 'price',
      direction: 'desc',
    });
  });
});

// ---- scanStore ----
describe('scanStore', () => {
  beforeEach(resetAllStores);

  it('starts in idle phase', () => {
    expect(useScanStore.getState().phase).toBe('idle');
  });

  it('idle→running→complete lifecycle', () => {
    const store = useScanStore.getState();

    store.startScan(3);
    expect(useScanStore.getState().phase).toBe('running');
    expect(useScanStore.getState().totalCount).toBe(3);

    useScanStore.getState().tickProgress('AAPL');
    expect(useScanStore.getState().scannedCount).toBe(1);
    expect(useScanStore.getState().currentTicker).toBe('AAPL');
    expect(useScanStore.getState().progress).toBeCloseTo(1 / 3);

    useScanStore.getState().tickProgress('MSFT');
    useScanStore.getState().tickProgress('GOOGL');
    expect(useScanStore.getState().scannedCount).toBe(3);
    expect(useScanStore.getState().progress).toBeCloseTo(1);

    useScanStore.getState().completeScan(['FAIL1'], null);
    expect(useScanStore.getState().phase).toBe('complete');
    expect(useScanStore.getState().progress).toBe(1);
    expect(useScanStore.getState().failedTickers).toEqual(['FAIL1']);
  });

  it('idle→running→error lifecycle', () => {
    useScanStore.getState().startScan(10);
    useScanStore.getState().tickProgress('AAPL');
    useScanStore.getState().failScan('API rate limit');

    const state = useScanStore.getState();
    expect(state.phase).toBe('error');
    expect(state.error).toBe('API rate limit');
  });

  it('resetScan returns to idle', () => {
    useScanStore.getState().startScan(5);
    useScanStore.getState().tickProgress('AAPL');
    useScanStore.getState().resetScan();

    const state = useScanStore.getState();
    expect(state.phase).toBe('idle');
    expect(state.scannedCount).toBe(0);
    expect(state.error).toBeNull();
  });

  it('setEarningsMap stores map', () => {
    const map = new Map([['AAPL', '2026-04-25']]);
    useScanStore.getState().setEarningsMap(map);
    expect(useScanStore.getState().earningsMap.get('AAPL')).toBe('2026-04-25');
  });
});

// ---- apiKeyStore ----
describe('apiKeyStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetAllStores();
  });

  it('starts with empty keys and not_set status', () => {
    const state = useApiKeyStore.getState();
    expect(state.finnhubKey).toBe('');
    expect(state.status.finnhub).toBe('not_set');
    expect(state.status.alpaca).toBe('not_set');
    expect(state.status.massive).toBe('not_set');
  });

  it('setFinnhubKey updates key and derives status', () => {
    useApiKeyStore.getState().setFinnhubKey('abc123');
    const state = useApiKeyStore.getState();
    expect(state.finnhubKey).toBe('abc123');
    expect(state.status.finnhub).toBe('set');
  });

  it('setAlpacaKeys requires both keys for set status', () => {
    useApiKeyStore.getState().setAlpacaKeys('key-id', 'secret');
    const state = useApiKeyStore.getState();
    expect(state.alpacaKeyId).toBe('key-id');
    expect(state.alpacaSecretKey).toBe('secret');
    expect(state.status.alpaca).toBe('set');
  });

  it('setMassiveKey updates key and derives status', () => {
    useApiKeyStore.getState().setMassiveKey('massive-key-123');
    expect(useApiKeyStore.getState().status.massive).toBe('set');
  });

  it('clearAllKeys resets everything', () => {
    useApiKeyStore.getState().setFinnhubKey('test');
    useApiKeyStore.getState().setMassiveKey('test');
    useApiKeyStore.getState().clearAllKeys();

    const state = useApiKeyStore.getState();
    expect(state.finnhubKey).toBe('');
    expect(state.status.finnhub).toBe('not_set');
    expect(state.status.massive).toBe('not_set');
  });

  it('persist serialization excludes status', () => {
    useApiKeyStore.getState().setFinnhubKey('test-key');

    // Force persist write
    useApiKeyStore.persist.rehydrate();

    const raw = sessionStorage.getItem('wheelscan-api-keys');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state).not.toHaveProperty('status');
    expect(parsed.state.finnhubKey).toBe('test-key');
    expect(parsed.version).toBe(2);
  });
});

// ---- themeStore ----
describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset DOM classList
    document.documentElement.classList.remove('dark', 'light');
    resetAllStores();
  });

  it('defaults to dark', () => {
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('toggleTheme switches and updates DOM', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setTheme updates DOM', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('persists to localStorage', () => {
    useThemeStore.getState().toggleTheme(); // dark → light
    useThemeStore.persist.rehydrate();

    const raw = localStorage.getItem('wheelscan-theme');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.theme).toBe('light');
    expect(parsed.version).toBe(1);
  });
});

// ---- chainStore ----
describe('chainStore', () => {
  beforeEach(resetAllStores);

  const mockChain: ChainData = {
    symbol: 'AAPL',
    expirations: ['2026-04-17', '2026-05-15'],
    selectedExpiry: '2026-04-17',
    puts: [],
  };

  it('starts with null chainData and closed modal', () => {
    const state = useChainStore.getState();
    expect(state.chainData).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.isOpen).toBe(false);
    expect(state.symbol).toBeNull();
  });

  it('setChainData stores data and clears loading/error', () => {
    useChainStore.getState().setLoading(true);
    useChainStore.getState().setChainData(mockChain);

    const state = useChainStore.getState();
    expect(state.chainData?.symbol).toBe('AAPL');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setSelectedExpiry updates expiry on existing data', () => {
    useChainStore.getState().setChainData(mockChain);
    useChainStore.getState().setSelectedExpiry('2026-05-15');
    expect(useChainStore.getState().chainData?.selectedExpiry).toBe(
      '2026-05-15',
    );
  });

  it('setSelectedExpiry is no-op when no chain data', () => {
    useChainStore.getState().setSelectedExpiry('2026-05-15');
    expect(useChainStore.getState().chainData).toBeNull();
  });

  it('setError clears loading', () => {
    useChainStore.getState().setLoading(true);
    useChainStore.getState().setError('Network error');

    const state = useChainStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.loading).toBe(false);
  });

  it('clearChain resets everything', () => {
    useChainStore.getState().setChainData(mockChain);
    useChainStore.getState().clearChain();

    const state = useChainStore.getState();
    expect(state.chainData).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('open(symbol) sets isOpen and symbol, clears data/error', () => {
    useChainStore.getState().setChainData(mockChain);
    useChainStore.getState().setError('stale error');
    useChainStore.getState().open('MSFT');

    const state = useChainStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.symbol).toBe('MSFT');
    expect(state.chainData).toBeNull();
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('close() resets isOpen, symbol, data, and error', () => {
    useChainStore.getState().open('AAPL');
    useChainStore.getState().setChainData(mockChain);
    useChainStore.getState().close();

    const state = useChainStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.symbol).toBeNull();
    expect(state.chainData).toBeNull();
    expect(state.error).toBeNull();
  });

  it('open(symbol) after previous open clears stale data', () => {
    useChainStore.getState().open('AAPL');
    useChainStore.getState().setChainData(mockChain);

    // Open for a different symbol
    useChainStore.getState().open('TSLA');
    const state = useChainStore.getState();
    expect(state.symbol).toBe('TSLA');
    expect(state.chainData).toBeNull();
  });
});
