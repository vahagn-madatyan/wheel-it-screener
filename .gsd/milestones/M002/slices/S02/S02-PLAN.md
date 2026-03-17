# S02: Error visibility & user feedback

**Goal:** Surface failed ticker counts, partial data warnings, and scan phase labels to the user.
**Demo:** During a scan, phase labels (e.g., "Loading earnings calendar…") display in progress bar. After scan, failed ticker count shown if any failed. Earnings fetch failure surfaces a warning.

## Must-Haves

- `ScanResult` includes `failedTickers: string[]`
- Failed ticker count visible in results area when > 0
- Scan phase label visible in ProgressBar during each phase
- Earnings fetch failure produces a visible warning (not just console)

## Proof Level

- This slice proves: contract + integration
- Real runtime required: yes (browser verify)
- Human/UAT required: no

## Verification

- `npx vitest run` — all tests pass
- `npx tsc --noEmit` — clean
- `npx eslint .` — clean

## Tasks

- [ ] **T01: Add failedTickers to ScanResult and track in scan pipeline** `est:20m`
- [ ] **T02: Wire phase labels and failed ticker count to UI** `est:25m`
- [ ] **T03: Surface earnings fetch warning** `est:10m`
- [ ] **T04: Verification** `est:5m`

## Files Likely Touched

- `src/lib/scan.ts`
- `src/stores/scan-store.ts`
- `src/hooks/use-scan-runner.ts`
- `src/components/main/ProgressBar.tsx`
- `src/components/main/ResultsTable.tsx`
