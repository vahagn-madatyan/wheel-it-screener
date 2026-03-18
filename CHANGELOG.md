# Changelog

All notable changes to WheelScan are documented in this file.

## [0.3.0] - 2026-03-17

### Filter Preset Tuning & Sector Exclusion Audit (M003)

#### Changed
- **Finviz Cut 2 maxPrice**: $50 → $150 — blue-chip wheel stocks (AAPL, MSFT, GOOGL) now survive the default scan
- **Conservative maxPrice**: $100 → $150
- **Conservative maxBP**: $15,000 → $10,000 — tighter buying power for conservative traders
- **Conservative maxDebtEquity**: 0.5 → 1.0 — banks (JPM, BAC, WFC) no longer blanket-excluded
- **Conservative minIVRank**: 20 → 25 — ensures meaningful vol premium exists
- **Aggressive minNetMargin**: -50% → -10% — rejects deeply unprofitable companies

#### Fixed
- Removed `Pharmaceuticals` from sector exclusion list — big pharma (JNJ, PFE, ABBV) now survive filtering. Only `Biotechnology` is excluded (binary event risk).
- Verified `EXCLUDED_TICKERS` count is 28 (no stale "30" references)
- Verified E&P exclusion doesn't catch integrated oil majors (XOM, CVX)

#### Tests
- 236 total tests (was 227) — added 6 preset audit assertions and 3 sector/ticker regression guards

## [0.2.0] - 2026-03-16

### PR Review Fixes — Correctness, Resilience & Cleanup (M002)

#### Fixed
- Market cap display: raw values now divided by 1B for correct display
- Error messages visible to users (red text, not hidden)
- Scan phase labels in ProgressBar ("Fetching earnings…", "Loading quotes…", etc.)
- Failed tickers surfaced via ScanWarnings component after scan completes

#### Changed
- API keys stored in `sessionStorage` instead of `localStorage` (security improvement)
- ChainParams uses discriminated union type (`{ provider: 'alpaca' | 'massive', ... }`)
- React Error Boundary wraps app root — catches render crashes gracefully

#### Removed
- Dead code cleanup — unused imports, unreachable branches, stale comments

## [0.1.0] - 2026-03-16

### React Migration & Visual Redesign (M001)

#### Added
- Full React 19 + Vite 7.3 + TypeScript (strict mode) SPA
- Tailwind v4 + shadcn/ui with Financial Terminal Noir theme (dark + light modes)
- 6-factor wheel score model: price, volume, IV rank, premium yield, spread, earnings proximity
- 5-factor put score model: spread, liquidity, premium, delta, IV
- 3 filter presets: Finviz Cut 2, Conservative, Aggressive
- ~25 filter controls with two-way store binding
- Sortable 12-column results table with gradient score bars
- Option chain drill-down modal with put score tooltips and recommendation badges
- 4 KPI cards with animated count-up on scan completion
- Scoring weight sliders with proportional redistribution (sum constrained to 100%)
- CSV export with 24 columns, timestamped filename
- API clients for Finnhub, Alpaca, Massive.com with token-bucket rate limiting
- 5-phase scan orchestrator with progress tracking and cancel support
- Framer Motion animations: page stagger, modal spring, theme toggle morph
- Space Grotesk / General Sans / JetBrains Mono typography
- SVG noise texture overlay, gradient card borders, backdrop blur
- Responsive layout: 320px sidebar → hamburger overlay at 1024px → stacked at 640px
- ChainModal lazy-loaded via React.lazy() for code splitting
- ESLint v9 + Prettier configuration
- 227 Vitest tests covering scoring, filtering, formatting, stores, services
