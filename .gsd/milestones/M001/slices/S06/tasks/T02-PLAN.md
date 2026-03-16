---
estimated_steps: 5
estimated_files: 5
---

# T02: Chain modal UI, put scoring table, and Puts button wiring

**Slice:** S06 — Option Chain Modal
**Milestone:** M001

## Description

Build the visible chain modal and wire it end-to-end. ChainModal uses Radix Dialog controlled by chainStore.isOpen, containing a header (symbol/name/price), expiry dropdown, info bar, and a 12-column put options table with scored puts, 5-component tooltips, and rec badges. Provider detection reads apiKeyStore to choose Alpaca or Massive, or shows an inline "no provider" message. The Puts button in ResultsTable is rewired from its console.log stub to chainStore.open(symbol).

## Steps

1. **Build PutScoreTooltip** (`src/components/main/PutScoreTooltip.tsx`) — Clone ScoreTooltip pattern. 5-component breakdown: Spread (30%), Liquidity (25%), Premium (20%), Delta (15%), IV (10%). Uses Radix Tooltip with data-slot pattern. Score colors reuse `scoreColor()` thresholds (emerald ≥70, yellow ≥45, red <45). Shows weighted total as `putScore/100`.

2. **Build ChainModal** (`src/components/main/ChainModal.tsx`) — Radix Dialog controlled by `chainStore.isOpen`:
   - **Header**: symbol, stock name, current price (from resultsStore lookup), close button (DialogClose)
   - **Expiry dropdown**: populated from chainData.expirations, selected value = chainData.selectedExpiry, onChange triggers refetch via chainStore.setSelectedExpiry
   - **Info bar**: DTE, target delta (from filterStore), contract count, provider name, ATM price
   - **Provider detection**: check apiKeyStore — Alpaca keys present → 'alpaca', Massive key → 'massive', neither → render "No API keys configured" message with setup instructions instead of table
   - **States**: loading spinner, empty state ("No put contracts found"), error state with message, populated table
   - **Table**: 12 columns matching vanilla — Strike ($), Bid ($), Ask ($), Spread%, Mid ($), Vol, OI, Delta, IV%, Ann Yield%, Put Score (with PutScoreTooltip), Rec (badge). ITM rows get muted styling. Best rows get subtle highlight.
   - **Rec badges**: Best Pick (emerald bg), Good (blue), OK (default/gray), Caution (amber), ITM (muted)
   - **Footer**: data source attribution
   - Use `useShallow` for all multi-field Zustand selectors (Decision #29)
   - Overflow-y-auto on table container for large chains (50+ strikes)

3. **Wire Puts button** — In `ResultsTable.tsx`, replace console.log stub with `useChainStore.getState().open(r.symbol)`. Import chainStore.

4. **Mount ChainModal in App.tsx** — Add `<ChainModal />` after the main content area. It manages its own open/close via chainStore — no props needed.

5. **Browser verification** — Start dev server, verify: Puts button opens modal, modal shows header with symbol info, expiry dropdown present, loading state visible, close on X/Escape/backdrop works, no console errors. If API keys available, verify table populates with scored puts and tooltips work.

## Must-Haves

- [ ] ChainModal opens on Puts button click with correct symbol
- [ ] Modal shows symbol, name, price in header
- [ ] Expiry dropdown populates from chain data, auto-selects closest to target DTE
- [ ] 12-column put options table renders with correct formatting ($ prefix, % suffix, null → "—")
- [ ] PutScoreTooltip shows 5-component breakdown on score hover
- [ ] Rec badges render with correct colors (Best Pick emerald, Good blue, OK gray, Caution amber, ITM muted)
- [ ] ITM rows visually distinguished (muted opacity or background)
- [ ] Provider detection shows "no provider" message when no keys set
- [ ] Modal closes on X button, Escape key, and overlay click
- [ ] useShallow on all multi-field Zustand selectors
- [ ] tsc clean, no console errors

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all tests still pass (no regressions)
- Browser: Puts button opens modal
- Browser: Modal header shows symbol, name, price
- Browser: Close works via X button, Escape, and overlay click
- Browser: No console errors
- Browser: Table columns match vanilla 12-column layout
- Browser: Score tooltip shows 5-component breakdown on hover
- Browser: Rec badges visible with differentiated styling

## Inputs

- `src/lib/chain.ts` — chain fetcher (from T01)
- `src/stores/chain-store.ts` — expanded store with isOpen/symbol/open/close (from T01)
- `src/hooks/use-chain-query.ts` — useChainQuery hook (from T01)
- `src/components/ui/dialog.tsx` — Radix Dialog wrapper (from T01)
- `src/components/main/ScoreTooltip.tsx` — pattern reference for PutScoreTooltip
- `src/components/main/ResultsTable.tsx` — Puts button stub to replace
- `src/lib/formatters.ts` — formatNum for table cell formatting
- `src/stores/filter-store.ts` — targetDTE, targetDelta for info bar
- `src/stores/api-key-store.ts` — provider detection
- `src/stores/results-store.ts` — stock lookup for modal header

## Expected Output

- `src/components/main/ChainModal.tsx` — Full chain modal component with table, tooltips, badges
- `src/components/main/PutScoreTooltip.tsx` — 5-component put score tooltip
- `src/components/main/ResultsTable.tsx` — Puts button wired to chainStore.open()
- `src/App.tsx` — ChainModal mounted
