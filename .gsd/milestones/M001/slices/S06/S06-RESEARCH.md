# S06: Option Chain Modal — Research

**Date:** 2026-03-15

## Summary

The chain modal builds on well-established patterns — put scoring is fully extracted and tested (17 parity tests), the chain store exists with correct shape, and the ScoreTooltip pattern is directly reusable for put score breakdowns. The primary complication is provider orchestration: the vanilla app uses Alpaca exclusively for chains (snapshots + contracts for OI), not Finnhub. Massive.com (Polygon) is a secondary provider with harsh 5 calls/min rate limiting.

The chain data flow is: user clicks "Puts" button → detect best available provider (Alpaca preferred, Massive fallback) → fetch expirations → auto-select closest to target DTE → fetch chain for selected expiry → parse into PutOption[] → score with `scorePuts()` → render in modal table. The vanilla app does all of this with two Alpaca endpoints (Data API for snapshots/greeks, Trading API for contracts/OI), paginating both.

Radix Dialog primitives are available via the `radix-ui` meta-package already installed. Need to create a `dialog.tsx` shadcn wrapper following the established `tooltip.tsx` pattern (data-slot, cn, Portal). The chainStore needs a minor expansion — adding `symbol` and `isOpen` fields to drive modal open/close state, or using Radix Dialog's controlled `open` prop driven by `chainData !== null`.

## Recommendation

**Approach**: Build a pure chain fetcher (`src/lib/chain.ts`) following the S05 scan orchestrator pattern — zero store imports, all side effects via return values. Create a `useChainQuery` hook using TanStack `useQuery` (not useMutation) with the chain fetcher, keyed by `[symbol, expiry, provider]`. Wire to Radix Dialog modal mounted from App.tsx.

**Provider priority**: Alpaca first (vanilla parity, has greeks, 200 req/min), Massive.com second (free tier, 5 calls/min but has greeks on snapshots), Finnhub not used for chains (no option chain endpoint exists in service layer, and Finnhub option pricing has known accuracy issues).

**Key design decisions needed during execution**:
1. Chain store shape — add `isOpen: boolean` + `symbol: string | null` to chainStore vs derive open state from `chainData !== null`. Recommend explicit `isOpen` so modal can show loading state before data arrives.
2. Expiration auto-select — match vanilla: pick closest to `targetDTE` from filterStore.
3. Provider detection — check apiKeyStore: Alpaca keys set → use Alpaca; else Massive key set → use Massive; else show "no provider" message.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Put option scoring | `src/lib/put-scoring.ts` scorePuts() | Already extracted, 17 parity tests, exact vanilla match |
| OCC strike parsing | `src/lib/utils.ts` parseStrikeFromSymbol() | Tested for all edge cases (fractional, zero, malformed) |
| Score color thresholds | `scoreColor()` in ScoreTooltip.tsx | Established pattern: emerald ≥70, yellow ≥45, red <45 |
| Alpaca chain fetch | `src/services/alpaca.ts` AlpacaService | getOptionSnapshots + getAllOptionContracts + getOptionExpirations all implemented |
| Polygon chain fetch | `src/services/massive.ts` MassiveService | getAllOptionChainSnapshots with pagination + rate limiter support |
| Rate limiter | `src/services/rate-limiter.ts` TokenBucketRateLimiter | Proven in scan flow, used for Massive 5 calls/min |
| Radix Dialog | `@radix-ui/react-dialog` via `radix-ui` package | Import as `import { Dialog } from "radix-ui"` |
| Number formatting | `src/lib/formatters.ts` formatNum() | Handles null/NaN → "—", exact vanilla parity |
| Tooltip component | `src/components/ui/tooltip.tsx` | shadcn wrapper with data-slot pattern |

## Existing Code and Patterns

- `src/stores/chain-store.ts` — ChainData store with loading/error/clearChain. Shape: `{ chainData: ChainData | null, loading, error }`. Needs expansion: add `isOpen`, `symbol`, and `open(symbol)`/`close()` actions.
- `src/components/main/ResultsTable.tsx:111` — Puts button is a `console.log` stub. Replace with `chainStore.open(symbol)`.
- `src/components/main/ScoreTooltip.tsx` — 4-component breakdown tooltip pattern. Clone and adapt for put score's 5-component breakdown (Spread 30%, Liquidity 25%, Premium 20%, Delta 15%, IV 10%).
- `src/components/ui/tooltip.tsx` — shadcn wrapper pattern with `data-slot`, `cn()`, Portal. Use same pattern for `dialog.tsx`.
- `src/hooks/use-scan-runner.ts` — TanStack useMutation bridging pattern. Chain uses useQuery instead (data fetching, not state mutation).
- `src/lib/scan.ts` — Pure async orchestrator pattern with zero store imports. Chain fetcher should follow same pattern.
- `app.js:963-1334` — Vanilla chain implementation: `openChainPanel()` → `fetchExpirations()` → `fetchChainForExpiry()` → `fetchChainAlpaca()` → `scorePuts()` → `renderChainTable()`. Three-step Alpaca flow: (1) contracts for expirations, (2) snapshots for greeks/quotes, (3) contracts again for OI. Merge on OCC symbol key.
- `app.js:1202-1262` — `scorePuts()` vanilla implementation — already extracted to `src/lib/put-scoring.ts` with full parity.

## Constraints

