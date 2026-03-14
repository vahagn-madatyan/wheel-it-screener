# Requirements

## Active

### R001 — Vite + React 19 + TypeScript scaffold
- Class: core-capability
- Status: validated
- Description: Project initializes with Vite, React 19, TypeScript strict mode, path aliases (@/)
- Why it matters: Foundation for entire migration
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: `npm run dev` starts Vite dev server; `npx tsc --noEmit` passes strict mode; @/ aliases resolve in both tsc and Vite
- Notes: vite@7.3.1 + @vitejs/plugin-react@5.2.0 pinned to resolve peer dep conflict (Decision #11)

### R002 — Tailwind v4 + shadcn/ui with Financial Terminal Noir theme
- Class: core-capability
- Status: active
- Description: Tailwind v4 with @tailwindcss/vite plugin, shadcn/ui CLI initialized, CSS variables theming with emerald primary (#34d399), cool near-black base (hsl 220 14% 5%)
- Why it matters: Design system foundation for all components
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S07
- Validation: CSS variables defined in oklch for all shadcn semantic tokens (both dark and light). Visual polish (noise, gradients, fonts) deferred to S07.
- Notes: Theme split into theme.css (oklch vars) + index.css (@import chain). Decision #12.

### R003 — TypeScript interfaces for all domain types
- Class: core-capability
- Status: validated
- Description: Typed interfaces for StockResult, PutOption, FilterState, ScanProgress, ChainData, ApiKeys, WeightConfig, Preset
- Why it matters: Type safety across stores, services, and components
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: All 8 interfaces defined in src/types/index.ts, consumed by scoring/filter functions, tsc clean
- Notes: FilterState uses `number | undefined` for NaN-sentinel fields (Decision #17)

### R004 — Pure business logic extraction with zero behavioral changes
- Class: primary-user-loop
- Status: validated
- Description: All scoring (wheelScore 6-factor, putScore 5-factor), filtering, formatters, ticker lists, OCC symbol parser, preset configs extracted as pure TypeScript functions
- Why it matters: Score parity with vanilla app is non-negotiable
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: 128 Vitest tests pass proving exact numeric parity with vanilla app.js. All functions pure — new objects returned, no mutation, no globals.
- Notes: Scoring weights — price 15%, volume 15%, IV rank 20%, premium yield 20%, spread 15%, earnings proximity 15%. Decision #16.

### R005 — Unit tests for scoring/filtering parity
- Class: quality-attribute
- Status: validated
- Description: Vitest tests covering wheelScore, putScore, filterStocks, formatters, OCC parser with known inputs/outputs matching vanilla app behavior
- Why it matters: Catches regressions during migration, proves parity
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: none
- Validation: 128 tests across 6 files — 22 formatter, 26 utility, 29 scoring, 17 put-scoring, 33 filter tests. All pass.
- Notes: Tests include edge cases: NaN sentinels, null PE, zero beta, ITM puts, tied scores

### R006 — Zustand stores with persist middleware
- Class: core-capability
- Status: validated
- Description: 6 stores — filterStore, resultsStore, scanStore, apiKeyStore (persisted to localStorage), themeStore (persisted), chainStore
- Why it matters: Centralized state replaces scattered vanilla JS globals
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: 33 Vitest tests pass covering all 6 stores — state transitions, preset conversion (string→number), persist serialization/deserialization, derived status computation, DOM classList sync. localStorage keys `wheelscan-api-keys` and `wheelscan-theme` inspectable in devtools.
- Notes: Decisions #18 (scanStore phase enum), #19 (apiKeyStore derived status)

### R007 — Typed API services with token-bucket rate limiter
- Class: core-capability
- Status: validated
- Description: Finnhub, Alpaca, Massive.com (Polygon) API clients with TypeScript types, token-bucket rate limiter (configurable per-provider), retry logic, error typing
- Why it matters: API layer must handle rate limits gracefully — Massive.com free tier is 5 calls/min
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S06
- Validation: 27 Vitest tests pass — 6 rate limiter tests (throttling, FIFO drain, reset, dispose) + 21 service tests (URL construction, auth headers/params, pagination, AbortSignal, ApiError typing). All services accept AbortSignal for cancellation. Finnhub retries 429 with multiplicative backoff.
- Notes: Decisions #20 (rate limiter pattern), #21 (ApiError convention), #22 (Finnhub retry strategy)

### R008 — TanStack Query v5 integration
- Class: core-capability
- Status: active
- Description: useMutation for scan flow (with progress callbacks via onMutate/onSuccess/onError), useQuery for option chain fetching, QueryClientProvider at app root
- Why it matters: Manages async state, caching, loading/error states for all API interactions
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S05, M001/S06
- Validation: QueryClientProvider wired in main.tsx with staleTime 5min, retry 1, refetchOnWindowFocus false. Dev server renders without errors. useMutation/useQuery hooks validated at runtime in S05/S06.
- Notes: Provider is wired (S02 scope). Hook usage (useMutation for scan, useQuery for chains) is S05/S06 scope — partially validated.

### R009 — CSS Grid dashboard layout
- Class: core-capability
- Status: active
- Description: 320px fixed sidebar + fluid main area, CSS Grid, dark background with subtle noise texture
- Why it matters: Primary layout structure for the entire app
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R010 — Collapsible sidebar sections
- Class: core-capability
- Status: active
- Description: Sidebar sections (API Keys, Presets, Filters, Scoring Weights) collapsible via Radix Collapsible with smooth animation
- Why it matters: Sidebar has many controls; collapsing keeps it manageable
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: M001/S04
- Validation: unmapped
- Notes: none

### R011 — Responsive breakpoints
- Class: quality-attribute
- Status: active
- Description: At 1024px sidebar collapses to hamburger overlay, at 640px layout stacks vertically
- Why it matters: Usable on tablets and smaller screens
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R012 — Sidebar controls wired to filter store
- Class: primary-user-loop
- Status: active
- Description: All filter inputs (price range, volume, market cap, IV rank, premium yield, spread, earnings days, D/E ratio, net margin, sales growth, ROE, sector exclusion) two-way bound to filterStore
- Why it matters: Filters drive what results appear — core user interaction
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: New strategy filters from STRATEGY_FILTERS.md: D/E ratio, net margin, sales growth, ROE, sector exclusion

### R013 — API key inputs with masked fields + status badges
- Class: primary-user-loop
- Status: active
- Description: Three API key inputs (Finnhub, Alpaca, Massive.com) with masked display, show/hide toggle, connection status badge (untested/valid/invalid)
- Why it matters: Users must enter API keys to use the app
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Keys persisted via apiKeyStore with Zustand persist

### R014 — Filter presets
- Class: primary-user-loop
- Status: active
- Description: Dropdown with presets — Finviz Cut 2, Conservative, Aggressive — that populate all filter fields. Custom preset created from current values.
- Why it matters: Quick-start for users who don't want to manually set 12+ filters
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: Preset values defined in STRATEGY_FILTERS.md

### R015 — Visual weight sliders
- Class: differentiator
- Status: active
- Description: Scoring weight inputs rendered as sliders (not number inputs) with visual feedback, constrained to sum to 100%
- Why it matters: More intuitive than typing numbers for weight distribution
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: unmapped
- Notes: 6 weights: price, volume, IV rank, premium yield, spread, earnings proximity

### R016 — KPI cards with animated count-up
- Class: differentiator
- Status: active
- Description: Top-of-dashboard KPI cards showing total scanned, qualified, avg wheel score, best score with animated number count-up on scan completion
- Why it matters: At-a-glance scan summary
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R017 — Sortable results table with gradient score bars
- Class: primary-user-loop
- Status: active
- Description: Results table with all columns from vanilla app, click-to-sort on any column, gradient score bars (red→yellow→emerald) in wheel score column
- Why it matters: Primary data view — users scan results here
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Same 24 columns as vanilla app

### R018 — Wheel score tooltips with numeric breakdown
- Class: primary-user-loop
- Status: active
- Description: Hovering wheel score shows Radix Popover with 6-component numeric breakdown (price, volume, IV rank, premium yield, spread, earnings proximity) with weighted total
- Why it matters: Users need to understand why a stock scored high/low
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Numeric breakdown style, not radar charts (Decision #5)

### R019 — Scan flow with progress UI
- Class: primary-user-loop
- Status: active
- Description: Run button triggers scan → progress bar shows ticker-by-ticker progress → results populate on completion → errors shown inline. Cancel button stops mid-scan.
- Why it matters: Core user action — this is what the app does
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: useMutation handles scan lifecycle

### R020 — CSV export
- Class: core-capability
- Status: active
- Description: Export button generates CSV with all 24 result columns, timestamped filename (WheelScan_YYYYMMDD_HHMMSS.csv)
- Why it matters: Users want to analyze results in Excel/Google Sheets
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: unmapped
- Notes: Same format as vanilla app

### R021 — Option chain modal
- Class: primary-user-loop
- Status: active
- Description: Clicking "Puts" on a result row opens Radix Dialog with backdrop blur, spring slide-up animation, showing option chain for that ticker
- Why it matters: Drill-down from screener to actual tradeable options
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R022 — Put scoring table with tooltips + rec badges
- Class: primary-user-loop
- Status: active
- Description: Option chain modal shows put options table with 5-component put score, tooltips showing score breakdown, recommendation badges (Best Pick, Good, OK, Caution, ITM)
- Why it matters: Helps user pick the best strike/expiry
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: none
- Validation: unmapped
- Notes: Put score: spread 30%, liquidity 25%, premium 20%, delta 15%, IV 10%

### R023 — Massive.com (Polygon) options provider
- Class: core-capability
- Status: active
- Description: Massive.com API integration as secondary options data provider alongside Finnhub/Alpaca, with 5 calls/min rate limiting, OCC symbol parsing
- Why it matters: User wants multiple data source options
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: M001/S02
- Validation: unmapped
- Notes: Free tier is restrictive — needs careful rate limiting and user feedback

### R024 — Framer Motion animations
- Class: differentiator
- Status: active
- Description: Page load staggers, sidebar toggle springs, modal slide-up with backdrop fade, score bar gradient fills, theme toggle icon morph
- Why it matters: Premium feel differentiator
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R025 — Noise texture overlay + gradient borders
- Class: differentiator
- Status: active
- Description: Subtle SVG noise texture overlay on backgrounds, gradient borders on cards, refined box-shadows
- Why it matters: Visual polish for terminal noir aesthetic
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R026 — Font trio via CDN
- Class: differentiator
- Status: active
- Description: Space Grotesk (display/headings), General Sans (body/UI), JetBrains Mono (data/numbers) loaded from Google Fonts + Fontshare CDN
- Why it matters: Typography is core to the premium look
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: none
- Validation: unmapped
- Notes: Self-host later if needed (Decision #8)

### R027 — Theme toggle (dark/light)
- Class: core-capability
- Status: active
- Description: Toggle between dark (primary) and light themes, persisted to localStorage, with icon morph animation (sun↔moon)
- Why it matters: User preference persistence
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: M001/S02
- Validation: unmapped
- Notes: none

### R028 — Run button with gradient + progress fill
- Class: differentiator
- Status: active
- Description: Run Scan button has emerald gradient background with animated progress bar fill during scan
- Why it matters: Visual feedback during long scans
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: M001/S05
- Validation: unmapped
- Notes: none

### R029 — Remove old vanilla files
- Class: constraint
- Status: active
- Description: Delete app.js, style.css, base.css, index.html after React app is verified working
- Why it matters: Clean repo, no confusion about which code is active
- Source: user
- Primary owning slice: M001/S08
- Supporting slices: none
- Validation: unmapped
- Notes: Only after full verification

### R030 — ESLint + Prettier config
- Class: quality-attribute
- Status: active
- Description: ESLint with TypeScript + React + Tailwind rules, Prettier for formatting consistency
- Why it matters: Code quality baseline
- Source: user
- Primary owning slice: M001/S08
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R031 — Build optimization + code splitting
- Class: quality-attribute
- Status: active
- Description: Lazy-load ChainModal, Vite chunk splitting, tree-shaking verification, bundle size check
- Why it matters: Fast initial load for static deployment
- Source: user
- Primary owning slice: M001/S08
- Supporting slices: none
- Validation: unmapped
- Notes: none

### R032 — Static SPA deployment build
- Class: launchability
- Status: active
- Description: `npm run build` produces a static dist/ folder deployable to Vercel/Netlify/GitHub Pages with correct asset paths
- Why it matters: App must be deployable, not just dev-server-only
- Source: user
- Primary owning slice: M001/S08
- Supporting slices: none
- Validation: unmapped
- Notes: none

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M001/S01 | none | tsc + dev server + @/ aliases |
| R002 | core-capability | active | M001/S01 | M001/S07 | oklch vars defined; visual polish pending S07 |
| R003 | core-capability | validated | M001/S01 | none | 8 interfaces, tsc clean |
| R004 | primary-user-loop | validated | M001/S01 | none | 128 parity tests pass |
| R005 | quality-attribute | validated | M001/S01 | none | 128 tests across 6 files |
| R006 | core-capability | validated | M001/S02 | none | 33 store tests pass; persist serialization verified |
| R007 | core-capability | validated | M001/S02 | M001/S06 | 27 service/rate-limiter tests pass |
| R008 | core-capability | active | M001/S02 | M001/S05, M001/S06 | QueryClientProvider wired; hooks pending S05/S06 |
| R009 | core-capability | active | M001/S03 | none | unmapped |
| R010 | core-capability | active | M001/S03 | M001/S04 | unmapped |
| R011 | quality-attribute | active | M001/S03 | none | unmapped |
| R012 | primary-user-loop | active | M001/S04 | none | unmapped |
| R013 | primary-user-loop | active | M001/S04 | none | unmapped |
| R014 | primary-user-loop | active | M001/S04 | none | unmapped |
| R015 | differentiator | active | M001/S04 | none | unmapped |
| R016 | differentiator | active | M001/S05 | none | unmapped |
| R017 | primary-user-loop | active | M001/S05 | none | unmapped |
| R018 | primary-user-loop | active | M001/S05 | none | unmapped |
| R019 | primary-user-loop | active | M001/S05 | none | unmapped |
| R020 | core-capability | active | M001/S05 | none | unmapped |
| R021 | primary-user-loop | active | M001/S06 | none | unmapped |
| R022 | primary-user-loop | active | M001/S06 | none | unmapped |
| R023 | core-capability | active | M001/S06 | M001/S02 | unmapped |
| R024 | differentiator | active | M001/S07 | none | unmapped |
| R025 | differentiator | active | M001/S07 | none | unmapped |
| R026 | differentiator | active | M001/S07 | none | unmapped |
| R027 | core-capability | active | M001/S07 | M001/S02 | unmapped |
| R028 | differentiator | active | M001/S07 | M001/S05 | unmapped |
| R029 | constraint | active | M001/S08 | none | unmapped |
| R030 | quality-attribute | active | M001/S08 | none | unmapped |
| R031 | quality-attribute | active | M001/S08 | none | unmapped |
| R032 | launchability | active | M001/S08 | none | unmapped |

## Coverage Summary

- Active requirements: 26
- Mapped to slices: 32
- Validated: 6 (R001, R003, R004, R005, R006, R007)
- Unmapped active requirements: 0
