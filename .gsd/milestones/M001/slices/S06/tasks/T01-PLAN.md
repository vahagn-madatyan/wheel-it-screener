---
estimated_steps: 5
estimated_files: 5
---

# T01: Chain data fetcher, store expansion, and useQuery hook

**Slice:** S06 — Option Chain Modal
**Milestone:** M001

## Description

Build the data plumbing for option chain loading. This is the risky layer — Alpaca's 3-step merge (snapshots for greeks/quotes + contracts for OI → merge on OCC symbol key) and Massive.com's snapshot parse each have specific data shapes that must produce correct PutOption arrays. The chain store needs `isOpen`/`symbol` fields for modal control, and a TanStack `useQuery` hook bridges the pure fetcher to React.

Also creates the `dialog.tsx` shadcn wrapper (simple, follows tooltip.tsx pattern) needed by T02's modal.

## Steps

1. **Expand chain store** — Add `isOpen: boolean`, `symbol: string | null` to ChainStore interface. Add `open(symbol: string)` action (sets isOpen=true, symbol, clears chainData/error) and `close()` action (sets isOpen=false, clears chainData/error/symbol). Update existing store tests if they assert on shape.

2. **Build chain fetcher** (`src/lib/chain.ts`) — Pure async function with zero store imports, following `src/lib/scan.ts` pattern. Two provider paths:
   - **Alpaca path**: `fetchChainAlpaca(service, symbol, expiry, currentPrice, dte, signal)` — (a) getOptionSnapshots paginated for greeks/quotes, (b) getAllOptionContracts for OI, (c) merge on OCC symbol key using parseStrikeFromSymbol for strike. Map to PutOption[].
   - **Massive path**: `fetchChainMassive(service, symbol, expiry, currentPrice, dte, signal)` — getAllOptionChainSnapshots filtered to puts for the target expiry. Map Polygon snapshot fields to PutOption[].
   - **Expiry logic**: `selectBestExpiry(expirations: string[], targetDTE: number)` — pick closest to targetDTE, filter out DTE < 1.
   - **Top-level**: `fetchChain(params)` dispatches to correct provider path, calls scorePuts on result, returns ChainData.
   - All functions exported for testability. scorePuts import from `src/lib/put-scoring.ts`.

3. **Write chain fetcher tests** (`src/lib/__tests__/chain.test.ts`) — Mock fetch via vi.fn(). Test cases:
   - Alpaca merge: 2 snapshots + 1 OI contract → correct PutOption fields (strike, bid, ask, spread, delta, iv, volume, oi)
   - Alpaca missing OI: snapshot exists but no matching contract → oi=0
   - Massive parse: Polygon snapshot result → correct PutOption mapping
   - Expiry auto-select: [7d, 30d, 45d] with targetDTE=30 → selects 30d
   - Expiry filter: expirations with DTE < 1 excluded
   - Provider detection helper: Alpaca keys set → 'alpaca', Massive key only → 'massive', neither → null
   - Error propagation: fetch failure surfaces as Error

4. **Build useChainQuery hook** (`src/hooks/use-chain-query.ts`) — TanStack `useQuery` keyed by `['chain', symbol, expiry]`. Enabled when chainStore.isOpen && symbol !== null. Snapshots provider keys from apiKeyStore at query time. On success, calls chainStore.setChainData. On error, calls chainStore.setError. Manages AbortSignal via queryFn's signal parameter. Creates and disposes rate limiter for Massive path.

5. **Create dialog.tsx wrapper** (`src/components/ui/dialog.tsx`) — shadcn-style wrapper around Radix Dialog primitives (imported from `radix-ui` meta-package per Decision #23). Components: Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose. Follow data-slot + cn() pattern from tooltip.tsx.

## Must-Haves

- [ ] Chain store has isOpen, symbol, open(), close() — tests pass
- [ ] fetchChainAlpaca correctly merges snapshots + contracts on OCC symbol key
- [ ] fetchChainMassive correctly maps Polygon snapshots to PutOption[]
- [ ] selectBestExpiry picks closest to targetDTE, excludes DTE < 1
- [ ] scorePuts is called on fetcher output (reuse, not re-implement)
- [ ] useChainQuery compiles and uses TanStack useQuery with correct key
- [ ] dialog.tsx wrapper exists with Dialog, DialogContent, DialogOverlay, DialogTitle, DialogClose
- [ ] All new chain tests pass
- [ ] tsc clean

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run src/lib/__tests__/chain.test.ts` — all chain tests pass
- `npx vitest run` — all 206+ tests pass (no regressions)
- Code review: chain.ts has zero imports from src/stores/

## Observability Impact

- Signals added/changed: Console logs `[chain] fetching {symbol} via {provider}`, `[chain] loaded {n} puts for {symbol}/{expiry}`, `[chain] error: {message}` in chain fetcher
- How a future agent inspects this: `useChainStore.getState()` returns full chain state; chain.test.ts exercises all parse/merge paths
- Failure state exposed: chainStore.error populated with descriptive message; provider-specific errors preserved

## Inputs

- `src/stores/chain-store.ts` — existing store to expand
- `src/services/alpaca.ts` — AlpacaService with getOptionSnapshots, getAllOptionContracts, getOptionExpirations
- `src/services/massive.ts` — MassiveService with getAllOptionChainSnapshots
- `src/services/rate-limiter.ts` — TokenBucketRateLimiter
- `src/lib/put-scoring.ts` — scorePuts() for scoring fetched puts
- `src/lib/utils.ts` — parseStrikeFromSymbol() for OCC parsing
- `src/types/index.ts` — PutOption, ChainData interfaces
- `app.js:1108-1195` — vanilla fetchChainAlpaca for merge reference
- `src/components/ui/tooltip.tsx` — pattern reference for dialog.tsx

## Expected Output

- `src/lib/chain.ts` — Pure async chain fetcher with Alpaca + Massive provider paths
- `src/lib/__tests__/chain.test.ts` — 7+ test cases covering merge, parse, expiry, errors
- `src/stores/chain-store.ts` — Expanded with isOpen, symbol, open/close actions
- `src/hooks/use-chain-query.ts` — TanStack useQuery hook for chain fetching
- `src/components/ui/dialog.tsx` — shadcn Radix Dialog wrapper