- **Alpaca uses two API bases** — Data API (`data.alpaca.markets`) for snapshots/greeks and Trading API (`paper-api.alpaca.markets`) for contracts/OI. Both are already implemented in AlpacaService.
- **Massive.com free tier is 5 calls/min** — chain fetch for one symbol+expiry could need 2-3 calls (snapshot pages). Must use TokenBucketRateLimiter(5, 5, 60000) and show clear "rate limited" feedback in UI.
- **OCC symbol parsing** — Alpaca snapshots use OCC symbols as keys (e.g. `AAPL260320P00150000`). Need `parseStrikeFromSymbol()` to extract strike, plus date substring for expiry validation.
- **Finnhub has no option chain endpoint** in service layer — FinnhubService only has quote, metrics, earnings, profile, recommendations. Do not add one.
- **useShallow required** for any Zustand selector returning derived objects (Decision #29) — applies to chain modal's store subscriptions.
- **Radix Dialog import path** — use `import { Dialog } from "radix-ui"` (meta-package), not scoped `@radix-ui/react-dialog`. Follows project convention from Decision #23.
- **Vanilla app shows provider-specific alert** when no Alpaca keys set — React version should show inline message in modal, not browser alert.
- **Vanilla chain table has 12 columns** — Strike, Bid, Ask, Spread%, Mid, Vol, OI, Delta, IV, Ann Yield, Put Score, Rec. Must match.

## Common Pitfalls

- **useShallow forgetting** — Any chainStore selector returning `{ symbol, loading, error }` needs useShallow or it causes infinite re-renders in StrictMode. Every multi-field selector.
- **Rate limiter leak** — If using TokenBucketRateLimiter for Massive, must dispose() when component unmounts or query is cancelled. Use AbortSignal + cleanup pattern from scan runner.
- **Alpaca dailyBar.v for volume** — Vanilla uses `dailyBar.v` from snapshots for volume, not a separate field. If dailyBar is missing, volume is 0.
- **ITM determination** — Vanilla: `itm = currentPrice > 0 && strike >= currentPrice`. Not strict greater — **includes ATM** (strike === currentPrice).
- **Rec badge "best" threshold** — Only top 2 OTM puts by score get "best", AND score must be ≥50. Not just top 2. Already handled in `scorePuts()`.
- **Expiration format** — Alpaca returns `expiration_date` as `YYYY-MM-DD` string. DTE computed as `ceil((expDate - now) / 86400000)`. Filter out DTE < 1.
- **Dialog body scroll lock** — Vanilla sets `document.body.style.overflow = "hidden"` when chain panel opens. Radix Dialog handles this automatically via `Dialog.Content`.

## Open Risks

- **Alpaca "indicative feed" data quality** — Alpaca's free tier provides indicative (not NBBO) quotes. Greeks are Black-Scholes estimated. This matches vanilla behavior but bid/ask spreads may be wider than real market. Not a code risk — just user expectation.
- **Massive.com rate limiting UX** — At 5 calls/min, if chain snapshot paginates to 3+ pages, user waits 30+ seconds. Need loading state with "rate limited — please wait" message. Vanilla only supports Alpaca so this is new territory.
- **Large option chains** — High-volume stocks (SPY, AAPL) can have 50+ strikes per expiry. Table needs to handle this without layout breaking. Virtual scrolling not needed at this scale but overflow-y-auto is critical.
- **Provider key availability at chain open time** — User might have entered keys during the session but not tested them. Provider detection should check key presence only (not validity), same as vanilla's `getAlpacaKeys().valid`.

## Requirements Targeted

| Req | Description | Risk | Notes |
|-----|-------------|------|-------|
| R021 | Option chain modal (Radix Dialog + backdrop blur) | Low | Radix Dialog + shadcn wrapper pattern well-established |
| R022 | Put scoring table with tooltips + rec badges | Low | scorePuts() already extracted; ScoreTooltip pattern reusable |
| R023 | Massive.com options provider | Medium | Service exists, rate limiting proven, but chain-specific integration untested |
| R008 | TanStack Query useQuery for chains | Low | QueryClient wired in S02, useQuery is straightforward |
| R007 | API services (supporting) | Low | AlpacaService + MassiveService fully implemented |

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| TanStack Query v5 | tanstack-skills/tanstack-skills@tanstack-query | installed |
| Radix UI Primitives | yonatangross/orchestkit@radix-primitives | available (42 installs) — skipped, Context7 docs sufficient |
| shadcn/ui | claude-dev-suite/claude-dev-suite@shadcn-ui | available (11 installs) — skipped, pattern already established in codebase |

## Sources

- Vanilla chain implementation in `app.js` lines 963–1334 — complete Alpaca-based chain flow (source: codebase)
- Chain store shape and tests in `src/stores/chain-store.ts` + `stores.test.ts` lines 371–430 (source: codebase)
- Radix Dialog API: Root, Portal, Overlay, Content, Title, Description, Close components with controlled `open` prop (source: Context7 `/websites/radix-ui_primitives`)
- Put scoring weights: Spread 30%, Liquidity 25%, Premium 20%, Delta 15%, IV 10% — confirmed matching between vanilla and extracted `scorePuts()` (source: `app.js:1202`, `src/lib/put-scoring.ts`)
- IMPLEMENTATION_SPEC.md — Massive.com snapshot endpoint, 5 calls/min free tier, OCC symbol format (source: codebase)
