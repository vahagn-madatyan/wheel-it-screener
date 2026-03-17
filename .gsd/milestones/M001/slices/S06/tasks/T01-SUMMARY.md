---
id: T01
parent: S06
milestone: M001
provides:
  - Pure chain fetcher with Alpaca + Massive provider paths
  - Chain store modal control (isOpen/symbol/open/close)
  - useChainQuery hook bridging fetcher to React
  - dialog.tsx shadcn wrapper component
key_files:
  - src/lib/chain.ts
  - src/lib/__tests__/chain.test.ts
  - src/stores/chain-store.ts
  - src/hooks/use-chain-query.ts
  - src/components/ui/dialog.tsx
key_decisions:
  - "Chain fetcher follows scan.ts Decision #30 pattern: zero store imports, pure functions with service params"
  - "Modal open state explicit in store (Decision #33) — allows loading state before data arrives"
patterns_established:
  - "fetchChainAlpaca 3-step merge: snapshots(greeks/quotes) + contracts(OI) → merge on OCC symbol key"
  - "fetchChainMassive: getAllOptionChainSnapshots filtered to puts, Polygon fields → PutOption mapping"
  - "selectBestExpiry: closest to targetDTE, excludes DTE < 1"
  - "useChainQuery: TanStack useQuery with store sync via effects, rate limiter lifecycle via useRef"
observability_surfaces:
  - "Console: [chain] fetching {symbol} via {provider}"
  - "Console: [chain] loaded {n} puts for {symbol}/{expiry}"
  - "Console error: [chain] error: {message}"
  - "Runtime: useChainStore.getState() returns isOpen, symbol, chainData, loading, error"
duration: 15min
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Chain data fetcher, store expansion, and useQuery hook

**Built the complete data plumbing for option chain loading: pure Alpaca/Massive fetchers with OCC-key merge, chain store modal control, TanStack useChainQuery hook, and shadcn dialog wrapper.**

## What Happened

1. Expanded chain store with `isOpen`, `symbol`, `open(symbol)`, `close()` — open clears stale data, close resets everything. Added 3 new store tests.

2. Built `chain.ts` following the `scan.ts` zero-store-imports pattern. Alpaca path replicates vanilla app.js merge: paginated snapshots for greeks/quotes + getAllOptionContracts for OI → merge on OCC symbol key via parseStrikeFromSymbol. Massive path uses getAllOptionChainSnapshots filtered to puts. Both paths call scorePuts on output. selectBestExpiry picks closest to targetDTE with DTE < 1 exclusion. detectChainProvider returns alpaca (preferred) > massive > null.

3. Wrote 13 chain tests covering: Alpaca merge (2 snapshots + 1 OI contract), missing OI graceful fallback, OI fetch failure tolerance, Massive parse, expiry auto-select, expiry filter, provider detection (5 cases), error propagation.

4. Built useChainQuery hook: TanStack useQuery keyed by `['chain', symbol, provider]`, enabled when isOpen && symbol set && provider available. Syncs loading/data/error to chain store via effects. Rate limiter for Massive created once via useRef, disposed on unmount.

5. Created dialog.tsx wrapper following tooltip.tsx data-slot + cn() pattern with scoped @radix-ui/react-dialog imports. Exports: Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose.

## Verification

- `npx tsc --noEmit` — zero errors ✓
- `npx vitest run src/lib/__tests__/chain.test.ts` — 13/13 pass ✓
- `npx vitest run src/stores/__tests__/stores.test.ts` — 36/36 pass ✓
- `npx vitest run` — 222/222 pass (no regressions from 206 baseline) ✓
- Code review: `grep "stores/" src/lib/chain.ts` — zero store imports ✓

### Slice-level verification (partial — T01 is intermediate)

- [x] `npx tsc --noEmit` — zero errors
- [x] `npx vitest run` — all 222 tests pass
- [x] `src/lib/__tests__/chain.test.ts` — Alpaca merge, Massive parse, provider detection, expiry auto-select, error handling
- [ ] Browser: Puts button opens modal dialog with backdrop (T02)
- [ ] Browser: Modal shows symbol, name, price in header (T02)
- [ ] Browser: Expiry dropdown populates (T02)
- [ ] Browser: Put options table renders 12 columns (T03)
- [ ] Browser: Hovering put score shows 5-component tooltip (T03)
- [ ] Browser: Modal closes on X/Escape/backdrop click (T02)
- [ ] Browser: "No provider" message shows when no keys set (T02)
- [x] Code review: chain fetcher has zero store imports

## Diagnostics

- `useChainStore.getState()` — returns `{ isOpen, symbol, chainData, loading, error }` for full modal + data state
- Console logs: `[chain] fetching`, `[chain] loaded`, `[chain] error:` trace fetch lifecycle
- chain.test.ts exercises all merge/parse/expiry/error paths — run to verify after any chain.ts change
- Provider-specific errors preserved (ApiError with status code for 401/429 handling)

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/lib/chain.ts` — Pure async chain fetcher with Alpaca 3-step merge + Massive parse + expiry selection + provider detection
- `src/lib/__tests__/chain.test.ts` — 13 test cases: merge, OI fallback, Massive parse, expiry logic, provider detection, errors
- `src/stores/chain-store.ts` — Added isOpen, symbol, open(), close() for modal control
- `src/stores/__tests__/stores.test.ts` — Added 3 chain store tests for open/close lifecycle
- `src/hooks/use-chain-query.ts` — TanStack useQuery hook with store sync, rate limiter lifecycle
- `src/components/ui/dialog.tsx` — shadcn Radix Dialog wrapper with 10 component exports
