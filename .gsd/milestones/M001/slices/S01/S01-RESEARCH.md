# S01: Foundation + Business Logic — Research

**Date:** 2026-03-12

## Summary

S01 covers R001–R005: Vite scaffold, Tailwind v4 + shadcn/ui theming, TypeScript interfaces, pure business logic extraction, and Vitest parity tests. The vanilla `app.js` (1335 lines) is a monolith mixing DOM manipulation with business logic, but the pure logic is cleanly identifiable — two scoring functions, one filtering pipeline, formatters, ticker lists, presets, and an OCC parser. Total extractable logic is roughly ~400 lines.

The primary risk is **scoring parity**. The vanilla code uses several patterns that could silently produce different results under TypeScript strict mode: `parseFloat("")` returning `NaN` used as a "don't filter" sentinel, in-place mutation chains, `Math.max.apply(null, arr.concat([1]))` idioms, and cascading conditionals with specific numeric thresholds. Each must be replicated exactly.

**Critical requirement discrepancy:** R004 describes "wheelScore 6-factor" with weights "price 15%, volume 15%, IV rank 20%, premium yield 20%, spread 15%, earnings proximity 15%" — but the actual `computeWheelScore()` in `app.js` is a **4-factor** score: premium, liquidity, stability, fundamentals with user-configurable weights (default 30/20/25/25). The code is truth. R004's description needs correction before planning.

## Recommendation

Extract business logic bottom-up: formatters → constants → sector exclusion → wheel metrics → wheel score → put score → filter pipeline. Each function becomes a pure TypeScript function that takes typed inputs and returns typed outputs (no mutation). Write Vitest parity tests alongside each extraction using known inputs snapshotted from the vanilla app's actual computations. Keep the Vite scaffold minimal — only install what S01 needs, defer shadcn/ui component additions to S03+.

For the project scaffold, use `create vite` with React + TypeScript template, then layer in Tailwind v4 (`@tailwindcss/vite`), shadcn/ui init (Vite framework option), and Vitest (via vite config `test` block). Path aliases via `resolve.tsconfigPaths: true` in vite config.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| CSS variable theming | shadcn/ui `@theme inline` + `:root` / `.dark` blocks | Established pattern with oklch color space, matches Tailwind v4 expectations |
| Path aliases | Vite `resolve.tsconfigPaths: true` | Native Vite support, no extra plugin needed — reads from tsconfig.json |
| Test runner | Vitest via `vite.config.ts` `test` block | Shares Vite's transform pipeline, path aliases work automatically |
| CSS reset / preflight | Tailwind v4 built-in | Replaces `base.css` |

## Existing Code and Patterns

### Pure Business Logic (extract as-is, then type)

- `app.js:computeWheelMetrics(stock, filters)` L496–L545 — Mutates stock in-place: computes buyingPower, earningsDays, ivRank (estimated from 52w range + beta + price position), premiumYield (estimated from ivRank + delta + DTE), sma200Status/sma200Pct. **Must preserve exact IV rank estimation formula** — it's an approximation but it's THE approximation users see.
- `app.js:computeWheelScore(stock, filters)` L547–L610 — 4-factor weighted score: premiumScore (premYield/35*100), liquidityScore (vol/20*100), stabilityScore (beta sweet spot 0.5–1.3 blended with 52w range position), fundamentalsScore (PE tiers + dividend/ROE/analyst/margin bonuses). Stores sub-scores on stock object.
- `app.js:scorePuts(puts, targetDelta)` L1047–L1117 — 5-factor weighted put score: spread(30%), liquidity(25%), premium(20%), delta(15%), IV(10%). Then assigns rec badges: top 2 with score≥50 → "best", ≥60 → "good", ≥35 → "ok", else "caution", ITM → "itm". **Note:** liquidity score has a bonus (`liqBonus`) added *before* the min(100) cap — ordering matters.
- `app.js:parseStrikeFromSymbol(sym)` L1028–L1032 — OCC symbol parser: extracts last 8 digits, divides by 1000.
- `app.js:isExcludedSector(industry, symbol)` L98–L103 — Checks ticker against `EXCLUDED_TICKERS` list (case-insensitive on industry, uppercase on symbol).
- `app.js:getTickerList(filters)` L200–L216 — Builds array from universe + custom tickers (deduped, uppercase, length ≤ 10).
- `app.js:formatNum(n, decimals)` L801 — `toLocaleString('en-US')` with min/max fraction digits. Returns "—" for null/undefined/NaN.
- `app.js:formatMktCap(cap)` L806 — T/B/M suffixed formatting.
- `app.js:escapeHtml(str)` L812 — DOM-based HTML escaping. **Note:** uses `document.createElement` — needs a non-DOM implementation for pure function extraction.
- `app.js:truncate(str, len)` L818 — Simple truncation with "…".

