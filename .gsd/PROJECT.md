# Project

## What This Is

WheelScan — a browser-based options wheel strategy screener. Scans curated ticker lists against Finnhub/Alpaca/Massive.com APIs, scores each stock for CSP (cash-secured put) suitability using a weighted 6-factor model, and presents results in a sortable dashboard with option chain drill-down.

Currently a vanilla HTML/CSS/JS monolith (~3200 lines across 4 files). Being migrated to React 19 + Vite + TypeScript with a "Financial Terminal Noir" visual redesign.

## Core Value

Full scan flow works end-to-end: enter API keys → select preset → run scan → view scored results → drill into option chain → export CSV. Scoring logic must produce identical outputs to the vanilla app for the same inputs.

## Current State

Migration complete on `ui-improve` branch. All 8 slices (S01–S08) shipped. All 32 requirements validated.

**What exists now:**
- Vite + React 19 + TypeScript project scaffold with dev server on localhost:5173
- Tailwind v4 + shadcn/ui with Financial Terminal Noir oklch theme (dark + light)
- All 8 domain TypeScript interfaces in `src/types/index.ts`
- All business logic extracted as pure functions in `src/lib/` — scoring, filtering, formatters, utilities, constants, chain fetchers
- 222 Vitest tests (parity + stores + services + weight redistribution + CSV export + chain fetcher) all passing
- 6 Zustand stores (filter, results, scan, apiKey w/ persist, theme w/ persist, chain w/ modal control)
- Typed API services for Finnhub, Alpaca, Massive.com with token-bucket rate limiting
- TanStack Query v5 — useMutation for scan flow, useQuery for chain data
- CSS Grid dashboard layout with 320px collapsible sidebar, hamburger overlay on mobile, responsive breakpoints at 1024px and 640px
- Complete sidebar with all ~25 filter controls bound to stores — presets, weight sliders, API key inputs, toggles, dropdowns, numeric fields
- Run Screener button triggers 5-phase Finnhub scan with progress bar, cancel support, and inline error handling
- 12-column sortable results table with gradient score bars, SMA/earnings badges, and score tooltips
- 4 KPI summary cards with animated count-up (Tickers Scanned, Qualified, Avg Score, Avg Premium)
- 24-column CSV export matching vanilla format with timestamped filename
- Empty state for pre-scan and zero-results scenarios
- Option chain modal: Puts button → Radix Dialog with 12-column put table, 5-component score tooltips, rec badges, Alpaca/Massive provider detection, expiry auto-select
- Visual polish complete: font trio (Space Grotesk, General Sans, JetBrains Mono), SVG noise texture overlay, gradient borders on KPI cards
- Framer Motion animations: KPI stagger, table row stagger, dialog spring slide-up, ProgressBar/EmptyState AnimatePresence fades, ThemeToggle icon morph
- Theme toggle with Sun/Moon icon in header, persisted to localStorage
- Run button emerald gradient with progress fill during scan
- ESLint v9 flat config (typescript-eslint + react-hooks + react-refresh + eslint-config-prettier) — zero errors
- Prettier configured (.prettierrc) — entire codebase formatted
- ChainModal lazy-loaded via React.lazy() + Suspense — code-split into separate chunk
- Production build: 491KB main + 49KB ChainModal chunks (158KB gzipped total)
- Static dist/ serves correctly via `npm run preview`

**Vanilla files removed:**
- app.js, style.css, base.css, index.vanilla.html — all deleted
- tw-animate-css dependency removed

## Architecture / Key Patterns

**Target stack:**
- React 19 + Vite + TypeScript
- Tailwind CSS v4 + shadcn/ui (CSS variables theming)
- Zustand (6 stores, persist middleware for keys/theme)
- TanStack Query v5 (mutations for scan, queries for chains)
- Framer Motion (page staggers, modal transitions, toggle morphs)

**Key patterns:**
- Pure business logic in `src/lib/` — scoring, filtering, formatters, ticker lists, OCC parser
- Typed API services in `src/services/` — Finnhub, Alpaca, Massive.com with token-bucket rate limiter
- Store layer in `src/stores/` — filter, results, scan, apiKey (persisted), theme (persisted), chain
- Component tree: Layout → Sidebar + Main → KPIs + ResultsTable + ChainModal
- Dark-mode-first with light theme toggle

**Design system:**
- Fonts: Space Grotesk (display), General Sans (body), JetBrains Mono (data) via CDN
- Colors: emerald #34d399 primary, cool near-blacks hsl(220,14%,5%) base
- Noise texture overlay, gradient borders, backdrop blur on modals

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- ✅ M001: React Migration & Visual Redesign — all 8 slices complete, all 32 requirements validated
