import { describe, it, expect } from "vitest";
import { redistributeWeights } from "../ScoringWeightsSection";
import type { WeightConfig } from "@/types";

/** Helper: sum all weight values */
function sum(w: WeightConfig): number {
  return w.weightPremium + w.weightLiquidity + w.weightStability + w.weightFundamentals;
}

describe("redistributeWeights", () => {
  const defaults: WeightConfig = {
    weightPremium: 30,
    weightLiquidity: 20,
    weightStability: 25,
    weightFundamentals: 25,
  };

  it("(a) increase one weight → others decrease proportionally", () => {
    // Increase premium from 30 → 50 (diff = +20)
    // Others share 70 total, each loses proportionally
    const result = redistributeWeights("weightPremium", 50, defaults);

    expect(result.weightPremium).toBe(50);
    expect(sum(result)).toBe(100);
    // All others should have decreased
    expect(result.weightLiquidity).toBeLessThan(20);
    expect(result.weightStability).toBeLessThan(25);
    expect(result.weightFundamentals).toBeLessThan(25);
    // Proportional: liquidity had 20/70 ≈ 28.6% of remaining,
    // stability and fundamentals each had 25/70 ≈ 35.7%
    // liquidity loses 20 * (20/70) ≈ 5.7 → ~14
    // stability/fundamentals each lose 20 * (25/70) ≈ 7.1 → ~18
    expect(result.weightLiquidity).toBeGreaterThanOrEqual(14);
    expect(result.weightLiquidity).toBeLessThanOrEqual(15);
  });

  it("(b) decrease one weight → others increase proportionally", () => {
    // Decrease premium from 30 → 10 (diff = -20)
    const result = redistributeWeights("weightPremium", 10, defaults);

    expect(result.weightPremium).toBe(10);
    expect(sum(result)).toBe(100);
    // All others should have increased
    expect(result.weightLiquidity).toBeGreaterThan(20);
    expect(result.weightStability).toBeGreaterThan(25);
    expect(result.weightFundamentals).toBeGreaterThan(25);
  });

  it("(c) set one weight to 100 → others become 0", () => {
    const result = redistributeWeights("weightPremium", 100, defaults);

    expect(result.weightPremium).toBe(100);
    expect(result.weightLiquidity).toBe(0);
    expect(result.weightStability).toBe(0);
    expect(result.weightFundamentals).toBe(0);
    expect(sum(result)).toBe(100);
  });

  it("(d) set one weight to 0 → others increase proportionally", () => {
    const result = redistributeWeights("weightPremium", 0, defaults);

    expect(result.weightPremium).toBe(0);
    expect(sum(result)).toBe(100);
    expect(result.weightLiquidity).toBeGreaterThan(20);
    expect(result.weightStability).toBeGreaterThan(25);
    expect(result.weightFundamentals).toBeGreaterThan(25);
  });

  it("(e) rounding preserves sum = 100", () => {
    // Use odd numbers that won't divide evenly
    const oddWeights: WeightConfig = {
      weightPremium: 33,
      weightLiquidity: 22,
      weightStability: 23,
      weightFundamentals: 22,
    };
    const result = redistributeWeights("weightPremium", 47, oddWeights);

    expect(result.weightPremium).toBe(47);
    expect(sum(result)).toBe(100);
    // All values should be non-negative integers
    expect(Number.isInteger(result.weightLiquidity)).toBe(true);
    expect(Number.isInteger(result.weightStability)).toBe(true);
    expect(Number.isInteger(result.weightFundamentals)).toBe(true);
    expect(result.weightLiquidity).toBeGreaterThanOrEqual(0);
    expect(result.weightStability).toBeGreaterThanOrEqual(0);
    expect(result.weightFundamentals).toBeGreaterThanOrEqual(0);
  });

  it("(f) edge case: two others at 0, only one absorbs the change", () => {
    const edgeWeights: WeightConfig = {
      weightPremium: 60,
      weightLiquidity: 0,
      weightStability: 0,
      weightFundamentals: 40,
    };
    // Increase premium from 60 → 80
    const result = redistributeWeights("weightPremium", 80, edgeWeights);

    expect(result.weightPremium).toBe(80);
    expect(result.weightLiquidity).toBe(0);
    expect(result.weightStability).toBe(0);
    expect(result.weightFundamentals).toBe(20);
    expect(sum(result)).toBe(100);
  });

  it("no change returns identical weights", () => {
    const result = redistributeWeights("weightPremium", 30, defaults);
    expect(result).toEqual(defaults);
  });

  it("handles all others at 0 when decreasing changed key", () => {
    // Edge: premium is 100, others are 0, decrease premium to 40
    const allOne: WeightConfig = {
      weightPremium: 100,
      weightLiquidity: 0,
      weightStability: 0,
      weightFundamentals: 0,
    };
    const result = redistributeWeights("weightPremium", 40, allOne);

    expect(result.weightPremium).toBe(40);
    expect(sum(result)).toBe(100);
    // The 60 freed up should be distributed among the three others
    expect(result.weightLiquidity + result.weightStability + result.weightFundamentals).toBe(60);
  });
});
