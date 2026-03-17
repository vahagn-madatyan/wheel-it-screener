# Option Chain Feature Implementation Spec

## API Research Summary

### Massive.com (ex-Polygon.io) Options API

- **Options Basic (FREE)**: 5 API calls/min, EOD data, 2yr history, reference data
- **Options Starter ($29/mo)**: Unlimited calls, 15-min delayed, 2yr history
- Base URL: `https://api.polygon.io` (still works) or `https://api.massive.com`
- **Option Chain Snapshot**: `GET /v3/snapshot/options/{underlyingAsset}?apiKey=KEY`
  - Query params: `strike_price`, `expiration_date` (YYYY-MM-DD), `contract_type` (call/put), `limit` (max 250), `order`, `sort`
  - Returns: greeks (delta, gamma, theta, vega), implied_volatility, open_interest, break_even_price, day (OHLCV), last_quote (bid/ask), last_trade, details (strike, expiry, type)
  - Pagination via `next_url`
- **Options Contracts**: `GET /v3/reference/options/contracts?underlying_ticker=AAPL&expiration_date=2026-04-17`
  - Lists available contracts, can filter by expiration
- **Note**: Free tier = 5 calls/min = quite limited for chain fetching. Best for fetching one stock at a time.

### Tradier Sandbox API (FREE alternative)

- Free sandbox with 15-min delayed data
- `GET https://sandbox.tradier.com/v1/markets/options/expirations?symbol=AAPL`
- `GET https://sandbox.tradier.com/v1/markets/options/chains?symbol=AAPL&expiration=2026-04-17`
- Returns: bid, ask, last, volume, open_interest, option_type, strike, greeks (via ORATS)
- **Greeks NOT available in sandbox** — only in brokerage API
- Auth: Bearer token in header

### Recommendation: Use Massive.com as primary (has greeks on free tier snapshot)

- Fallback note for Tradier if user prefers

## Feature Design

### 1. API Key Section Update

- Add "Options Data (Massive)" section with API key field
- Link to massive.com for free key signup
- Show status badge like Finnhub key
- Note: "Free tier: 5 calls/min, EOD data"

### 2. Stock Selection → Option Chain Flow

- Make table rows clickable (or add "View Chain" button per row)
- Clicking opens a slide-out panel or modal showing:
  - Stock header (symbol, name, price, change)
  - Expiration date selector (fetched from Massive)
  - Option chain table for PUTS only (wheel = sell puts)
  - Highlighted "recommended" rows

### 3. Option Chain Panel Design

- Full-width overlay/modal with dark theme matching dashboard
- Header: SYMBOL | Current Price | Selected DTE
- Expiration picker: dropdown of available dates, grouped by DTE proximity to target
- Put chain table columns:
  - Strike | Bid | Ask | Spread | Spread% | Mid | Last | Volume | OI | Delta | IV | Premium Yield% | Wheel Score | Recommendation Badge

### 4. Put Recommendation Scoring

For each put contract, calculate a "Wheel Put Score" based on:

- **Spread Quality** (30%): tighter spread = better. Spread% = (ask-bid)/mid \* 100. <5% = great, >15% = bad
- **Liquidity** (25%): OI + Volume combined. Higher = better fills
- **Premium Yield** (20%): (mid*price / strike) * (365/DTE) \_ 100 = annualized yield
- **Delta Sweet Spot** (15%): Ideal delta for wheel = 0.20-0.35 (user's target delta). Closer to target = better score
- **IV Level** (10%): Higher IV = more premium but also more risk. Show but score moderately

Badges:

- "Best Pick" for top 1-2 contracts
- "Good" for score > 70
- "Caution" for score < 40

### 5. Data Fixes

#### 200 SMA N/A Fix

The Finnhub `/stock/metric` endpoint returns `200DayMovingAverage` as a metric key.
Current code already reads it: `stock.twoHundredDayAvg = m["200DayMovingAverage"] || 0`
Issue: The metric key might be different. Check Finnhub docs for exact key name.
Actual Finnhub metric keys: `200DayMovingAverage` should work. But if the metric response is empty or the key doesn't exist for some tickers, fall back to computing it or showing "N/A" with a note.
**Fix**: Add a note in the UI that 200 SMA data comes from Finnhub. If unavailable, suggest adding Alpha Vantage key for SMA data.

#### Earnings N/A Fix

Current flow: fetches `/calendar/earnings` for 90 days ahead.
Issues:

1. Finnhub free tier may have limited earnings calendar data
2. Some stocks may not have earnings scheduled in the next 90 days
3. The calendar endpoint might return incomplete data

**Fix**:

- Extend the earnings lookup to 120 days
- Add a visual note: "Earnings data from Finnhub. If N/A, check Nasdaq.com"
- Consider fetching earnings per-ticker via `/stock/earnings` as fallback