### Constants (extract as typed const arrays/records)

- `TICKER_LISTS` — 3 curated arrays (wheel_popular: 50, sp500_top: 50, high_dividend: 30)
- `PRESETS` — 3 preset configs (finviz_cut2, conservative, aggressive) each with ~22 filter values
- `EXCLUDED_INDUSTRIES` — 10 industry strings
- `EXCLUDED_TICKERS` — 30 meme/crypto/leveraged tickers

### Patterns to Avoid

- `app.js:getFilters()` L105–L140 — Reads DOM elements directly. **Do not extract** — this becomes Zustand store state in S02. But the NaN sentinel pattern (`parseFloat("") → NaN`, then `!isNaN(x)` guard in filter loop) must be replicated in the filter function's type signature.
- `app.js:runScreener()` L218–L420 — Orchestration mixing API calls, DOM updates, and filtering. **Do not extract wholesale** — decompose into: (1) filter pipeline (pure), (2) scan orchestration (S05), (3) API calls (S02).

## Constraints

- **Vite + React 19**: React 19 is stable. Vite's `@vitejs/plugin-react` supports it. Use `react@19` and `react-dom@19`.
- **Tailwind v4 + shadcn/ui**: shadcn/ui v4 uses `@import "tailwindcss"` (not `@tailwind` directives), `@theme inline` for variable registration, `oklch` color space, and `@custom-variant dark (&:is(.dark *))` for dark mode.
- **TypeScript strict mode**: The scoring logic uses implicit coercion in several places (`stock.pe > 0` where pe could be null, `vol || 0` fallbacks). All need explicit null checks or defaults.
- **No DOM in pure functions**: `escapeHtml()` uses `document.createElement()`. Replace with a string-based implementation for the pure module. The DOM version only handles `<`, `>`, `&`, `"`, `'` — a simple replace chain suffices.
- **Financial Terminal Noir colors**: Primary emerald #34d399 needs oklch conversion. Base hsl(220, 14%, 5%) ≈ oklch(0.15 0.02 260). All shadcn semantic variables (background, foreground, primary, card, popover, etc.) must be mapped to the noir palette.

## Common Pitfalls

