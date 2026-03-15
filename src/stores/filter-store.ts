import { create } from "zustand";
import type { FilterState, Preset } from "@/types";
import { PRESETS, DEFAULT_WEIGHTS } from "@/lib/constants";

/** Maps Preset boolean field names to FilterState field names */
const BOOL_FIELD_MAP: Record<string, keyof FilterState> = {
  dividends: "requireDividends",
  sma200: "aboveSMA200",
  earnings: "excludeEarnings",
  weeklies: "requireWeeklies",
  riskySectors: "excludeRiskySectors",
} as const;

/** Convert a Preset (string DTE/Delta, short bool names) to FilterState fields */
function presetToFilterState(preset: Preset): Omit<FilterState, "tickerUniverse" | "customTickers"> {
  return {
    minPrice: preset.minPrice,
    maxPrice: preset.maxPrice,
    minMktCap: preset.minMktCap,
    maxMktCap: preset.maxMktCap,
    minVolume: preset.minVolume,
    maxPE: preset.maxPE,
    maxDebtEquity: preset.maxDebtEquity,
    minNetMargin: preset.minNetMargin,
    minSalesGrowth: preset.minSalesGrowth,
    minROE: preset.minROE,
    minPremium: preset.minPremium,
    maxBP: preset.maxBP,
    targetDTE: parseInt(preset.targetDTE, 10),
    targetDelta: parseFloat(preset.targetDelta),
    minIVRank: preset.minIVRank,
    maxIVRank: preset.maxIVRank,
    requireDividends: preset.dividends,
    aboveSMA200: preset.sma200,
    excludeEarnings: preset.earnings,
    requireWeeklies: preset.weeklies,
    excludeRiskySectors: preset.riskySectors,
    weightPremium: preset.weightPremium,
    weightLiquidity: preset.weightLiquidity,
    weightStability: preset.weightStability,
    weightFundamentals: preset.weightFundamentals,
  };
}

const DEFAULT_PRESET = PRESETS.finviz_cut2;

function getDefaultFilterState(): FilterState {
  return {
    ...presetToFilterState(DEFAULT_PRESET),
    tickerUniverse: "wheel_popular",
    customTickers: "",
  };
}

interface FilterStore extends FilterState {
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  applyPreset: (presetName: string) => void;
}

export const useFilterStore = create<FilterStore>()((set) => ({
  ...getDefaultFilterState(),

  setFilter: (key, value) => set({ [key]: value }),

  resetFilters: () => set(getDefaultFilterState()),

  applyPreset: (presetName) => {
    const preset = PRESETS[presetName];
    if (!preset) {
      console.warn(`[filterStore] Unknown preset: ${presetName}`);
      return;
    }
    set(presetToFilterState(preset));
  },
}));

