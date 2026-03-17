# S05: Results + Scan Flow — UAT

**Milestone:** M001
**Written:** 2026-03-15

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: CSV export fully proven by 10 unit tests. Scan orchestrator architecture verified by type checking and code review. Table rendering, sorting, tooltips, and KPI cards need live runtime with real API data for full confidence.

## Preconditions

- Dev server running (`npm run dev` → localhost:5173)
- Valid Finnhub API key (free tier sufficient)

## Smoke Test

Enter Finnhub API key → click Run Screener → progress bar advances → results table populates with scored data. If this works, the core pipeline is functional.

## Test Cases

### 1. Full Scan Flow

1. Open app at localhost:5173
2. Enter a valid Finnhub API key in the sidebar API Keys section
3. Select "Finviz Cut 2" preset (should be default)
4. Click "Run Screener" button
5. **Expected:** Progress bar appears showing phase, percentage, current ticker name, scanned/total counts. Candidate count increments as qualifying stocks are found.

### 2. Scan Completion + Results Table

1. Wait for scan to complete
2. **Expected:** Results table populates with rows. Each row shows: ticker+company name, price, market cap, volume, P/E, IV rank, premium yield, buying power, 200 SMA badge (Above/Below), earnings badge (≤30 days highlighted), wheel score with gradient bar (emerald ≥70, yellow ≥45, red <45), "Puts" button.

### 3. Column Sorting

1. Click the "Price" column header
2. **Expected:** Rows re-sort by price. Arrow indicator shows sort direction (up/down). Click again to reverse.
3. Click "Wheel Score" column header
4. **Expected:** Rows re-sort by wheel score descending (highest first).

### 4. Score Tooltip

1. Hover over a wheel score gradient bar
2. **Expected:** Tooltip appears showing 4 rows — Premium, Liquidity, Stability, Fundamentals — each with weight percentage, sub-score value, and color coding. Bottom shows weighted total as score/100.

### 5. KPI Cards

1. After scan completes, check the 4 cards above the results table
2. **Expected:** Tickers Scanned (total count), Qualified (filtered count), Avg Score (mean wheel score), Avg Premium (mean premium yield %). Values animate from 0 to final value.

### 6. CSV Export

1. Click "Export CSV" button (next to result count in table header)
2. **Expected:** Browser downloads a file named `WheelScan_YYYYMMDD_HHMMSS.csv`
3. Open the CSV — should have 24 columns: Symbol, Name, Industry, Price, Market Cap, Avg Volume, P/E, Beta, Div Yield, IV Rank, Premium Yield, Buying Power, 200 SMA Status, 200 SMA %, Earnings Days, Earnings Date, Analyst Buy%, ROE, Net Margin, Wheel Score, Premium Score, Liquidity Score, Stability Score, Fundamentals Score
4. **Expected:** Values match what's displayed in the table. String values with commas are double-quoted.

### 7. Scan Cancellation

1. Start a new scan
2. While progress bar is active, click "Cancel"
3. **Expected:** Scan stops. Progress bar disappears. No error message. App returns to idle state with any partial results cleared.

## Edge Cases

### Invalid API Key

1. Enter an invalid Finnhub key (e.g., "badkey123")
2. Click Run Screener
3. **Expected:** Error message appears inline: "Invalid Finnhub API key" (not a browser alert). No crash.

### No Finnhub Key Set

1. Clear the Finnhub API key field
2. **Expected:** Run Screener button is disabled (cannot click).

### Zero Results

1. Set very restrictive filter values (e.g., min price $9999)
2. Run scan
3. **Expected:** Scan completes, empty state shows "No stocks matched your filters" with guidance to adjust filters.

### Export with No Results

1. Before running a scan or after zero results
2. **Expected:** Export CSV button is disabled.

## Failure Signals

- Run Screener button stays disabled even with a valid Finnhub key entered
- Progress bar doesn't advance (stuck at 0%)
- Results table doesn't populate after scan shows "complete"
- Score tooltip doesn't appear on hover
- CSV file has wrong number of columns or missing data
- Console shows JavaScript errors during scan
- KPI cards show "—" after scan completion
- Cancel click causes error state instead of clean reset

## Requirements Proved By This UAT

- R016 — KPI cards with animated count-up display correct scan statistics
- R017 — Sortable 12-column results table with gradient score bars
- R018 — Wheel score tooltips show 4-component numeric breakdown with weights
- R019 — Full scan flow: Run → progress → results, with cancel and error handling
- R020 — CSV export produces 24-column file matching vanilla format
- R008 — TanStack Query useMutation proven for scan flow (partial — useQuery for chains is S06)

## Not Proven By This UAT

- Option chain modal (S06) — "Puts" button click is stubbed
- Framer Motion animations on KPI cards and table rows (S07)
- Run button gradient with progress fill animation (S07)
- Multi-provider scan (Alpaca, Massive.com) — only Finnhub tested here

## Notes for Tester

- Finnhub free tier allows 60 API calls/minute. Scans of large ticker lists (e.g., SP500 Top) will take time — the rate limiter paces requests automatically.
- The "Puts" button on each row currently logs to console. It will open the chain modal after S06.
- Score sub-categories show 4 user-facing weights (Premium, Liquidity, Stability, Fundamentals) which internally map to 6 scoring factors. This is by design.
- Vite HMR WebSocket may show reconnection messages in console during development — this is a dev server artifact, not a bug.