- **NaN-as-sentinel in filters** — Vanilla uses `parseFloat("")` → `NaN` for "field not set", then guards with `!isNaN(x)` before filtering. TypeScript should model these as `number | undefined` and check `x !== undefined` instead. But the filter function must accept both patterns to achieve parity — test with both set and unset values.
- **Mutation ordering in scoring** — `computeWheelMetrics` must run before `computeWheelScore` because the score depends on `ivRank`, `premiumYield`, etc. that metrics computes. The pure function versions should make this dependency explicit via input types.
- **Put score liquidity bonus before cap** — In `scorePuts`, the liqBonus (10 for OI>100, 5 for volume>10) is added to `liquidityScore` *before* `Math.min(100, ...)` — so the bonus can push score above the natural cap, but the final result is still capped at 100. Must preserve this ordering.
- **Recommendation assignment depends on sort** — `scorePuts` sorts OTM puts by putScore descending, then assigns "best" to top 2 (if score≥50). If the pure function returns an unsorted array, the rec badges would be wrong. Must sort before assigning recs.
- **IV rank estimation is approximate** — The formula (`positionFactor + betaFactor + rangeFactor * 0.3`) is a heuristic, not real IV rank. Users see these numbers. Any change in the formula would visibly change results. Replicate exactly.
- **formatNum locale sensitivity** — `toLocaleString('en-US')` behavior may vary slightly between Node (Vitest) and browsers. Pin the locale explicitly and test both contexts.
- **Preset values mix types** — `targetDTE` and `targetDelta` are strings in PRESETS (`"30"`, `"0.30"`) but numbers in getFilters(). The applyPreset function sets them as select element values (strings). TypeScript types should use strings for select-bound values, numbers for computation.

## Open Risks

- **oklch color conversion accuracy** — Converting #34d399 (emerald) and hsl(220,14%,5%) (near-black) to oklch for shadcn variables may produce slight visual differences. Verify with browser rendering in S03.
- **Vitest `toLocaleString` parity** — Node.js and browser `toLocaleString` with 'en-US' locale may produce different grouping separators for very large numbers. Test with values >999,999 to confirm.
- **shadcn/ui init with Vite + Tailwind v4** — The shadcn CLI has a Vite framework option. If it doesn't generate the right `@theme inline` structure or `@import` order, manual adjustment will be needed. The manual installation docs are available as fallback.

## Requirement Discrepancy

**R004 text says:** "wheelScore 6-factor" with weights "price 15%, volume 15%, IV rank 20%, premium yield 20%, spread 15%, earnings proximity 15%"

**Actual code (`computeWheelScore`):** 4-factor with user-configurable weights:
- Premium (default 30%) — premiumYield / 35 * 100
- Liquidity (default 20%) — avgVolume / 20 * 100
- Stability (default 25%) — beta sweet spot + 52w range position
- Fundamentals (default 25%) — PE tiers + dividend/ROE/analyst/margin bonuses

**Impact:** The TypeScript interfaces and tests must match the actual 4-factor scoring, not the 6-factor description. The roadmap's "weight sliders" (R015) already references 4 weights (matching code). No code change needed — just awareness that R004's text is inaccurate. Tests will codify the actual behavior.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| React 19 | `softaworks/agent-toolkit@react-dev` (3.3K installs) | available — general React dev patterns |
| Tailwind v4 + shadcn/ui | `jezweb/claude-skills@tailwind-v4-shadcn` (2.7K installs) | available — directly relevant to R002 |
| shadcn/ui | `shadcn/ui@shadcn` (15.9K installs) | available — official skill, high installs |
| Vitest | `onmax/nuxt-skills@vitest` (681 installs) | available — but Nuxt-focused, moderate relevance |
| Vitest | `bobmatnyc/claude-mpm-skills@vitest` (273 installs) | available — generic Vitest patterns |

**Recommended installs:**
- `npx skills add shadcn/ui@shadcn` — official, 15.9K installs, directly relevant
- `npx skills add jezweb/claude-skills@tailwind-v4-shadcn` — covers the Tailwind v4 + shadcn combo specifically

## Sources

- Vanilla business logic analyzed from `app.js` (1335 lines) — source of truth for scoring parity
- Vite path aliases: `resolve.tsconfigPaths: true` (source: vite.dev/config/shared-options)
- Vitest config: unified with vite.config.ts via `/// <reference types="vitest/config" />` (source: vitest.dev/guide)
- shadcn/ui v4 theming: `@theme inline` + oklch CSS variables + `@custom-variant dark` (source: github.com/shadcn/ui theming docs)
- shadcn/ui manual install: `@import "tailwindcss"; @import "tw-animate-css"; @import "shadcn/tailwind.css"` (source: shadcn/ui manual installation docs)
