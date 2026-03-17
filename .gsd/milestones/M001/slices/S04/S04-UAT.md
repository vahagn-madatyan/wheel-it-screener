# S04: Sidebar Controls — UAT

**Milestone:** M001
**Written:** 2026-03-12

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: All controls are store-bound with unit-tested logic. Browser verification confirms rendering and visual correctness. No external API calls or data dependencies in this slice.

## Preconditions

- `npm run dev` running at localhost:5173
- No API keys set (clean state)

## Smoke Test

Open http://localhost:5173 → sidebar shows 4 collapsible sections (API Keys, Stock Filters, Wheel Criteria, Scoring Weights) with Run Screener and Reset to Defaults buttons at the bottom.

## Test Cases

### 1. All 4 sidebar sections render

1. Load the app at localhost:5173
2. Scroll the sidebar from top to bottom
3. **Expected:** Sections visible: "API KEYS", "STOCK FILTERS", "WHEEL CRITERIA", "SCORING WEIGHTS" — each with a collapse chevron

### 2. API key input masking and status

1. Locate the Finnhub input in API Keys section
2. Type any text into the Finnhub field
3. **Expected:** Input is masked (password dots), status badge changes from gray "Not Set" to green "Set"
4. Click the eye icon
5. **Expected:** Input reveals the typed text; click again to re-mask

### 3. Preset dropdown populates filter values

1. Note the current values in Stock Filters (should show Finviz Cut 2 defaults: Min Price 10, Max Price 50, etc.)
2. Change the Preset dropdown to "Conservative"
3. **Expected:** All numeric filter fields update to Conservative preset values
4. Change to "Aggressive"
5. **Expected:** Fields update again to Aggressive values
6. Manually change any number field
7. **Expected:** Preset dropdown switches to "Custom"

### 4. Weight sliders with redistribution

1. Locate Scoring Weights section — should show Premium 30%, Liquidity 20%, Stability 25%, Fundamentals 25%
2. Drag the Premium slider to increase it (e.g., to 50%)
3. **Expected:** Other three sliders decrease proportionally to maintain Total: 100%
4. Verify "Total: 100%" label is still displayed

### 5. Toggle switches

1. Locate Wheel Criteria section
2. Toggle "Require Dividends" switch on
3. **Expected:** Switch turns green/on
4. Toggle it off
5. **Expected:** Switch returns to off state

### 6. Run button disabled state

1. With no Finnhub API key set, hover over "Run Screener" button
2. **Expected:** Button appears disabled with tooltip "Set Finnhub API key first"
3. Enter a Finnhub API key
4. **Expected:** Button becomes enabled (no tooltip)

### 7. Reset to Defaults

1. Change several filter values manually (price, volume, toggle a switch)
2. Click "Reset to Defaults"
3. **Expected:** All values return to Finviz Cut 2 defaults

## Edge Cases

### Weight slider edge — one slider to 100%

1. Drag one weight slider to 100%
2. **Expected:** All other sliders go to 0%, Total still shows 100%

### All numeric fields empty

1. Clear several numeric filter fields (backspace to empty)
2. **Expected:** Fields show empty (not "0" or "NaN"), store values are `undefined`

## Failure Signals

- Any sidebar section showing placeholder text ("Coming in T02..." etc.)
- Weight Total showing anything other than 100% after slider interaction
- "Not Set" badge not updating after typing an API key
- Run Screener button enabled when no Finnhub key is set
- Filter values not changing when preset dropdown changes
- Console JS errors (other than favicon 404 and Chrome password-form VERBOSE warnings)

## Requirements Proved By This UAT

- R012 — Filter controls two-way bound to filterStore
- R013 — API key inputs with masked fields and status badges
- R014 — Filter presets switching all values
- R015 — Weight sliders with sum constraint

## Not Proven By This UAT

- Preset values producing correct scan results — that requires S05 scan flow
- API key inputs actually validating keys against APIs — requires S05/S06 network calls
- Weight slider values affecting actual scoring output — requires S05 scan with real data

## Notes for Tester

- The sidebar may require scrolling to see all sections — it's taller than the viewport at default window size.
- Preset dropdown interaction and weight slider dragging work in the browser but can't be automated via Playwright due to React synthetic event / Radix slider limitations. Manual testing is the verification path for these.
- The "Set Finnhub API key first" tooltip on the Run button is only visible on hover.
