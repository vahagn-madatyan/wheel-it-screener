import { useCallback, useMemo } from 'react';
import { useFilterStore } from '@/stores/filter-store';
import { PRESETS } from '@/lib/constants';
import type { FilterState, Preset } from '@/types';
import { NumberInput } from './NumberInput';

/** Numeric fields that presets set (used for preset detection) */
const PRESET_NUMERIC_FIELDS = [
  'minPrice',
  'maxPrice',
  'minMktCap',
  'maxMktCap',
  'minVolume',
  'maxPE',
  'maxDebtEquity',
  'minNetMargin',
  'minSalesGrowth',
  'minROE',
] as const;

/** Boolean fields that presets set (mapped to FilterState keys) */
const PRESET_BOOL_MAP: Record<string, keyof FilterState> = {
  dividends: 'requireDividends',
  sma200: 'aboveSMA200',
  earnings: 'excludeEarnings',
  weeklies: 'requireWeeklies',
  riskySectors: 'excludeRiskySectors',
};

/** Check whether current filter state matches a specific preset */
function matchesPreset(state: FilterState, preset: Preset): boolean {
  for (const key of PRESET_NUMERIC_FIELDS) {
    if (state[key] !== preset[key]) return false;
  }
  // Check booleans
  for (const [presetKey, stateKey] of Object.entries(PRESET_BOOL_MAP)) {
    if (state[stateKey] !== preset[presetKey as keyof Preset]) return false;
  }
  // Check wheel criteria fields
  if (state.minPremium !== preset.minPremium) return false;
  if (state.maxBP !== preset.maxBP) return false;
  if (state.targetDTE !== parseInt(preset.targetDTE, 10)) return false;
  if (state.targetDelta !== parseFloat(preset.targetDelta)) return false;
  if (state.minIVRank !== preset.minIVRank) return false;
  if (state.maxIVRank !== preset.maxIVRank) return false;
  // Check weights
  if (state.weightPremium !== preset.weightPremium) return false;
  if (state.weightLiquidity !== preset.weightLiquidity) return false;
  if (state.weightStability !== preset.weightStability) return false;
  if (state.weightFundamentals !== preset.weightFundamentals) return false;
  return true;
}

/** Detect which preset matches current state, or "custom" */
function detectPreset(state: FilterState): string {
  for (const [name, preset] of Object.entries(PRESETS)) {
    if (matchesPreset(state, preset)) return name;
  }
  return 'custom';
}

const PRESET_OPTIONS = [
  { value: 'finviz_cut2', label: 'Finviz Cut 2 (Default)' },
  { value: 'conservative', label: 'Conservative' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'custom', label: 'Custom' },
];

const UNIVERSE_OPTIONS = [
  { value: 'wheel_popular', label: 'Wheel Popular (50)' },
  { value: 'sp500_top', label: 'S&P 500 Top 50' },
  { value: 'high_dividend', label: 'High Dividend (30)' },
  { value: 'custom', label: 'Custom Tickers' },
];

export function StockFiltersSection() {
  const state = useFilterStore();
  const setFilter = useFilterStore((s) => s.setFilter);
  const applyPreset = useFilterStore((s) => s.applyPreset);

  // Derive the current preset from the full filter state
  const currentPreset = useMemo(() => detectPreset(state), [state]);

  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value !== 'custom') {
        applyPreset(value);
      }
    },
    [applyPreset],
  );

  const handleUniverseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter('tickerUniverse', e.target.value);
    },
    [setFilter],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Preset Dropdown */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="preset-select"
          className="text-xs font-medium text-sidebar-foreground/70"
        >
          Preset
        </label>
        <select
          id="preset-select"
          value={currentPreset}
          onChange={handlePresetChange}
          className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-sm text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ticker Universe */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="universe-select"
          className="text-xs font-medium text-sidebar-foreground/70"
        >
          Ticker Universe
        </label>
        <select
          id="universe-select"
          value={state.tickerUniverse}
          onChange={handleUniverseChange}
          className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-sm text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {UNIVERSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Tickers (only visible when universe is "custom") */}
      {state.tickerUniverse === 'custom' && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="custom-tickers"
            className="text-xs font-medium text-sidebar-foreground/70"
          >
            Custom Tickers
          </label>
          <input
            id="custom-tickers"
            type="text"
            value={state.customTickers}
            onChange={(e) => setFilter('customTickers', e.target.value)}
            placeholder="AAPL, MSFT, NVDA…"
            className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Numeric Filter Rows */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <NumberInput
          label="Min Price ($)"
          value={state.minPrice}
          onChange={(v) => setFilter('minPrice', v ?? 0)}
          min={0}
          step={1}
          required
        />
        <NumberInput
          label="Max Price ($)"
          value={state.maxPrice}
          onChange={(v) => setFilter('maxPrice', v ?? 0)}
          min={0}
          step={1}
          required
        />

        <NumberInput
          label="Min Mkt Cap (B)"
          value={state.minMktCap}
          onChange={(v) => setFilter('minMktCap', v ?? 0)}
          min={0}
          step={0.1}
          required
        />
        <NumberInput
          label="Max Mkt Cap (B)"
          value={state.maxMktCap}
          onChange={(v) => setFilter('maxMktCap', v ?? 0)}
          min={0}
          step={1}
          required
        />

        <NumberInput
          label="Min Volume (M)"
          value={state.minVolume}
          onChange={(v) => setFilter('minVolume', v ?? 0)}
          min={0}
          step={0.1}
          required
        />
        <NumberInput
          label="Max P/E"
          value={state.maxPE}
          onChange={(v) => setFilter('maxPE', v ?? 0)}
          min={0}
          step={1}
          required
        />

        <NumberInput
          label="Max D/E Ratio"
          value={state.maxDebtEquity}
          onChange={(v) => setFilter('maxDebtEquity', v)}
          min={0}
          step={0.1}
          placeholder="Any"
        />
        <NumberInput
          label="Min Net Margin (%)"
          value={state.minNetMargin}
          onChange={(v) => setFilter('minNetMargin', v)}
          step={1}
          placeholder="Any"
        />

        <NumberInput
          label="Min Sales Growth (%)"
          value={state.minSalesGrowth}
          onChange={(v) => setFilter('minSalesGrowth', v)}
          step={1}
          placeholder="Any"
        />
        <NumberInput
          label="Min ROE (%)"
          value={state.minROE}
          onChange={(v) => setFilter('minROE', v)}
          step={1}
          placeholder="Any"
        />
      </div>
    </div>
  );
}
