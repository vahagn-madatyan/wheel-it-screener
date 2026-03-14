# Project

## What This Is

WheelScan — a browser-based options wheel strategy screener. Scans curated ticker lists against Finnhub/Alpaca/Massive.com APIs, scores each stock for CSP (cash-secured put) suitability using a weighted 6-factor model, and presents results in a sortable dashboard with option chain drill-down.

Currently a vanilla HTML/CSS/JS monolith (~3200 lines across 4 files). Being migrated to React 19 + Vite + TypeScript with a "Financial Terminal Noir" visual redesign.

## Core Value

Full scan flow works end-to-end: enter API keys → select preset → run scan → view scored results → drill into option chain → export CSV. Scoring logic must produce identical outputs to the vanilla app for the same inputs.

## Current State

Migration in progress on `ui-improve` branch. S01 (Foundation + Business Logic) is complete.

**What exists now:**
- Vite + React 19 + TypeScript project scaffold with dev server on localhost:5173
- Tailwind v4 + shadcn/ui with Financial Terminal Noir oklch theme (dark + light)
- All 8 domain TypeScript interfaces in `src/types/index.ts`
- All business logic extracted as pure functions in `src/lib/` — scoring, filtering, formatters, utilities, constants
- 128 Vitest parity tests proving scoring/filtering matches vanilla app
- Minimal App shell (placeholder — layout comes in S03)

**Vanilla files (still present, to be removed in S08):**
- `app.js` — 1334-line monolith (source for logic extraction)
- `style.css` — 1385 lines of hand-written CSS
- `base.css` — 65 lines of reset/base styles
- `index.vanilla.html` — renamed original entry point (preserved for reference)

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

- 🔄 M001: React Migration & Visual Redesign — S01 complete (foundation + business logic), S02 next (state management + API services)
