---
id: T01
parent: S05
milestone: M001
provides:
  - Pure async scan orchestrator with 5-phase pipeline
  - useScanRunner hook bridging scan function to Zustand stores via TanStack useMutation
  - ProgressBar component showing scan percentage and current ticker
  - Cancel button wired to AbortController during scan
key_files:
  - src/lib/scan.ts
  - src/hooks/use-scan-runner.ts
  - src/components/main/ProgressBar.tsx
  - src/components/sidebar/ActionButtons.tsx
  - src/App.tsx
key_decisions:
  - runScan() is fully decoupled from React/stores — all side effects via callbacks (onTick, onCandidateFound, onPhaseChange)
  - Auth errors (401/403) immediately thrown as user-facing "Invalid Finnhub API key" rather than being silently swallowed per-ticker
  - DOMException with name "AbortError" used for scan cancellation to match browser fetch abort convention
patterns_established:
  - Pure async orchestrator pattern — scan logic in src/lib/, React bridging in src/hooks/
  - Zustand getState() snapshots at mutation call time to avoid stale closures
  - TokenBucketRateLimiter created per scan, disposed in finally block
observability_surfaces:
  - useScanStore.getState() shows phase/progress/currentTicker/scannedCount/candidateCount/error
  - scanStore.error contains descriptive message on failure; "Invalid Finnhub API key" for 401/403
  - Console warnings for non-fatal per-ticker failures with [scan] prefix
duration: 20m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Build scan orchestrator and progress UI

**Built 5-phase Finnhub scan pipeline as pure async function, wired to stores via useScanRunner hook with progress bar and cancel support.**

## What Happened

Created `src/lib/scan.ts` with `runScan()` — a pure async function with zero store imports. Takes tickers, API key, filters, AbortSignal, and callbacks. Pipeline: (1) earnings calendar → build earningsMap with nearest date per symbol, (2) quote+metrics per ticker with early price filter, (3) profile enrichment for candidates, (4) analyst recommendations, (5) filterStocks() for final scoring. Rate limiter created internally, disposed in finally block. Auth errors (401/403) surface immediately as "Invalid Finnhub API key".

Created `src/hooks/use-scan-runner.ts` wrapping runScan in TanStack `useMutation`. Snapshots filter state and API key via `getState()` at call time. AbortController stored in ref, created fresh per run. AbortError detected by name → resetScan() (cancel, not failure). Exposes runScan/cancel/phase/progress/currentTicker/error.

Built `src/components/main/ProgressBar.tsx` reading useScanStore — shows phase, progress bar with percentage fill, current ticker, scanned/total count, candidate count. Renders error state inline. Hidden when idle or complete.

Updated `ActionButtons` — Run button calls `runScan()`, Cancel button appears during scan and calls `cancel()`. Reset to Defaults swaps out for Cancel during scan. Added ProgressBar to App.tsx main content area.

## Verification

- `npx tsc --noEmit` — zero errors ✓
- `npx vitest run` — 196 tests pass (10 suites) ✓
- Dev server renders without JS errors ✓
- Run button disabled without Finnhub key (disabled=true confirmed via DOM inspection) ✓
- Cancel button not rendered when phase is idle ✓
- Reset to Defaults visible when not scanning ✓
- Code review: runScan() has zero store imports ✓
- Code review: AbortController lifecycle correct (created per run, disposed on complete/error/cancel) ✓
- Code review: Rate limiter created per scan, disposed in finally block ✓
- Code review: Filter state and API key snapshotted at mutation call time via getState() ✓

### Slice-level verification (partial — T01 is first of 3 tasks):
- `npx tsc --noEmit` — ✓ passes
- `npx vitest run` — ✓ all 196 tests pass
- `csv-export.test.ts` — not yet created (T03)
- Browser full scan flow — not yet testable without results table (T02/T03)

## Diagnostics

- `useScanStore.getState()` in browser console → phase, progress, currentTicker, scannedCount, candidateCount, error
- Console warnings prefixed `[scan]` for non-fatal per-ticker API failures
- scanStore.error set on API failure with descriptive message; 401/403 → "Invalid Finnhub API key"

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/lib/scan.ts` — Pure async 5-phase scan orchestrator, decoupled from React
- `src/hooks/use-scan-runner.ts` — useMutation hook bridging scan function to stores
- `src/components/main/ProgressBar.tsx` — Progress bar component with percentage, ticker, counts
- `src/components/sidebar/ActionButtons.tsx` — Updated with scan trigger onClick and Cancel button
- `src/App.tsx` — Added ProgressBar to main content area
