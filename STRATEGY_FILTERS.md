# Implementation Spec: Score Tooltips + Strategy Filters

## 1. Score Hover Tooltips

### Wheel Score Tooltip (results table)

When user hovers over the wheel score cell, show a popover with:

```
Wheel Score: 72/100
─────────────────
Premium:      85 × 30% = 25.5
Liquidity:    60 × 20% = 12.0
Stability:    70 × 25% = 17.5
Fundamentals: 68 × 25% = 17.0
```

Each sub-score (0-100) is already computed on the stock object:

- stock.premiumScore, stock.liquidityScore, stock.stabilityScore, stock.fundamentalsScore
- Weights come from filters: weightPremium, weightLiquidity, weightStability, weightFundamentals

### Put Score Tooltip (chain panel)

When user hovers over put score cell in chain table, show:

```
Put Score: 78/100
─────────────────
Spread:    85 × 30% = 25.5
Liquidity: 70 × 25% = 17.5
Premium:   90 × 20% = 18.0
Delta:     65 × 15% = 9.8
IV:        72 × 10% = 7.2
```

Need to store sub-scores on each put object during scorePuts().
Currently only putScore is stored. Add: p.spreadScore, p.liquidityScore, p.premScore, p.deltaScore, p.ivScore

### Tooltip CSS

- Use a CSS-only tooltip with `data-tooltip` attribute on the score cell
- Position: above the cell, centered
- Style: dark bg, light text, small font, rounded corners, max-width 220px
- White-space: pre to preserve alignment
- Show on hover with opacity transition

## 2. New Filters from Strategy Doc

### Add to STOCK FILTERS section (HTML):

After the existing Vol / P/E row, add:

```
Debt/Equity:
- Max D/E: number input, default 1.0, step 0.1
  (strategy: under 1 = financially healthy)

Net Margin:
- Min Net Margin %: number input, default 0, step 1
  (strategy: positive = profitable)

Sales Growth:
- Min Sales Growth Q/Q %: number input, default 5, step 1
  (strategy: >5% = not stagnant)

ROE:
- Min ROE %: number input, default 0, step 1
  (strategy: optional, >10% = efficient capital)
```

### Sector Exclusion (new toggle section or multi-select)

Add a new section "Sector Exclusions" or add to stock filters:

- Toggle: "Exclude Risky Sectors" (default: ON)
- When ON, automatically excludes stocks whose finnhubIndustry matches:
  - Biotechnology, Pharmaceuticals (clinical stage)
  - Regional Banks, Thrifts & Mortgage Finance
  - Oil & Gas Exploration & Production
  - SPACs (check for "Blank Check" or "Special Purpose Acquisition")

- Hardcoded EXCLUDED_INDUSTRIES list in JS:

```js
const EXCLUDED_INDUSTRIES = [
  'Biotechnology',
  'Blank Checks',
  // ... (cannot perfectly match all, but cover the main ones)
];
```

Note: Finnhub industry field from profile2 won't perfectly match "Chinese ADRs" or "Meme stocks" —
those would need exchange-based or manual ticker exclusions. For now, focus on what's automatable.

### Filter Presets Dropdown

Add a "Preset" dropdown ABOVE the stock filters section (or at the very top of stock filters):

```html
<select id="filter-preset" onchange="applyPreset(this.value)">
  <option value="finviz_cut2">Finviz Cut 2 (Recommended)</option>
  <option value="conservative">Conservative</option>
  <option value="aggressive">Aggressive</option>
  <option value="custom" selected>Custom</option>
</select>
```

Preset values:

**Finviz Cut 2** (matches the strategy doc exactly):

- Price: $10–$50
- Min Mkt Cap: $2B (2)
- Max D/E: 1.0
- Min Net Margin: 0 (positive)
- Min Sales Growth: 5%
- Min Vol: 2M
- Max P/E: 60
- Above 200 SMA: ON
- Exclude Earnings 14d: ON
- Exclude Risky Sectors: ON
- Min IV Rank: 30
- Target DTE: 30-45
- Delta: 0.20-0.30

**Conservative**:

- Price: $20–$100
- Min Mkt Cap: $10B (10)
- Max D/E: 0.5
- Min Net Margin: 10
- Min Vol: 5M
- Max P/E: 30
- Require Dividends: ON
- Above 200 SMA: ON
- Min IV Rank: 20, Max: 60

**Aggressive**:

- Price: $5–$200
- Min Mkt Cap: $1B (1)
- Max D/E: 2.0
- Min Net Margin: -50
- Min Vol: 0.5M
- Max P/E: 100
- Target DTE: 30
- Delta: 0.35

## 3. JS Logic Changes

### getFilters() — add new fields:

```js
maxDebtEquity: parseFloat(document.getElementById("max-debt-equity").value) || 999,
minNetMargin: parseFloat(document.getElementById("min-net-margin").value) || -999,
minSalesGrowth: parseFloat(document.getElementById("min-sales-growth").value) || -999,
minROE: parseFloat(document.getElementById("min-roe").value) || -999,
excludeRiskySectors: document.getElementById("toggle-risky-sectors").classList.contains("active"),
```

### Apply filters in runScreener step 5:

After existing filters, add:

```js
// Debt/Equity filter
if (stock.debtToEquity !== null && stock.debtToEquity > filters.maxDebtEquity) continue;

// Net Margin filter
if (stock.netMargin !== null && stock.netMargin < filters.minNetMargin) continue;

// Sales growth filter
if (stock.revenueGrowth !== null && stock.revenueGrowth < filters.minSalesGrowth) continue;

// ROE filter
if (stock.roe !== null && stock.roe < filters.minROE) continue;

// Sector exclusion filter
if (filters.excludeRiskySectors && isExcludedSector(stock.industry)) continue;
```

### resetDefaults() — update to Finviz Cut 2 defaults

### applyPreset(preset) — new function that sets all filter values

### renderResults() — add data-tooltip to score cell

### scorePuts() — store individual sub-scores on each put object

### renderChainTable() — add data-tooltip to put score cell
