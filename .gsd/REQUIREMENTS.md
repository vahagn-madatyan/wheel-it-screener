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
- Status: validated
- Description: Tailwind v4 with @tailwindcss/vite plugin, shadcn/ui CLI initialized, CSS variables theming with emerald primary (#34d399), cool near-black base (hsl 220 14% 5%)
- Why it matters: Design system foundation for all components
- Source: user
- Primary owning slice: M001/S01
- Supporting slices: M001/S07
- Validation: CSS variables defined in oklch for all shadcn semantic tokens (both dark and light). Visual polish complete in S07: font trio (Space Grotesk, General Sans, JetBrains Mono), SVG noise texture overlay, gradient borders on KPI cards, theme toggle — all verified in browser.
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
- Status: validated
- Description: useMutation for scan flow (with progress callbacks via onMutate/onSuccess/onError), useQuery for option chain fetching, QueryClientProvider at app root
- Why it matters: Manages async state, caching, loading/error states for all API interactions
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: M001/S05, M001/S06
- Validation: QueryClientProvider wired in main.tsx. useMutation for scan flow validated in S05 (progress, cancel, error handling). useQuery for chain data validated in S06 (Alpaca/Massive fetch, store sync, AbortSignal, retry:false). Both hooks work at runtime.
- Notes: Fully validated across S02 (provider), S05 (mutation), S06 (query).

### R009 — CSS Grid dashboard layout
- Class: core-capability
- Status: validated
- Description: 320px fixed sidebar + fluid main area, CSS Grid, dark background with subtle noise texture
- Why it matters: Primary layout structure for the entire app
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: CSS Grid `grid-cols-[320px_1fr]` renders at desktop width. Sidebar measured at exactly 320px via getBoundingClientRect. Main area fills remaining width. Noise texture deferred to S07.
- Notes: DashboardLayout component in src/components/layout/DashboardLayout.tsx

### R010 — Collapsible sidebar sections
- Class: core-capability
- Status: validated
- Description: Sidebar sections (API Keys, Presets, Filters, Scoring Weights) collapsible via Radix Collapsible with smooth animation
- Why it matters: Sidebar has many controls; collapsing keeps it manageable
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: M001/S04
- Validation: SidebarSection wraps Radix Collapsible with chevron rotation via data-state selectors and tw-animate-css height keyframes. Sections toggle between open/closed states. S04 populates with real controls.
- Notes: SidebarSection component in src/components/layout/SidebarSection.tsx

### R011 — Responsive breakpoints
- Class: quality-attribute
- Status: validated
- Description: At 1024px sidebar collapses to hamburger overlay, at 640px layout stacks vertically
- Why it matters: Usable on tablets and smaller screens
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: Verified in browser at 1280px (desktop inline), 1023px (hamburger + overlay with backdrop), 640px (stacked). Escape key and backdrop click close overlay. MediaQueryList listener auto-closes overlay on resize past lg breakpoint.
- Notes: Mobile overlay uses conditional DOM mounting pattern (Decision #24)

### R012 — Sidebar controls wired to filter store
- Class: primary-user-loop
- Status: validated
- Description: All filter inputs (price range, volume, market cap, IV rank, premium yield, spread, earnings days, D/E ratio, net margin, sales growth, ROE, sector exclusion) two-way bound to filterStore
- Why it matters: Filters drive what results appear — core user interaction
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: All ~25 filter controls rendered in sidebar, two-way bound to filterStore, verified in browser with correct Finviz Cut 2 default values. 196 tests pass including store-level preset/reset tests.
- Notes: New strategy filters from STRATEGY_FILTERS.md: D/E ratio, net margin, sales growth, ROE, sector exclusion

### R013 — API key inputs with masked fields + status badges
- Class: primary-user-loop
- Status: validated
- Description: Three API key inputs (Finnhub, Alpaca, Massive.com) with masked display, show/hide toggle, connection status badge (untested/valid/invalid)
- Why it matters: Users must enter API keys to use the app
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: 4 API key inputs render with masked fields, eye toggle works both directions, status badges update on key entry ("Not Set" → green "Set"), localStorage persistence verified. Alpaca coordinated update pattern confirmed working.
- Notes: Keys persisted via apiKeyStore with Zustand persist

### R014 — Filter presets
- Class: primary-user-loop
- Status: validated
- Description: Dropdown with presets — Finviz Cut 2, Conservative, Aggressive — that populate all filter fields. Custom preset created from current values.
- Why it matters: Quick-start for users who don't want to manually set 12+ filters
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: Preset dropdown renders with 3 presets + Custom. Derived detection via useMemo correctly identifies current preset or shows "Custom" when manually edited. applyPreset and resetFilters store actions verified by 33 store tests.
- Notes: Preset values defined in STRATEGY_FILTERS.md

### R015 — Visual weight sliders
- Class: differentiator
- Status: validated
- Description: Scoring weight inputs rendered as sliders (not number inputs) with visual feedback, constrained to sum to 100%
- Why it matters: More intuitive than typing numbers for weight distribution
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: 4 Radix Slider components render with percentage labels (30/20/25/25 default). Proportional redistribution verified by 8 unit tests. "Total: 100%" displayed in UI. Edge cases tested: all-others-zero, single absorber, rounding.
- Notes: 4 user-facing weight categories (Premium, Liquidity, Stability, Fundamentals) map to the 6-factor scoring model internally

### R016 — KPI cards with animated count-up
- Class: differentiator
- Status: validated
- Description: Top-of-dashboard KPI cards showing total scanned, qualified, avg wheel score, avg premium yield with animated number count-up on scan completion
- Why it matters: At-a-glance scan summary
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: 4 KPI cards render with correct values. Animated count-up via requestAnimationFrame with ease-out quad easing over 600ms. Pre-scan state shows "—". tsc clean, browser verified.
- Notes: Shows avg premium yield (not "best score") to match implementation

### R017 — Sortable results table with gradient score bars
- Class: primary-user-loop
- Status: validated
- Description: Results table with 12 display columns from vanilla app, click-to-sort on any column, gradient score bars (red→yellow→emerald) in wheel score column
- Why it matters: Primary data view — users scan results here
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: 12-column sortable table built. Click-to-sort with ChevronUp/Down indicators. Gradient score bars (emerald ≥70, yellow ≥45, red <45). SMA/earnings badges. tsc clean, browser renders correctly.
- Notes: 12 display columns in table; full 24-column data available via CSV export

### R018 — Wheel score tooltips with numeric breakdown
- Class: primary-user-loop
- Status: validated
- Description: Hovering wheel score shows Radix Tooltip with 4-component numeric breakdown (Premium, Liquidity, Stability, Fundamentals) with weight percentages and weighted total
- Why it matters: Users need to understand why a stock scored high/low
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: Radix Tooltip shows 4-row breakdown with weight percentages from filterStore. Color-coded sub-scores (emerald ≥70, yellow ≥45, red <45). useShallow prevents re-render loops (Decision #29). tsc clean.
- Notes: 4 user-facing categories map to 6 internal factors per weight slider design (Decision #27). Numeric breakdown style (Decision #5).

### R019 — Scan flow with progress UI
- Class: primary-user-loop
- Status: validated
- Description: Run button triggers scan → progress bar shows ticker-by-ticker progress → results populate on completion → errors shown inline. Cancel button stops mid-scan.
- Why it matters: Core user action — this is what the app does
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: 5-phase scan orchestrator (earnings→quote+metrics→profile→recommendations→filter+score) as pure async function. useMutation wrapper with AbortController for cancel. ProgressBar shows phase/percentage/ticker. Auth 401/403 surfaces as "Invalid Finnhub API key". 206 tests pass, tsc clean.
- Notes: Decisions #30 (decoupled orchestrator), #22 (Finnhub retry strategy)

### R020 — CSV export
- Class: core-capability
- Status: validated
- Description: Export button generates CSV with all 24 result columns, timestamped filename (WheelScan_YYYYMMDD_HHMMSS.csv)
- Why it matters: Users want to analyze results in Excel/Google Sheets
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: 10 Vitest tests — correct 24-column header, value formatting matching vanilla, string escaping (commas/quotes), null handling, empty results. buildCSVContent() pure function + exportCSV() DOM wrapper (Decision #31). Export button disabled when no results.
- Notes: Same format as vanilla app

### R021 — Option chain modal
- Class: primary-user-loop
- Status: validated
- Description: Clicking "Puts" on a result row opens Radix Dialog with backdrop blur, spring slide-up animation, showing option chain for that ticker
- Why it matters: Drill-down from screener to actual tradeable options
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: none
- Validation: Radix Dialog opens via chainStore.open(symbol), shows header (symbol/name/price), 4 states (loading/error/empty/table), closes on X/Escape/backdrop. Puts button wired. 222 tests pass, tsc clean, browser verified. Spring animation deferred to S07.
- Notes: Animation layer added in S07

### R022 — Put scoring table with tooltips + rec badges
- Class: primary-user-loop
- Status: validated
- Description: Option chain modal shows put options table with 5-component put score, tooltips showing score breakdown, recommendation badges (Best Pick, Good, OK, Caution, ITM)
- Why it matters: Helps user pick the best strike/expiry
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: none
- Validation: 12-column table (Strike/Bid/Ask/Spread%/Mid/Vol/OI/Delta/IV%/AnnYield%/Score/Rec) with PutColumn render functions. PutScoreTooltip shows 5-component breakdown. Rec badges: Best Pick (emerald), Good (blue), OK (gray), Caution (amber), ITM (muted). ITM rows 50% opacity. Best rows emerald highlight. tsc clean, code review verified.
- Notes: Put score: spread 30%, liquidity 25%, premium 20%, delta 15%, IV 10%

### R023 — Massive.com (Polygon) options provider
- Class: core-capability
- Status: validated
- Description: Massive.com API integration as secondary options data provider alongside Finnhub/Alpaca, with 5 calls/min rate limiting, OCC symbol parsing
- Why it matters: User wants multiple data source options
- Source: user
- Primary owning slice: M001/S06
- Supporting slices: M001/S02
- Validation: fetchChainMassive implemented and tested (chain.test.ts). Provider detection: Alpaca preferred > Massive > null. Rate limiter created via useRef in useChainQuery, disposed on unmount. 13 chain tests cover Massive parse, provider detection (5 cases), error handling.
- Notes: Live validation with Massive.com key deferred to runtime — mock-tested in Vitest

### R024 — Framer Motion animations
- Class: differentiator
- Status: validated
- Description: Page load staggers, sidebar toggle springs, modal slide-up with backdrop fade, score bar gradient fills, theme toggle icon morph
- Why it matters: Premium feel differentiator
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: none
- Validation: motion@12 installed. KPI card stagger (0.08s spring), ResultsTable row stagger (0.02s, first 20), dialog spring slide-up via forceMount+AnimatePresence (Decision #35), ProgressBar/EmptyState AnimatePresence fades, ThemeToggle rotate+scale morph. All verified in browser with zero console errors.
- Notes: none

### R025 — Noise texture overlay + gradient borders
- Class: differentiator
- Status: validated
- Description: Subtle SVG noise texture overlay on backgrounds, gradient borders on cards, refined box-shadows
- Why it matters: Visual polish for terminal noir aesthetic
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: none
- Validation: Inline SVG feTurbulence noise overlay at 4% opacity, fixed inset-0 pointer-events-none in DashboardLayout. KPI cards wrapped in bg-gradient-to-br from-primary/30 p-px border technique. Both verified in browser DOM and visually.
- Notes: none

### R026 — Font trio via CDN
- Class: differentiator
- Status: validated
- Description: Space Grotesk (display/headings), General Sans (body/UI), JetBrains Mono (data/numbers) loaded from Google Fonts + Fontshare CDN
- Why it matters: Typography is core to the premium look
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: none
- Validation: Preconnect + CSS links in index.html. Tailwind tokens --font-display (Space Grotesk), --font-sans (General Sans), --font-mono (JetBrains Mono). Browser computed font-family verified for all three on heading, body, and tabular elements.
- Notes: Self-host later if needed (Decision #8)

### R027 — Theme toggle (dark/light)
- Class: core-capability
- Status: validated
- Description: Toggle between dark (primary) and light themes, persisted to localStorage, with icon morph animation (sun↔moon)
- Why it matters: User preference persistence
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: M001/S02
- Validation: ThemeToggle component with Lucide Sun/Moon icons, wired to useThemeStore (persisted). Toggles <html> class dark↔light. AnimatePresence rotate+scale icon morph. aria-label switches between "Switch to light mode" / "Switch to dark mode". Browser verified both directions.
- Notes: none

### R028 — Run button with gradient + progress fill
- Class: differentiator
- Status: validated
- Description: Run Scan button has emerald gradient background with animated progress bar fill during scan
- Why it matters: Visual feedback during long scans
- Source: user
- Primary owning slice: M001/S07
- Supporting slices: M001/S05
- Validation: bg-gradient-to-r from-emerald-600 to-emerald-500 on enabled button. During phase=running, absolute-positioned bg-emerald-400/20 div tracks progress*100% width via CSS transition. Gradient and structure verified in browser and code.
- Notes: none

### R029 — Remove old vanilla files
- Class: constraint
- Status: validated
- Description: Delete app.js, style.css, base.css, index.html after React app is verified working
- Why it matters: Clean repo, no confusion about which code is active
- Source: user
- Primary owning slice: M001/S08
- Supporting slices: none
- Validation: All 4 files deleted — `ls` confirms "No such file" for each. tw-animate-css dependency also fully removed (package, CSS import, tooltip classes).
- Notes: Completed alongside tw-animate-css removal in S08/T01

### R030 — ESLint + Prettier config
- Class: quality-attribute
- Status: validated
- Description: ESLint with TypeScript + React + Tailwind rules, Prettier for formatting consistency
- Why it matters: Code quality baseline
- Source: user
- Primary owning slice: M001/S08
- Supporting slices: none
- Validation: ESLint v9 flat config with typescript-eslint, react-hooks, react-refresh, eslint-config-prettier — `npx eslint .` exits 0. Prettier with .prettierrc — `npx prettier --check .` reports all files formatted.
- Notes: eslint@^9 pinned due to react-hooks v7 peer dep. React Compiler rules disabled (Decisions #37, #38).

### R031 — Build optimization + code splitting
- Class: quality-attribute
- Status: validated
- Description: Lazy-load ChainModal, Vite chunk splitting, tree-shaking verification, bundle size check
- Why it matters: Fast initial load for static deployment
- Source: user
- Primary owning slice: M001/S08
- Supporting slices: none
- Validation: ChainModal lazy-loaded via React.lazy() + Suspense. Build produces 2 JS chunks: index 491KB + ChainModal 49KB. No Vite 500KB chunk warning.
- Notes: Main chunk close to 500KB threshold — use React.lazy() for future heavy components (Decision #39).

### R032 — Static SPA deployment build
- Class: launchability
- Status: validated
- Description: `npm run build` produces a static dist/ folder deployable to Vercel/Netlify/GitHub Pages with correct asset paths
- Why it matters: App must be deployable, not just dev-server-only
- Source: user
- Primary owning slice: M001/S08
- Supporting slices: none
- Validation: `npm run build` succeeds, produces dist/ with index.html + assets/. `npm run preview` serves working SPA at localhost:4173.
- Notes: none

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M001/S01 | none | tsc + dev server + @/ aliases |
| R002 | core-capability | validated | M001/S01 | M001/S07 | oklch vars + font trio + noise + gradient borders + theme toggle |
| R003 | core-capability | validated | M001/S01 | none | 8 interfaces, tsc clean |
| R004 | primary-user-loop | validated | M001/S01 | none | 128 parity tests pass |
| R005 | quality-attribute | validated | M001/S01 | none | 128 tests across 6 files |
| R006 | core-capability | validated | M001/S02 | none | 33 store tests pass; persist serialization verified |
| R007 | core-capability | validated | M001/S02 | M001/S06 | 27 service/rate-limiter tests pass |
| R008 | core-capability | validated | M001/S02 | M001/S05, M001/S06 | useMutation (S05) + useQuery (S06) validated at runtime |
| R009 | core-capability | validated | M001/S03 | none | CSS Grid 320px+1fr verified in browser |
| R010 | core-capability | validated | M001/S03 | M001/S04 | Radix Collapsible with animated height |
| R011 | quality-attribute | validated | M001/S03 | none | 1024px hamburger overlay + 640px stacked verified |
| R012 | primary-user-loop | validated | M001/S04 | none | ~25 controls bound to filterStore, browser verified |
| R013 | primary-user-loop | validated | M001/S04 | none | masked inputs + eye toggle + status badges verified |
| R014 | primary-user-loop | validated | M001/S04 | none | 3 presets + derived Custom, store tests pass |
| R015 | differentiator | validated | M001/S04 | none | 4 sliders + redistribution, 8 unit tests + browser |
| R016 | differentiator | validated | M001/S05 | none | 4 KPI cards with count-up animation, tsc clean, browser verified |
| R017 | primary-user-loop | validated | M001/S05 | none | 12-column sortable table, gradient score bars, tsc clean |
| R018 | primary-user-loop | validated | M001/S05 | none | 4-component Radix Tooltip with weights, useShallow fix |
| R019 | primary-user-loop | validated | M001/S05 | none | 5-phase scan pipeline, progress bar, cancel, error handling, 206 tests |
| R020 | core-capability | validated | M001/S05 | none | 24-column CSV, 10 unit tests, export button wired |
| R021 | primary-user-loop | validated | M001/S06 | none | Modal opens, 4 states render, closes correctly |
| R022 | primary-user-loop | validated | M001/S06 | none | 12-column table, 5-component tooltips, rec badges |
| R023 | core-capability | validated | M001/S06 | M001/S02 | Alpaca + Massive providers, 13 chain tests |
| R024 | differentiator | validated | M001/S07 | none | motion@12 stagger/spring/AnimatePresence on 6 components |
| R025 | differentiator | validated | M001/S07 | none | SVG noise overlay + gradient border on KPI cards |
| R026 | differentiator | validated | M001/S07 | none | Space Grotesk + General Sans + JetBrains Mono via CDN |
| R027 | core-capability | validated | M001/S07 | M001/S02 | ThemeToggle with icon morph, persisted dark↔light |
| R028 | differentiator | validated | M001/S07 | M001/S05 | Emerald gradient + progress fill bar on run button |
| R029 | constraint | validated | M001/S08 | none | 4 vanilla files deleted, tw-animate-css removed |
| R030 | quality-attribute | validated | M001/S08 | none | ESLint v9 flat config + Prettier pass clean |
| R031 | quality-attribute | validated | M001/S08 | none | 2 JS chunks (491KB + 49KB), no 500KB warning |
| R032 | launchability | validated | M001/S08 | none | dist/ built, preview serves working SPA |

## Coverage Summary

- Active requirements: 0
- Mapped to slices: 32
- Validated: 32 (R001–R032)
- Unmapped active requirements: 0
- Milestone: M001 complete (2026-03-16)
