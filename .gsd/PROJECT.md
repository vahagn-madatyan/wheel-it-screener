# Project

## What This Is

WheelScan — a browser-based options wheel strategy screener. Scans curated ticker lists against Finnhub/Alpaca/Massive.com APIs, scores each stock for CSP (cash-secured put) suitability using a weighted 6-factor model, and presents results in a sortable dashboard with option chain drill-down.

## Core Value

Full scan flow works end-to-end: enter API keys → select preset → run scan → view scored results → drill into option chain → export CSV. Scoring logic must produce identical outputs to the vanilla app for the same inputs.

## Current State

**M001 complete** (2026-03-16). React migration and visual redesign fully delivered. All 32 requirements validated.

**M002 complete** (2026-03-16). PR review fixes — 21 recommendations addressed: market cap unit fix, error visibility, type safety (discriminated union ChainParams), React Error Boundary, sessionStorage for API keys, scan phase labels, failed ticker surfacing, dead code cleanup. 227 tests passing.

**M003-8nlgd1 in progress** (2026-03-16). S01 complete — corrected 6 preset numeric values per Issue-Fix.csv audit (R033–R037 validated). 233 tests passing. S02 (sector exclusion refinement) pending.

**What exists:**
- React 19 + Vite 7.3 + TypeScript (strict mode) SPA
- Tailwind v4 + shadcn/ui with Financial Terminal Noir oklch theme (dark + light)
- Pure business logic in `src/lib/` — scoring, filtering, formatters, scan orchestrator, chain fetcher, CSV export
- 227 Vitest tests across 12 files — all passing
- 6 Zustand stores with persist middleware (sessionStorage for API keys, localStorage for theme)
- Typed API services for Finnhub, Alpaca, Massive.com with token-bucket rate limiting
- TanStack Query v5 — useMutation for scan, useQuery for chains
- 3 filter presets (Finviz Cut 2, Conservative, Aggressive) with ~25 filter controls
- React Error Boundary, ScanWarnings component, scan phase labels in ProgressBar
- ESLint v9 + Prettier — zero errors, all formatted
- Production build via `npm run build` → static dist/

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
- Discriminated union for ChainParams (alpaca | massive)

**Design system:**
- Fonts: Space Grotesk (display), General Sans (body), JetBrains Mono (data) via CDN
- Colors: emerald #34d399 primary, cool near-blacks hsl(220,14%,5%) base
- Noise texture overlay, gradient borders, backdrop blur on modals

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- ✅ M001: React Migration & Visual Redesign — all 8 slices complete, all 32 requirements validated
- ✅ M002: PR Review Fixes — 5 slices, 21 review recommendations addressed, 227 tests
- [ ] M003-8nlgd1: Filter Preset Tuning & Sector Exclusion Audit — S01 complete (preset values corrected), S02 pending (sector exclusion refinement)
