# M001: React Migration & Visual Redesign

**Vision:** Rewrite WheelScan from a vanilla JS monolith to a React 19 + TypeScript SPA with a premium Financial Terminal Noir aesthetic, preserving all business logic with verified parity.

## Success Criteria

- Full scan flow works end-to-end: API keys → preset → scan → scored results → chain modal → CSV export
- Wheel scores and put scores match vanilla app for identical inputs (verified by Vitest)
- All 3 filter presets produce correct filter values
- Responsive at 1024px (sidebar collapse) and 640px (stack) breakpoints
- Dark + light themes render correctly across all views
- Static build produces deployable SPA (`npm run build` → dist/)

## Key Risks / Unknowns

- Scoring parity — vanilla JS uses loose comparisons, implicit coercion, and mutation patterns that could produce subtle differences under TypeScript strict mode
- Massive.com rate limiting — 5 calls/min on free tier is very restrictive for fetching option chains across multiple expirations
- shadcn/ui + Tailwind v4 compatibility — relatively new combination, some components may need CSS tweaks

## Proof Strategy

- Scoring parity → retire in S01 by proving Vitest tests pass for wheelScore and putScore with known inputs producing identical outputs to vanilla app
- Massive.com rate limiting → retire in S06 by proving chain modal loads with rate-limited Massive.com API and shows clear feedback during waits
- shadcn/ui + Tailwind v4 → retire in S03 by proving layout shell renders correctly with shadcn/ui components and Tailwind v4 theme

## Verification Classes

- Contract verification: Vitest unit tests for scoring, filtering, formatters, OCC parser
- Integration verification: Full scan with real Finnhub API key producing results
- Operational verification: Static build deploys and works without dev server
- UAT / human verification: Visual design matches Financial Terminal Noir spec, animations feel premium

## Milestone Definition of Done

This milestone is complete only when all are true:

- All 8 slice deliverables are complete and verified
- Full scan flow works with real API key (Finnhub minimum)
- Scoring parity tests pass
- All 3 presets produce correct filter values
- Responsive breakpoints work (1024px, 640px)
- Dark + light themes render correctly
- Option chain modal loads and displays put scores
- Static build (`npm run build`) produces working SPA
- Old vanilla files removed (app.js, style.css, base.css, index.html)

## Requirement Coverage

- Covers: R001–R032 (all active requirements)
- Partially covers: none
- Leaves for later: none
- Orphan risks: none

## Slices

- [x] **S01: Foundation + Business Logic** `risk:medium` `depends:[]`
  > After this: Vite dev server runs, TypeScript types defined, all scoring/filtering logic extracted as pure functions, Vitest tests pass proving parity with vanilla app
- [x] **S02: State Management + API Services** `risk:medium` `depends:[S01]`
  > After this: 6 Zustand stores created with correct shapes, API key store persists to localStorage, Finnhub/Alpaca/Massive.com typed service clients exist, token-bucket rate limiter works, TanStack Query provider wired
- [x] **S03: Layout Shell** `risk:low` `depends:[S01]`
  > After this: CSS Grid dashboard renders with 320px sidebar + fluid main, sidebar sections collapse via Radix, responsive breakpoints work at 1024px and 640px, Financial Terminal Noir base theme visible
- [x] **S04: Sidebar Controls** `risk:medium` `depends:[S02,S03]`
  > After this: All filter inputs render in sidebar, bound to filterStore, presets switch all values, weight sliders work with sum constraint, API key inputs with masked fields and status badges
- [x] **S05: Results + Scan Flow** `risk:high` `depends:[S04]`
  > After this: Run button triggers full scan via Finnhub API, progress bar shows ticker-by-ticker progress, KPI cards animate on completion, results table populates with sorted/scored data, wheel score tooltips show breakdown, CSV export works
- [ ] **S06: Option Chain Modal** `risk:medium-high` `depends:[S05]`
  > After this: Clicking Puts on a result row opens chain modal, option chain loads from Finnhub or Massive.com, put scores with 5-component tooltips and rec badges display correctly
- [ ] **S07: Visual Polish + Animation** `risk:low` `depends:[S06]`
  > After this: Framer Motion animations active (page staggers, toggle springs, modal transitions), noise texture overlay on backgrounds, gradient borders on cards, font trio loaded, theme toggle with icon morph, run button gradient with progress fill
- [ ] **S08: Cleanup + Deploy** `risk:low` `depends:[S07]`
  > After this: Old vanilla files removed, ESLint + Prettier configured, ChainModal lazy-loaded, `npm run build` produces static SPA, bundle size checked

## Boundary Map

### S01 → S02

Produces:
- TypeScript interfaces: `StockResult`, `PutOption`, `FilterState`, `ScanProgress`, `ChainData`, `ApiKeys`, `WeightConfig`, `Preset`
- Pure functions: `calculateWheelScore()`, `calculatePutScore()`, `filterStocks()`, `formatNum()`, `parseOccSymbol()`
- Ticker lists: `WHEEL_POPULAR`, `SP500_TOP`, `HIGH_DIVIDEND` as typed constants
- Preset configs: `PRESETS` record with filter values for each preset

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Vite + React 19 + TypeScript project scaffold with path aliases
- Tailwind v4 + shadcn/ui initialized with Financial Terminal Noir CSS variables
- App shell component (`App.tsx`) with providers

Consumes:
- nothing (first slice)

### S02 → S04

Produces:
- `useFilterStore` — filter state + actions (setFilter, resetFilters, applyPreset)
- `useApiKeyStore` — API keys + validation status, persisted to localStorage
- `useScanStore` — scan progress state (running, progress, currentTicker, error)
- `useThemeStore` — dark/light theme, persisted to localStorage

Consumes:
- TypeScript interfaces from S01

### S03 → S04

Produces:
- `DashboardLayout` component with sidebar slot and main slot
- `Sidebar` component with collapsible section containers
- Responsive shell with breakpoint behavior

Consumes:
- Vite scaffold and theme from S01

### S04 → S05

Produces:
- Fully wired sidebar: filter controls, presets, weight sliders, API key inputs all connected to stores
- Filter state ready for scan consumption
- API keys available for service calls

Consumes:
- Stores from S02, layout from S03

### S05 → S06

Produces:
- `ResultsTable` component with row click handler for chain drill-down
- `useResultsStore` with scored results available for chain lookup
- Scan flow proven working with real API data
- Score tooltip pattern (Radix Popover + numeric breakdown) established

Consumes:
- Sidebar controls from S04

### S06 → S07

Produces:
- `ChainModal` component with full put scoring table
- All functional components complete — ready for animation layer
- All interactive patterns established (modals, tooltips, toggles)

Consumes:
- Results table from S05

### S07 → S08

Produces:
- All visual polish applied — animations, textures, fonts, theme toggle
- Complete app ready for cleanup and optimization

Consumes:
- Chain modal from S06
