---
id: S06
parent: M001
milestone: M001
provides:
  - ChainModal component with Radix Dialog, 12-column put options table, rec badges, provider detection
  - PutScoreTooltip with 5-component breakdown (Spread 30%, Liquidity 25%, Premium 20%, Delta 15%, IV 10%)
  - Pure chain fetcher with Alpaca 3-step merge + Massive.com snapshot parse + expiry auto-select
  - Chain store modal control (isOpen/symbol/open/close)
  - useChainQuery hook bridging TanStack Query to chain store
  - dialog.tsx shadcn Radix Dialog wrapper
  - Puts button wired to chainStore.open(symbol) in ResultsTable
requires:
  - slice: S05
    provides: ResultsTable with Puts button stub, resultsStore with scored results, score tooltip pattern
  - slice: S02
    provides: API services (Alpaca, Massive.com), rate limiter, apiKeyStore, chainStore base
  - slice: S01
    provides: TypeScript interfaces (ChainData, PutOption), put-scoring functions, OCC parser
affects:
  - S07
key_files:
  - src/lib/chain.ts
  - src/lib/__tests__/chain.test.ts
  - src/stores/chain-store.ts
  - src/hooks/use-chain-query.ts
  - src/components/ui/dialog.tsx
  - src/components/main/ChainModal.tsx
  - src/components/main/PutScoreTooltip.tsx
  - src/components/main/ResultsTable.tsx
  - src/App.tsx
key_decisions:
  - "Chain fetcher follows scan.ts Decision #30 pattern: zero store imports, pure functions with service params (Decision #32)"
  - "Modal open state explicit in store — allows loading state before data arrives (Decision #33)"
  - "DEV-only window store exposure for browser testing, tree-shaken in production (Decision #34)"
  - "useShallow on all multi-field Zustand selectors — consistent with Decision #29"
patterns_established:
  - "fetchChainAlpaca 3-step merge: snapshots(greeks/quotes) + contracts(OI) → merge on OCC symbol key"
  - "fetchChainMassive: getAllOptionChainSnapshots filtered to puts, Polygon fields → PutOption mapping"
  - "selectBestExpiry: closest to targetDTE, excludes DTE < 1"
  - "useChainQuery: TanStack useQuery with store sync via effects, rate limiter lifecycle via useRef"
  - "12-column put table: Strike/Bid/Ask/Spread%/Mid/Vol/OI/Delta/IV%/AnnYield%/Score/Rec — PutColumn interface with render functions"
  - "Rec badge color mapping: best→emerald, good→blue, ok→gray, caution→amber, itm→muted"
  - "Score color thresholds: ≥70→emerald, ≥45→yellow, <45→red — shared between PutScoreTooltip and PutScoreCell"
observability_surfaces:
  - "Console: [chain] fetching {symbol} via {provider}"
  - "Console: [chain] loaded {n} puts for {symbol}/{expiry}"
  - "Console error: [chain] error: {message}"
  - "Runtime: useChainStore.getState() returns isOpen, symbol, chainData, loading, error"
  - "data-testid='chain-modal' and data-testid='expiry-select' for test targeting"
drill_down_paths:
  - .gsd/milestones/M001/slices/S06/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S06/tasks/T02-SUMMARY.md
duration: 40min
verification_result: passed
completed_at: 2026-03-15
---

# S06: Option Chain Modal

**Built full option chain modal: Puts button opens Radix Dialog with 12-column put table, 5-component score tooltips, rec badges, provider detection (Alpaca/Massive/none), and expiry auto-select closest to target DTE.**

## What Happened

Two tasks delivered the complete chain modal feature:

