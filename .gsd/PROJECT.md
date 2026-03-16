# Project

## What This Is

WheelScan — a browser-based options wheel strategy screener. Scans curated ticker lists against Finnhub/Alpaca/Massive.com APIs, scores each stock for CSP (cash-secured put) suitability using a weighted 6-factor model, and presents results in a sortable dashboard with option chain drill-down.

Currently a vanilla HTML/CSS/JS monolith (~3200 lines across 4 files). Being migrated to React 19 + Vite + TypeScript with a "Financial Terminal Noir" visual redesign.

## Core Value

Full scan flow works end-to-end: enter API keys → select preset → run scan → view scored results → drill into option chain → export CSV. Scoring logic must produce identical outputs to the vanilla app for the same inputs.

## Current State

**M001 complete** (2026-03-16). React migration and visual redesign fully delivered. All 32 requirements validated. Milestone summary at `.gsd/milestones/M001/M001-SUMMARY.md`.

**What exists:**
- React 19 + Vite 7.3 + TypeScript (strict mode) SPA
- Tailwind v4 + shadcn/ui with Financial Terminal Noir oklch theme (dark + light)
- 8 domain TypeScript interfaces in `src/types/index.ts`
- Pure business logic in `src/lib/` — scoring, filtering, formatters, scan orchestrator, chain fetcher, CSV export
- 222 Vitest tests across 12 files — all passing
- 6 Zustand stores with persist middleware for API keys and theme
- Typed API services for Finnhub, Alpaca, Massive.com with token-bucket rate limiting
- TanStack Query v5 — useMutation for scan, useQuery for chains
- CSS Grid dashboard (320px sidebar + fluid main), responsive at 1024px and 640px
- Complete sidebar with ~25 filter controls, 3 presets, 4 weight sliders, API key inputs
- 5-phase scan pipeline with progress bar, cancel, error handling
- 12-column sortable results table with gradient score bars and score tooltips
- 4 KPI summary cards with animated count-up
- 24-column CSV export matching vanilla format
- Option chain modal with Alpaca/Massive provider detection, 12-column put table, rec badges
- Visual polish: font trio, SVG noise overlay, gradient borders, Framer Motion animations
- Theme toggle (dark/light) persisted to localStorage
- ESLint v9 + Prettier — zero errors, all formatted
- ChainModal code-split via React.lazy() — 491KB main + 49KB modal chunks
- Production build serves via `npm run preview`

**Vanilla files removed:** app.js, style.css, base.css, index.vanilla.html, tw-animate-css

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

- ✅ M001: React Migration & Visual Redesign — all 8 slices complete, all 32 requirements validated (2026-03-16)
