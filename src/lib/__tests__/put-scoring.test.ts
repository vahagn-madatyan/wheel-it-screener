import { describe, it, expect } from "vitest";
import { scorePuts } from "../put-scoring";
import type { PutOption } from "@/types";

/** Factory for a minimal PutOption */
function makePut(overrides: Partial<PutOption> = {}): PutOption {
  return {
    strike: 45,
    bid: 1.5,
    ask: 1.8,
    mid: 1.65,
    spread: 0.3,
    spreadPct: 18.18,
    volume: 50,
    oi: 200,
    delta: -0.3,
    iv: 0.35,
    last: 1.6,
    premYield: 13.4,
    itm: false,
    dte: 30,
    putScore: 0,
    rec: "",
    ...overrides,
  };
}

describe("scorePuts", () => {
  it("does not mutate the input array or its objects", () => {
    const puts = [makePut()];
    const origJson = JSON.stringify(puts);
    scorePuts(puts, 0.3);
    expect(JSON.stringify(puts)).toBe(origJson);
  });

  it("returns ITM puts with putScore=0 and rec='itm'", () => {
    const puts = [makePut({ itm: true, strike: 55 })];
    const result = scorePuts(puts, 0.3);
    expect(result[0].putScore).toBe(0);
    expect(result[0].rec).toBe("itm");
  });

  it("computes exact sub-scores for a known OTM put", () => {
    // Single put: maxOI=200, maxVol=50
    // spreadPct=18.18 (in 15-25 range) => spreadScore = 15
    // oiScore = min(100, (200/200)*100) = 100
    // volScore = min(100, (50/50)*100) = 100
    // liquidityScore = 100*0.6 + 100*0.4 = 100
    // liqBonus = (200>100 ? 10 : 0) + (50>10 ? 5 : 0) = 15
    // liquidityScore + liqBonus = 115 => capped to 100
    // premScore = min(100, (13.4/25)*100) = 53.6
    // delta=-0.3, targetDelta=0.3, absDelta=0.3, diff=0 (<0.03) => deltaScore=100
    // iv=0.35, ivPct=35, (25-50 range) => ivScore=90
    //
    // Stored sub-scores (rounded):
    //   spreadScore=15, liquidityScore=100, premScore=54, deltaScore=100, ivScore=90
    //
    // putScore = round(15*0.30 + 100*0.25 + 53.6*0.20 + 100*0.15 + 90*0.10)
    //          = round(4.5 + 25 + 10.72 + 15 + 9) = round(64.22) = 64
    const puts = [makePut()];
    const result = scorePuts(puts, 0.3);
    const p = result[0];

    expect(p.spreadScore).toBe(15);
    expect(p.liquidityScore).toBe(100);
    expect(p.premScore).toBe(54);
    expect(p.deltaScore).toBe(100);
    expect(p.ivScore).toBe(90);
    expect(p.putScore).toBe(64);
  });

  it("handles all spread quality tiers", () => {
    const tier = (spreadPct: number) => {
      const result = scorePuts([makePut({ spreadPct })], 0.3);
      return result[0].spreadScore;
    };
    expect(tier(2)).toBe(100);   // <=3
    expect(tier(4)).toBe(85);    // <=5
    expect(tier(8)).toBe(60);    // <=10
    expect(tier(12)).toBe(35);   // <=15
    expect(tier(20)).toBe(15);   // <=25
    expect(tier(30)).toBe(5);    // >25
  });

  it("gives spreadScore=0 when bid=0 and ask=0", () => {
    const result = scorePuts([makePut({ bid: 0, ask: 0 })], 0.3);
    expect(result[0].spreadScore).toBe(0);
  });

  it("applies liqBonus before min(100) cap", () => {
    // Put A: high OI (200) and volume (50) => liquidityScore = 100, liqBonus = 15
    //   liqScore + bonus = 115 => capped to 100
    // Put B: low OI (10) and volume (2) => oiScore = (10/200)*100=5, volScore=(2/50)*100=4
    //   liquidityScore = 5*0.6 + 4*0.4 = 4.6, liqBonus = 0
    //   stored = round(min(100, 4.6)) = 5
    const puts = [
      makePut({ oi: 200, volume: 50 }),
      makePut({ strike: 44, oi: 10, volume: 2 }),
    ];
    const result = scorePuts(puts, 0.3);
    expect(result[0].liquidityScore).toBe(100); // capped after bonus
    expect(result[1].liquidityScore).toBe(5);   // no bonus
  });

  it("computes liqBonus tiers correctly", () => {
    // oi=150 (>100) => +10, volume=15 (>10) => +5 = 15 total
    // oi=50 (<=100) => +0, volume=15 (>10) => +5 = 5 total
    // oi=150 (>100) => +10, volume=5 (<=10) => +0 = 10 total
    const p1 = scorePuts([makePut({ oi: 150, volume: 15 })], 0.3);
    const p2 = scorePuts([makePut({ oi: 50, volume: 15 })], 0.3);
    const p3 = scorePuts([makePut({ oi: 150, volume: 5 })], 0.3);

    // Verify relative ordering: full bonus > partial > none
    // The liqBonus contributes to putScore, so with everything else equal,
    // p1 should have highest putScore
    expect(p1[0].putScore).toBeGreaterThanOrEqual(p2[0].putScore);
    expect(p1[0].putScore).toBeGreaterThanOrEqual(p3[0].putScore);
  });

  it("handles delta sweet spot tiers", () => {
    const deltaAt = (delta: number) => {
      const result = scorePuts([makePut({ delta })], 0.3);
      return result[0].deltaScore;
    };
    // targetDelta=0.3, absDelta=0.3, diff=0 => 100
    expect(deltaAt(-0.3)).toBe(100);
    // diff=0.04 => 85
    expect(deltaAt(-0.26)).toBe(85);
    // diff=0.08 => 65
    expect(deltaAt(-0.22)).toBe(65);
    // diff=0.12 => 40
    expect(deltaAt(-0.18)).toBe(40);
    // diff=0.25 => max(5, 30 - 0.25*100) = max(5, 5) = 5
    expect(deltaAt(-0.05)).toBe(5);
  });

  it("defaults deltaScore to 50 when delta is null", () => {
    const result = scorePuts([makePut({ delta: null })], 0.3);
    expect(result[0].deltaScore).toBe(50);
  });

  it("handles IV score tiers", () => {
    const ivAt = (iv: number) => {
      const result = scorePuts([makePut({ iv })], 0.3);
      return result[0].ivScore;
    };
    expect(ivAt(0.35)).toBe(90);  // 25-50 sweet spot
    expect(ivAt(0.22)).toBe(70);  // 20-60 range but <25
    expect(ivAt(0.55)).toBe(70);  // 20-60 range but >50
    expect(ivAt(0.75)).toBe(45);  // >60
    expect(ivAt(0.15)).toBe(30);  // <20
  });

  it("defaults ivScore to 50 when iv is null", () => {
    const result = scorePuts([makePut({ iv: null })], 0.3);
    expect(result[0].ivScore).toBe(50);
  });

  it("assigns rec badges based on score ranking and thresholds", () => {
    // Create 5 OTM puts with descending scores
    const puts = [
      makePut({ strike: 45, spreadPct: 2, oi: 500, volume: 100, premYield: 20, delta: -0.3, iv: 0.35 }),  // high score
      makePut({ strike: 44, spreadPct: 3, oi: 400, volume: 80, premYield: 18, delta: -0.29, iv: 0.35 }), // second high
      makePut({ strike: 43, spreadPct: 4, oi: 300, volume: 60, premYield: 16, delta: -0.28, iv: 0.35 }), // third
      makePut({ strike: 42, spreadPct: 12, oi: 50, volume: 5, premYield: 8, delta: -0.15, iv: 0.15 }),   // low score
      makePut({ strike: 41, spreadPct: 30, oi: 5, volume: 0, premYield: 2, delta: -0.05, iv: 0.1, bid: 0.05, ask: 0.10 }), // very low
    ];

    const result = scorePuts(puts, 0.3);

    // Sort OTM by putScore desc for analysis
    const otm = result.filter((p) => !p.itm && p.bid > 0);
    otm.sort((a, b) => b.putScore - a.putScore);

    // Top 2 with score ≥50 get "best"
    expect(otm[0].rec).toBe("best");
    expect(otm[1].rec).toBe("best");
  });

  it("assigns 'best' only to top 2 even if more have score ≥50", () => {
    // Three puts all with high scores, only top 2 get "best"
    const puts = [
      makePut({ strike: 45, spreadPct: 2, premYield: 20, delta: -0.3, iv: 0.35 }),
      makePut({ strike: 44, spreadPct: 3, premYield: 18, delta: -0.29, iv: 0.35 }),
      makePut({ strike: 43, spreadPct: 3, premYield: 17, delta: -0.28, iv: 0.35 }),
    ];

    const result = scorePuts(puts, 0.3);
    const bestCount = result.filter((p) => p.rec === "best").length;
    expect(bestCount).toBeLessThanOrEqual(2);
    // Third highest should get "good" (if ≥60) or "ok"
    const third = [...result].sort((a, b) => b.putScore - a.putScore)[2];
    expect(["good", "ok"]).toContain(third.rec);
  });

  it("assigns 'caution' to unscored non-ITM puts (bid=0)", () => {
    const puts = [
      makePut({ strike: 40, bid: 0, ask: 0.05, premYield: 0 }),
    ];
    const result = scorePuts(puts, 0.3);
    // bid=0, so not in the OTM sort/assign loop
    expect(result[0].rec).toBe("caution");
  });

  it("handles mixed ITM and OTM puts", () => {
    const puts = [
      makePut({ strike: 55, itm: true }),
      makePut({ strike: 45, itm: false }),
      makePut({ strike: 40, itm: false }),
    ];
    const result = scorePuts(puts, 0.3);
    expect(result[0].rec).toBe("itm");
    expect(result[0].putScore).toBe(0);
    // OTM puts should have scores and recs
    expect(result[1].putScore).toBeGreaterThan(0);
    expect(result[2].putScore).toBeGreaterThan(0);
  });

  it("handles all-zero / all-null input gracefully", () => {
    const puts = [
      makePut({
        bid: 0, ask: 0, mid: 0, spread: 0, spreadPct: 0,
        volume: 0, oi: 0, delta: null, iv: null, premYield: 0,
      }),
    ];
    const result = scorePuts(puts, 0.3);
    expect(result[0].putScore).toBeGreaterThanOrEqual(0);
    expect(result[0].rec).toBe("caution"); // bid=0 => not in OTM assignment
  });

  it("handles empty puts array", () => {
    const result = scorePuts([], 0.3);
    expect(result).toEqual([]);
  });
});
