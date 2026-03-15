import { useCallback } from "react";
import { useFilterStore } from "@/stores/filter-store";
import { Slider } from "@/components/ui/slider";
import type { WeightConfig } from "@/types";

const WEIGHT_KEYS: (keyof WeightConfig)[] = [
  "weightPremium",
  "weightLiquidity",
  "weightStability",
  "weightFundamentals",
];

const WEIGHT_LABELS: Record<keyof WeightConfig, string> = {
  weightPremium: "Premium",
  weightLiquidity: "Liquidity",
  weightStability: "Stability",
  weightFundamentals: "Fundamentals",
};

/**
 * Redistribute weights when one slider changes.
 *
 * Logic:
 * 1. Compute diff = newValue - oldValue for the changed key
 * 2. Distribute the negative of that diff proportionally across the other 3 keys,
 *    based on each key's share of the remaining total
 * 3. Clamp all values at 0
 * 4. Round to integers; assign rounding remainder to the largest of the other 3
 *
 * Exported as a pure function for testing.
 */
export function redistributeWeights(
  changedKey: keyof WeightConfig,
  newValue: number,
  weights: WeightConfig,
): WeightConfig {
  const result = { ...weights };
  const oldValue = weights[changedKey];
  const diff = newValue - oldValue;

  if (diff === 0) return result;

  result[changedKey] = newValue;

  const otherKeys = WEIGHT_KEYS.filter((k) => k !== changedKey);

  // Sum of other weights before change
  const otherSum = otherKeys.reduce((sum, k) => sum + weights[k], 0);

  if (otherSum === 0) {
    // All others are 0 — distribute equally among others
    const perKey = Math.floor(-diff / otherKeys.length);
    const remainder = -diff - perKey * otherKeys.length;
    for (let i = 0; i < otherKeys.length; i++) {
      result[otherKeys[i]] = Math.max(0, perKey + (i === 0 ? remainder : 0));
    }
    return result;
  }

  // Distribute the negative-diff proportionally by each key's share
  const rawAdjusted: { key: keyof WeightConfig; value: number }[] = otherKeys.map((k) => {
    const share = weights[k] / otherSum;
    return { key: k, value: weights[k] - diff * share };
  });

  // Clamp at 0
  for (const item of rawAdjusted) {
    item.value = Math.max(0, item.value);
  }

  // Integer rounding: floor all, assign remainder to the largest-valued other key
  const floored = rawAdjusted.map((item) => ({
    ...item,
    floored: Math.floor(item.value),
    fractional: item.value - Math.floor(item.value),
  }));

  const flooredSum = floored.reduce((s, item) => s + item.floored, 0);
  const targetOtherSum = 100 - newValue;
  let remainder = targetOtherSum - flooredSum;

  // Sort by fractional part descending to distribute remainder fairly
  const sorted = [...floored].sort((a, b) => b.fractional - a.fractional);

  for (const item of sorted) {
    if (remainder <= 0) break;
    item.floored += 1;
    remainder -= 1;
  }

  for (const item of floored) {
    result[item.key] = Math.max(0, item.floored);
  }

  return result;
}

export function ScoringWeightsSection() {
  const weightPremium = useFilterStore((s) => s.weightPremium);
  const weightLiquidity = useFilterStore((s) => s.weightLiquidity);
  const weightStability = useFilterStore((s) => s.weightStability);
  const weightFundamentals = useFilterStore((s) => s.weightFundamentals);
  const setFilter = useFilterStore((s) => s.setFilter);

  const weights: WeightConfig = {
    weightPremium,
    weightLiquidity,
    weightStability,
    weightFundamentals,
  };

  const handleWeightChange = useCallback(
    (key: keyof WeightConfig) => (value: number) => {
      const currentWeights: WeightConfig = {
        weightPremium: useFilterStore.getState().weightPremium,
        weightLiquidity: useFilterStore.getState().weightLiquidity,
        weightStability: useFilterStore.getState().weightStability,
        weightFundamentals: useFilterStore.getState().weightFundamentals,
      };
      const redistributed = redistributeWeights(key, value, currentWeights);
      // Batch-set all 4 weights
      for (const wk of WEIGHT_KEYS) {
        setFilter(wk, redistributed[wk]);
      }
    },
    [setFilter],
  );

  return (
    <div className="flex flex-col gap-3">
      {WEIGHT_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-sidebar-foreground/70">
              {WEIGHT_LABELS[key]}
            </label>
            <span className="text-xs tabular-nums text-sidebar-foreground/60">
              {weights[key]}%
            </span>
          </div>
          <Slider
            value={weights[key]}
            onValueChange={handleWeightChange(key)}
            min={0}
            max={100}
            step={1}
          />
        </div>
      ))}
      <p className="text-[10px] text-sidebar-foreground/40">
        Total: {weightPremium + weightLiquidity + weightStability + weightFundamentals}%
      </p>
    </div>
  );
}
