# S01: Critical data correctness fixes

**Goal:** Fix the three critical issues from PR review: market cap unit mismatch, empty catch in chain OI fetch, and plaintext API key storage.
**Demo:** Market cap filter correctly excludes stocks outside configured range. Chain OI failures are logged with context. API keys stored in sessionStorage (cleared on browser close).

## Must-Haves

- Finnhub `marketCapitalization` (in millions) normalized to raw dollars at ingestion time
- All downstream consumers (filter, CSV, tests) work correctly with raw-dollar market cap
- Chain OI empty catch replaced with abort/auth propagation + console.warn
- API key persist middleware switched from localStorage to sessionStorage
- UI warning that keys are stored in browser session only

## Proof Level

- This slice proves: contract + integration
- Real runtime required: yes (browser verify)
- Human/UAT required: no

## Verification

- `npx vitest run` — all tests pass (including updated market cap fixtures)
- `npx tsc --noEmit` — clean
- `npx eslint .` — clean
- `npx prettier --check .` — clean
- Browser: verify API keys survive page refresh but not new session (sessionStorage)

## Tasks

- [x] **T01: Fix market cap unit mismatch** `est:30m`
  - Why: Finnhub returns marketCapitalization in millions. Code stores raw and divides by 1e9, making the filter ~1000x too lenient.
  - Files: `src/lib/scan.ts`, `src/lib/filters.ts`, `src/lib/csv-export.ts`, `src/lib/__tests__/filters.test.ts`, `src/lib/__tests__/csv-export.test.ts`, `src/lib/__tests__/scoring.test.ts`
  - Do: Multiply by 1e6 at ingestion in `buildStockResult` (scan.ts:59) and the profile override (scan.ts:200-201). Filter and CSV already divide by 1e9 assuming raw dollars — that becomes correct. Update test fixtures to use raw-dollar values consistently.
  - Verify: `npx vitest run` — all market cap filter tests pass with corrected values
  - Done when: Market cap filter math is `rawDollars / 1e9` and ingestion converts Finnhub millions → raw dollars

- [x] **T02: Fix empty catch in chain OI fetch** `est:15m`
  - Why: Catch block at chain.ts:144 silently swallows all errors including abort signals and auth failures. User sees OI:0 with no indication of failure.
  - Files: `src/lib/chain.ts`
  - Do: Re-throw abort signals. Re-throw ApiError with 401/403 status. Log warning with symbol context for other errors.
  - Verify: `npx vitest run -- chain` — existing chain tests still pass
  - Done when: Abort and auth errors propagate, non-fatal errors log a warning with symbol name

- [x] **T03: Switch API keys to sessionStorage** `est:30m`
  - Why: API keys (including Alpaca secret that can authorize trades) stored in plaintext localStorage persist indefinitely. sessionStorage scopes keys to the browser session.
  - Files: `src/stores/api-key-store.ts`, `src/components/sidebar/ApiKeysSection.tsx`
  - Do: Change persist middleware storage to sessionStorage. Add a small info banner in ApiKeysSection noting keys are stored in browser session only and cleared when browser closes.
  - Verify: `npx vitest run` — store tests pass. Browser: enter key, refresh (key persists), close tab and reopen (key gone).
  - Done when: Zustand persist uses sessionStorage, info banner visible in sidebar

- [x] **T04: Final verification** `est:10m`
  - Why: Ensure all changes integrate cleanly
  - Files: none (verification only)
  - Do: Run full test suite, tsc, eslint, prettier. Verify no regressions.
  - Verify: `npx vitest run && npx tsc --noEmit && npx eslint . && npx prettier --check .`
  - Done when: All four commands exit 0

## Files Likely Touched

- `src/lib/scan.ts`
- `src/lib/chain.ts`
- `src/lib/filters.ts`
- `src/lib/csv-export.ts`
- `src/stores/api-key-store.ts`
- `src/components/sidebar/ApiKeysSection.tsx`
- `src/lib/__tests__/filters.test.ts`
- `src/lib/__tests__/csv-export.test.ts`
- `src/lib/__tests__/scoring.test.ts`
