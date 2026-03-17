# S06: Option Chain Modal

**Goal:** Clicking "Puts" on a result row opens a chain modal that loads option chain data from Alpaca (primary) or Massive.com (secondary), displays a 12-column put options table with scored puts, 5-component put score tooltips, and recommendation badges.
**Demo:** Click Puts on any result row → modal opens → expiry auto-selects closest to target DTE → put options table populates with strike/bid/ask/spread/vol/OI/delta/IV/yield/score/rec → hovering score shows 5-component breakdown → "Best Pick" badges visible on top OTM puts.

## Must-Haves

- Chain fetcher as pure async function (zero store imports) handling both Alpaca 3-step merge and Massive.com snapshot parse
- Chain store expanded with `isOpen`, `symbol`, `open(symbol)`, `close()` actions
- TanStack `useQuery` hook for chain data fetching with AbortSignal support
- Radix Dialog modal with controlled open/close state
- 12-column put options table matching vanilla columns: Strike, Bid, Ask, Spread%, Mid, Vol, OI, Delta, IV, Ann Yield, Put Score, Rec
- 5-component PutScoreTooltip (Spread 30%, Liquidity 25%, Premium 20%, Delta 15%, IV 10%)
- Recommendation badges: Best Pick, Good, OK, Caution, ITM
- Expiry dropdown with auto-select closest to target DTE from filterStore
- Provider detection: Alpaca keys → Alpaca; Massive key → Massive; neither → inline "no provider" message
- Rate limiter integration for Massive.com path (5 calls/min)
- Vitest tests for chain fetcher merge logic (Alpaca) and snapshot parsing (Massive)

## Proof Level

- This slice proves: integration (chain data flow end-to-end from API to scored UI)
- Real runtime required: yes (browser verification of modal + table rendering)
- Human/UAT required: no (real API call optional — modal renders with loading/empty/error states verifiable without keys)

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all tests pass (existing 206 + new chain fetcher tests)
- `src/lib/__tests__/chain.test.ts` — Alpaca merge logic, Massive parse logic, provider detection, expiry auto-select, error handling
- Browser: Puts button opens modal dialog with backdrop
- Browser: Modal shows symbol, name, price in header
- Browser: Expiry dropdown populates (or shows loading/error state)
- Browser: Put options table renders 12 columns with score colors and rec badges
- Browser: Hovering put score shows 5-component tooltip breakdown
- Browser: Modal closes on X button, Escape key, or backdrop click
- Browser: "No provider" message shows when no Alpaca/Massive keys set
- Code review: chain fetcher has zero store imports

## Observability / Diagnostics

- Runtime signals: Console log `[chain] fetching {symbol} via {provider}` on fetch start; `[chain] loaded {n} puts for {symbol}/{expiry}` on success; `[chain] error: {message}` on failure
- Inspection surfaces: `useChainStore.getState()` — isOpen, symbol, chainData, loading, error; TanStack Query devtools shows chain query status
- Failure visibility: chainStore.error populated with descriptive message; provider-specific error messages (401 → "Invalid API key", 429 → "Rate limited")
- Redaction constraints: API keys never logged; only provider name in console output

## Integration Closure

- Upstream surfaces consumed: `src/stores/api-key-store.ts` (key presence for provider detection), `src/stores/filter-store.ts` (targetDTE, targetDelta), `src/stores/results-store.ts` (stock data for modal header), `src/services/alpaca.ts` (AlpacaService), `src/services/massive.ts` (MassiveService), `src/services/rate-limiter.ts` (TokenBucketRateLimiter), `src/lib/put-scoring.ts` (scorePuts), `src/lib/utils.ts` (parseStrikeFromSymbol), `src/lib/formatters.ts` (formatNum), `src/components/main/ResultsTable.tsx` (Puts button stub)
- New wiring introduced in this slice: ChainModal mounted in App.tsx, Puts button onClick wired to chainStore.open(), useChainQuery hook consuming chain fetcher
- What remains before the milestone is truly usable end-to-end: S07 animation polish (Framer Motion modal transition), S08 lazy-loading ChainModal + cleanup

