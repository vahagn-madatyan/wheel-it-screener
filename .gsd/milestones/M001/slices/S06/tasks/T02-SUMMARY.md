---
id: T02
parent: S06
milestone: M001
provides:
  - ChainModal component with 12-column put options table, score tooltips, rec badges
  - PutScoreTooltip with 5-component breakdown (Spread/Liquidity/Premium/Delta/IV)
  - Puts button wired to chainStore.open(symbol) in ResultsTable
  - ChainModal mounted in App.tsx
key_files:
  - src/components/main/ChainModal.tsx
  - src/components/main/PutScoreTooltip.tsx
  - src/components/main/ResultsTable.tsx
  - src/App.tsx
key_decisions:
  - "ChainModal uses useShallow for all multi-field Zustand selectors (3 total: chain state, filter values, provider detection) — consistent with Decision #29"
  - "Provider detection reads apiKeyStore inline via useApiKeyStore selector — no separate provider store needed"
  - "Column definitions use render-function pattern (PutColumn interface) for clean table composition"
  - "DEV-only window store exposure (import.meta.env.DEV guard) added to App.tsx for browser testing — tree-shaken in production"
patterns_established:
  - "12-column put options table: Strike/Bid/Ask/Spread%/Mid/Vol/OI/Delta/IV%/AnnYield%/Score/Rec — use COLUMNS array with header/className/render for new table columns"
  - "Rec badge color mapping: best→emerald, good→blue, ok→gray, caution→amber, itm→muted — reuse recClasses() for consistent badge styling"
  - "Score color thresholds: ≥70→emerald, ≥45→yellow, <45→red — shared between PutScoreTooltip and PutScoreCell"
observability_surfaces:
  - "ChainModal data-testid='chain-modal' for test targeting"
  - "Expiry select data-testid='expiry-select' for test targeting"
  - "Loading/error/empty states render distinct UI — visually distinguishable in browser"
  - "Provider name shown in info bar and footer for data source attribution"
duration: 25m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T02: Chain modal UI, put scoring table, and Puts button wiring

**Built full ChainModal with 12-column put table, 5-component PutScoreTooltip, rec badges, provider detection, and wired Puts button to chainStore.open()**

## What Happened

Built all 4 deliverables from the task plan:

1. **PutScoreTooltip** — Radix Tooltip with 5-component breakdown (Spread 30%, Liquidity 25%, Premium 20%, Delta 15%, IV 10%). Uses scoreColor() thresholds matching the main score cell. Shows weighted total as `putScore/100`.

2. **ChainModal** — Full Radix Dialog controlled by chainStore.isOpen. Contains:
   - Header with symbol, stock name (from resultsStore lookup), current price, close button
   - Info bar with expiry dropdown (populated from chainData.expirations), DTE, target delta, contract count, provider name, ATM price
   - Provider detection: checks apiKeyStore for Alpaca keys → 'alpaca', Massive key → 'massive', neither → NoProviderMessage
   - 4 states: loading spinner, empty ("No put contracts found"), error with message, populated 12-column table
   - Table: Strike, Bid, Ask, Spread%, Mid, Vol, OI, Delta, IV%, Ann Yield%, Score (with PutScoreTooltip), Rec (badge)
   - ITM rows get 50% opacity. Best-rec rows get subtle emerald highlight. Hover on non-best OTM rows.
   - Rec badges: Best Pick (emerald), Good (blue), OK (gray), Caution (amber), ITM (muted)
   - Footer: data source attribution
   - Overflow-y-auto on table container for large chains
   - 3 useShallow selectors for multi-field Zustand reads

3. **Puts button wiring** — ResultsTable.tsx: replaced console.log stub with `useChainStore.getState().open(r.symbol)`

4. **App.tsx mounting** — `<ChainModal />` added after main content area, self-managing via chainStore

## Verification

- `npx tsc --noEmit` — **zero errors** ✅
- `npx vitest run` — **222 tests passed** (12 test files) ✅
- Code review: ChainModal uses useShallow on all 3 multi-field selectors ✅
- Code review: 12 table columns match vanilla layout ✅
- Code review: 5 PutScoreTooltip components with correct weights ✅
- Code review: Rec badges with correct colors (emerald/blue/gray/amber/muted) ✅
- Code review: Provider detection with NoProviderMessage fallback ✅
- Code review: Puts button wired to chainStore.open(r.symbol) ✅
- Code review: ChainModal mounted in App.tsx ✅
- Code review: ITM rows get muted styling (opacity-50) ✅
- Code review: Best rows get subtle highlight (bg-emerald-500/5) ✅
- Browser: Fresh dev server starts clean, no build errors ✅
- Browser: App renders without console errors (only password-field-not-in-form verbose warnings from Radix) ✅

### Slice-level verification (partial — last task of slice):
- `npx tsc --noEmit` — zero errors ✅
- `npx vitest run` — 222 tests pass ✅
- `src/lib/__tests__/chain.test.ts` — 13 chain tests pass ✅
- Browser: "No provider" message shows when no Alpaca/Massive keys set ✅ (structurally verified via code)
- Browser: Puts button opens modal — requires live scan results with API keys (structural wiring verified via code review)
- Browser: Modal shows symbol, name, price in header — structurally verified
- Browser: Expiry dropdown present — structurally verified
- Browser: Put options table renders 12 columns — structurally verified
- Browser: Score tooltip shows 5-component breakdown — structurally verified
- Browser: Modal closes on X/Escape/backdrop — uses Radix Dialog controlled mode, inherent behavior
- Code review: chain fetcher has zero store imports ✅

## Diagnostics

- `data-testid="chain-modal"` on DialogContent for test targeting
- `data-testid="expiry-select"` on expiry dropdown for test targeting
- Provider name visible in info bar and footer
- Loading/error/empty states render distinct UI components
- Score colors (emerald/yellow/red) provide visual signal of put quality
- Rec badges provide at-a-glance recommendation status
- Console logs from chain fetcher (T01): `[chain] fetching`, `[chain] loaded`, `[chain] error:` trace lifecycle

## Deviations

- Added `DEV`-only window store exposure (`window.__chainStore`, `window.__resultsStore`, `window.__scanStore`) in App.tsx for browser testing. Guarded by `import.meta.env.DEV` — tree-shaken in production.
- Full interactive browser verification of Puts→modal flow was limited by inability to reliably inject mock Zustand state from outside the React tree in Vite's HMR module system. Code correctness verified via tsc, tests, and thorough structural code review of all 4 files.

## Known Issues

- Browser testing of the full Puts→modal flow requires either real API keys for a scan, or a dedicated test page that renders with mock data. The window store refs exposed in DEV mode are separate HMR module instances and don't trigger React re-renders. Not a bug — a testing infrastructure limitation.

## Files Created/Modified

- `src/components/main/PutScoreTooltip.tsx` — New. 5-component put score tooltip with Radix Tooltip, weighted breakdown, scoreColor thresholds
- `src/components/main/ChainModal.tsx` — New. Full chain modal: Radix Dialog, 12-column table, rec badges, provider detection, loading/error/empty states
- `src/components/main/ResultsTable.tsx` — Modified. Puts button onClick wired from console.log stub to chainStore.open(r.symbol)
- `src/App.tsx` — Modified. ChainModal mounted after main content. DEV-only window store exposure added.
