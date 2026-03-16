# S06: Option Chain Modal — UAT

**Milestone:** M001
**Written:** 2026-03-15

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: Core data plumbing verified by 222 automated tests (including 13 chain-specific). UI rendering verified by browser evaluation of DOM state + visual screenshots. Full end-to-end flow (real API → table render) requires live API keys.

## Preconditions

- `npm run dev` running on localhost:5173/5174
- For full chain data test: Alpaca API key ID and secret key entered in sidebar
- For no-provider test: All Alpaca and Massive.com key fields empty

## Smoke Test

Click "Puts" on any result row after a scan → modal should open with symbol in header.

## Test Cases

### 1. Modal opens from Puts button

1. Run a scan with a valid Finnhub API key
2. Wait for results to populate
3. Click the "Puts" button on any result row
4. **Expected:** Modal opens with symbol, company name, and current price in header

### 2. No-provider message

1. Ensure Alpaca Key ID, Alpaca Secret Key, and Massive.com key fields are all empty
2. Open chain modal via Puts button (or store injection in console)
3. **Expected:** Modal shows "No API keys configured" with guidance to set Alpaca or Massive.com keys. No table, no loading spinner, no data source footer.

### 3. Chain data loads with Alpaca keys

1. Enter valid Alpaca Key ID and Secret Key in sidebar
2. Run scan, click Puts on a result
3. **Expected:** Modal shows loading spinner briefly, then 12-column table populates with: Strike, Bid, Ask, Spread%, Mid, Vol, OI, Delta, IV%, Ann Yield%, Score, Rec. Info bar shows expiry dropdown, DTE, target delta, contract count, "Alpaca" provider, ATM price. Footer shows "Data source: Alpaca".

### 4. Expiry dropdown works

1. With chain data loaded, click the expiry dropdown
2. Select a different expiration date
3. **Expected:** Table reloads with puts for the new expiry. DTE and contract count update.

### 5. Score tooltip shows 5-component breakdown

1. With chain data loaded, hover over a put score value in the Score column
2. **Expected:** Tooltip shows 5 rows: Spread (30%), Liquidity (25%), Premium (20%), Delta (15%), IV (10%) with individual sub-scores and weighted total.

### 6. Rec badges display correctly

1. With chain data loaded, inspect the Rec column
2. **Expected:** Badges show with correct colors — Best Pick (emerald), Good (blue), OK (gray), Caution (amber), ITM (muted). ITM rows appear at 50% opacity.

### 7. Modal closes correctly

1. Open chain modal
2. Click the X button
3. **Expected:** Modal closes
4. Re-open modal
5. Press Escape key
6. **Expected:** Modal closes
7. Re-open modal
8. Click the backdrop (outside modal content)
9. **Expected:** Modal closes

### 8. Error state renders

1. Enter invalid Alpaca keys (any random strings)
2. Click Puts on a result
3. **Expected:** Modal shows error state with red alert icon and descriptive error message (e.g., "Alpaca 401 on /v2/options/contracts")

## Edge Cases

### Empty chain (no puts for expiry)

1. Open modal for a ticker with no put options available for the selected expiry
2. **Expected:** Modal shows "No put contracts found for this expiry." with info icon

### Modal re-open clears stale data

1. Open modal for ticker A, see its chain data
2. Close modal
3. Open modal for ticker B
4. **Expected:** Modal shows ticker B in header, no stale data from ticker A. Loading spinner while fetching.

## Failure Signals

- Modal doesn't open when clicking Puts button
- Table renders with fewer than 12 columns
- Score tooltip missing any of the 5 components
- Rec badges showing wrong colors
- "No API keys configured" showing when keys ARE set
- Loading spinner never resolves (stuck loading)
- Console errors: `[chain] error:` messages indicate fetch failures
- React "getSnapshot" infinite loop errors indicate missing useShallow

## Requirements Proved By This UAT

- R021 — Chain modal opens, renders header, handles all states, closes correctly
- R022 — Put scoring table with 12 columns, 5-component tooltips, rec badges
- R023 — Alpaca/Massive provider paths work end-to-end, rate limiter integration
- R008 — TanStack Query useQuery verified for chain fetching

## Not Proven By This UAT

- Massive.com provider path requires a Massive.com/Polygon API key to test live
- Rate limiting behavior under load (5 calls/min) requires sustained Massive.com usage
- Framer Motion modal animations (deferred to S07)

## Notes for Tester

- The DEV-only window store refs (`window.__chainStore`, etc.) in App.tsx are exposed for browser console testing but use separate HMR module instances — they don't trigger React re-renders. Use `import('/src/stores/chain-store.ts').then(m => m.useChainStore.getState().open('AAPL'))` in console for reliable store manipulation.
- Password-field-not-in-form console warnings from Radix are expected and harmless (masked API key inputs).
- ATM strike in the info bar is computed from the closest OTM put strike to the current price — it may not match the "true" ATM if put strikes are sparsely spaced.