## Tasks

- [x] **T01: Chain data fetcher, store expansion, and useQuery hook** `est:45m`
  - Why: The data layer carries the risk — Alpaca's 3-step merge (snapshots + contracts → PutOption[]) and Massive's snapshot parse are where bugs hide. This task builds and tests all data plumbing before any UI.
  - Files: `src/lib/chain.ts`, `src/lib/__tests__/chain.test.ts`, `src/stores/chain-store.ts`, `src/hooks/use-chain-query.ts`, `src/components/ui/dialog.tsx`
  - Do: (1) Expand chainStore with `isOpen: boolean`, `symbol: string | null`, `open(symbol)` and `close()` actions. (2) Build `fetchChain()` pure async function in `src/lib/chain.ts` — Alpaca path: getOptionExpirations → getOptionSnapshots (paginated) + getAllOptionContracts (OI) → merge on OCC symbol key → build PutOption[]. Massive path: getAllOptionChainSnapshots → extract expirations + puts. Both paths: auto-select expiry closest to targetDTE, return ChainData. (3) Build `useChainQuery` hook with TanStack useQuery keyed by `['chain', symbol, expiry, provider]`, enabled when `isOpen && symbol !== null`. (4) Create `dialog.tsx` shadcn wrapper following tooltip.tsx pattern. (5) Write Vitest tests mocking fetch responses for Alpaca merge and Massive parse.
  - Verify: `npx tsc --noEmit` clean, `npx vitest run` all pass including new chain tests
  - Done when: Chain fetcher produces correct PutOption[] from mocked Alpaca/Massive responses, store expansion works, useChainQuery compiles, dialog wrapper exists

- [x] **T02: Chain modal UI, put scoring table, and Puts button wiring** `est:45m`
  - Why: The UI layer — modal shell, 12-column table, 5-component tooltips, rec badges, expiry dropdown, provider detection, and wiring everything to the Puts button. Turns the data layer into a visible, interactive feature.
  - Files: `src/components/main/ChainModal.tsx`, `src/components/main/PutScoreTooltip.tsx`, `src/components/main/ResultsTable.tsx`, `src/App.tsx`
  - Do: (1) Build ChainModal with Radix Dialog (controlled by chainStore.isOpen): header with symbol/name/price, expiry dropdown, provider info bar, loading/empty/error states, 12-column put options table. (2) Build PutScoreTooltip cloning ScoreTooltip pattern — 5-component breakdown (Spread 30%, Liquidity 25%, Premium 20%, Delta 15%, IV 10%). (3) Implement rec badges (Best Pick emerald, Good blue, OK gray, Caution amber, ITM muted). (4) Wire provider detection from apiKeyStore. (5) Replace Puts button console.log stub with `chainStore.open(symbol)`. (6) Mount ChainModal in App.tsx.
  - Verify: `npx tsc --noEmit` clean, browser shows modal on Puts click, 12 columns visible, score tooltip on hover, rec badges rendered, close on X/Escape/backdrop
  - Done when: Full chain modal flow works in browser — open → load → display scored puts → tooltips → close. No console errors.

## Files Likely Touched

- `src/lib/chain.ts` — Pure async chain fetcher (new)
- `src/lib/__tests__/chain.test.ts` — Chain fetcher tests (new)
- `src/stores/chain-store.ts` — Expand with isOpen, symbol, open/close actions
- `src/hooks/use-chain-query.ts` — TanStack useQuery wrapper (new)
- `src/components/ui/dialog.tsx` — shadcn Radix Dialog wrapper (new)
- `src/components/main/ChainModal.tsx` — Modal component (new)
- `src/components/main/PutScoreTooltip.tsx` — 5-component put score tooltip (new)
- `src/components/main/ResultsTable.tsx` — Wire Puts button to chainStore.open()
- `src/App.tsx` — Mount ChainModal