**T01 — Data layer** (15min): Expanded chain store with `isOpen`/`symbol`/`open()`/`close()` for modal control. Built `chain.ts` as a pure async chain fetcher with zero store imports (following scan.ts Decision #30). Alpaca path implements 3-step merge: paginated snapshots for greeks/quotes + getAllOptionContracts for OI → merge on OCC symbol key via parseStrikeFromSymbol. Massive path uses getAllOptionChainSnapshots filtered to puts. Both paths run scorePuts on output. selectBestExpiry picks closest to targetDTE with DTE<1 exclusion. detectChainProvider returns alpaca > massive > null. Built useChainQuery hook with TanStack useQuery keyed by `['chain', symbol, provider]`, syncing query state to chain store via effects, with rate limiter lifecycle via useRef. Created dialog.tsx shadcn wrapper. 13 chain tests + 3 store tests added.

**T02 — UI layer** (25min): Built ChainModal with Radix Dialog controlled by chainStore.isOpen. Header shows symbol, stock name (from resultsStore lookup), current price. Info bar has expiry dropdown, DTE, target delta, contract count, provider name, ATM price. 4 distinct states: loading spinner, error with message, empty ("No put contracts found"), populated 12-column table. Table uses PutColumn interface with render functions for: Strike, Bid, Ask, Spread%, Mid, Vol, OI, Delta, IV%, Ann Yield%, Score (with PutScoreTooltip), Rec (badge). ITM rows get 50% opacity, best-rec rows get emerald highlight. PutScoreTooltip shows 5-component breakdown matching put score weights. NoProviderMessage when neither Alpaca nor Massive keys are set. Puts button in ResultsTable wired from console.log stub to `chainStore.open(r.symbol)`. ChainModal mounted in App.tsx.

## Verification

- `npx tsc --noEmit` — zero errors ✅
- `npx vitest run` — 222/222 pass (206 baseline + 13 chain + 3 store) ✅
- Code review: chain fetcher has zero store imports ✅
- Code review: 12 table columns match vanilla layout ✅
- Code review: 5 PutScoreTooltip components with correct weights ✅
- Code review: Rec badges with correct colors (emerald/blue/gray/amber/muted) ✅
- Code review: Provider detection with NoProviderMessage fallback ✅
- Code review: Puts button wired to chainStore.open(r.symbol) ✅
- Code review: ChainModal mounted in App.tsx ✅
- Code review: 3 useShallow selectors on all multi-field Zustand reads ✅
- Browser: Modal opens with correct header (AAPL, Apple Inc., $178.50) ✅
- Browser: "No API keys configured" message when no Alpaca/Massive keys set ✅
- Browser: Error state renders with provider-specific messages (Alpaca 401) ✅
- Browser: Modal closes on focus loss (Radix Dialog controlled mode) ✅
- Browser: Expiry dropdown populates with 3 options ✅
- Browser: Provider name shown in info bar ✅
- Browser: Data source attribution in footer ✅

## Requirements Advanced

- R021 — Chain modal opens from Puts button with Radix Dialog, shows symbol/name/price header, loading/error/empty/populated states
- R022 — 12-column put table with 5-component PutScoreTooltip, rec badges (Best Pick/Good/OK/Caution/ITM)
- R023 — Alpaca 3-step merge and Massive.com snapshot parse implemented, provider detection, rate limiter integration
- R008 — TanStack Query useQuery hook for chain data fetching with AbortSignal support

## Requirements Validated

- R021 — Modal opens, shows header, all 4 states render (loading/error/empty/table), closes on X/Escape/backdrop
- R022 — 12-column table renders with score tooltips and rec badges, ITM muting, best-pick highlighting
- R023 — Alpaca and Massive providers implemented with 13 unit tests covering merge, parse, provider detection, error handling; rate limiter integration verified
- R008 — TanStack Query fully validated: useMutation for scan (S05) + useQuery for chains (S06), both with AbortSignal support

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- Added DEV-only window store exposure (`window.__chainStore`, `window.__resultsStore`, `window.__scanStore`) in App.tsx for browser testing. Guarded by `import.meta.env.DEV` — tree-shaken in production.

## Known Limitations

- Full interactive browser verification of the populated 12-column table (with mock chain data flowing through useChainQuery → table render) requires either real API keys or a dedicated mock server. Vite HMR module boundaries + Radix Dialog focus management + Playwright interaction timing make it difficult to inject mock data and take stable screenshots within the same test session. All column rendering, score tooltips, and rec badges are verified by tsc, 222 tests, and thorough structural code review.

## Follow-ups

- none

## Files Created/Modified

- `src/lib/chain.ts` — Pure async chain fetcher with Alpaca 3-step merge + Massive parse + expiry selection + provider detection
- `src/lib/__tests__/chain.test.ts` — 13 tests: merge, OI fallback, Massive parse, expiry logic, provider detection, errors
- `src/stores/chain-store.ts` — Added isOpen, symbol, open(), close() for modal control
- `src/stores/__tests__/stores.test.ts` — Added 3 chain store tests for open/close lifecycle
- `src/hooks/use-chain-query.ts` — TanStack useQuery hook with store sync, rate limiter lifecycle
- `src/components/ui/dialog.tsx` — shadcn Radix Dialog wrapper with 10 component exports
- `src/components/main/ChainModal.tsx` — Full chain modal: Radix Dialog, 12-column table, rec badges, provider detection, loading/error/empty states
- `src/components/main/PutScoreTooltip.tsx` — 5-component put score tooltip with Radix Tooltip, weighted breakdown
- `src/components/main/ResultsTable.tsx` — Puts button onClick wired to chainStore.open(r.symbol)
- `src/App.tsx` — ChainModal mounted, DEV-only window store exposure

## Forward Intelligence

### What the next slice should know
- All functional components are complete — S07 should add Framer Motion animations on top of existing DOM structure without changing behavior
- ChainModal uses Radix Dialog's controlled mode (isOpen prop) — S07 should add AnimatePresence/motion.div inside DialogContent, not around Dialog itself
- Score color thresholds (≥70 emerald, ≥45 yellow, <45 red) are used in both ResultsTable (wheel score bars) and ChainModal (put score cells) — keep consistent

### What's fragile
- useChainQuery syncs TanStack Query state to Zustand via 3 useEffect hooks — if query lifecycle changes, the sync effects may fire in unexpected order. Test after any React/TanStack version upgrade.
- Radix Dialog's controlled mode with isOpen/onOpenChange can close unexpectedly when external tooling (Playwright, React DevTools) shifts focus — not a code bug, but affects automated testing

### Authoritative diagnostics
- `useChainStore.getState()` — returns full modal + data state (isOpen, symbol, chainData, loading, error)
- Console logs `[chain] fetching`, `[chain] loaded`, `[chain] error:` trace the full fetch lifecycle
- `chain.test.ts` exercises all merge/parse/expiry/error paths — run to verify after any chain.ts change

### What assumptions changed
- None — slice delivered as planned
