import type { PutOption } from "@/types";

/**
 * Score an array of put options and assign recommendation badges.
 * Pure function — returns a new array of scored PutOption objects.
 *
 * Replicates vanilla app.js scorePuts exactly:
 * - ITM puts get putScore=0, rec="itm"
 * - OTM puts scored on spread (30%), liquidity (25%), premium (20%),
 *   delta (15%), IV (10%)
 * - liqBonus applied BEFORE min(100) cap
 * - Rec badges: top 2 OTM by score (with bid>0) get "best" if ≥50,
 *   then ≥60 → "good", ≥35 → "ok", else "caution"
 */
export function scorePuts(
  puts: PutOption[],
  targetDelta: number,
): PutOption[] {
  const maxOI = Math.max(
    1,
    Math.max(...puts.map((p) => p.oi).concat([1])),
  );
  const maxVol = Math.max(
    1,
    Math.max(...puts.map((p) => p.volume).concat([1])),
  );

  // Score each put (returns new objects)
  const scored = puts.map((p) => {
    const result = { ...p };

    if (result.itm) {
      result.putScore = 0;
      result.rec = "itm";
      return result;
    }

    // Spread quality (30%)
    let spreadScore = 0;
    if (result.bid <= 0 && result.ask <= 0) spreadScore = 0;
    else if (result.spreadPct <= 3) spreadScore = 100;
    else if (result.spreadPct <= 5) spreadScore = 85;
    else if (result.spreadPct <= 10) spreadScore = 60;
    else if (result.spreadPct <= 15) spreadScore = 35;
    else if (result.spreadPct <= 25) spreadScore = 15;
    else spreadScore = 5;

    // Liquidity (25%)
    const oiScore = Math.min(100, (result.oi / maxOI) * 100);
    const volScore = Math.min(100, (result.volume / maxVol) * 100);
    const liquidityScore = oiScore * 0.6 + volScore * 0.4;
    const liqBonus = (result.oi > 100 ? 10 : 0) + (result.volume > 10 ? 5 : 0);

    // Premium yield (20%)
    const premScore = Math.min(100, (result.premYield / 25) * 100);

    // Delta sweet spot (15%)
    let deltaScore = 50;
    if (result.delta !== null) {
      const absDelta = Math.abs(result.delta);
      const diff = Math.abs(absDelta - targetDelta);
      if (diff < 0.03) deltaScore = 100;
      else if (diff < 0.05) deltaScore = 85;
      else if (diff < 0.1) deltaScore = 65;
      else if (diff < 0.15) deltaScore = 40;
      else deltaScore = Math.max(5, 30 - diff * 100);
    }

    // IV level (10%)
    let ivScore = 50;
    if (result.iv !== null) {
      const ivPct = result.iv * 100;
      if (ivPct >= 25 && ivPct <= 50) ivScore = 90;
      else if (ivPct >= 20 && ivPct <= 60) ivScore = 70;
      else if (ivPct > 60) ivScore = 45;
      else ivScore = 30;
    }

    // Store rounded sub-scores
    result.spreadScore = Math.round(spreadScore);
    result.liquidityScore = Math.round(Math.min(100, liquidityScore + liqBonus));
    result.premScore = Math.round(premScore);
    result.deltaScore = Math.round(deltaScore);
    result.ivScore = Math.round(ivScore);

    // Weighted total — uses unrounded sub-scores (matching vanilla)
    result.putScore = Math.round(
      spreadScore * 0.3 +
        Math.min(100, liquidityScore + liqBonus) * 0.25 +
        premScore * 0.2 +
        deltaScore * 0.15 +
        ivScore * 0.1,
    );
    result.putScore = Math.max(0, Math.min(100, result.putScore));

    return result;
  });

  // Assign recommendations — sort OTM puts with bid>0 by putScore desc
  const otmPuts = scored.filter((p) => !p.itm && p.bid > 0);
  otmPuts.sort((a, b) => b.putScore - a.putScore);

  otmPuts.forEach((p, i) => {
    if (i < 2 && p.putScore >= 50) p.rec = "best";
    else if (p.putScore >= 60) p.rec = "good";
    else if (p.putScore >= 35) p.rec = "ok";
    else p.rec = "caution";
  });

  // Unscored non-ITM puts get "caution", unscored ITM get "itm"
  scored.forEach((p) => {
    if (!p.rec && !p.itm) p.rec = "caution";
    if (!p.rec) p.rec = "itm";
  });

  return scored;
}
