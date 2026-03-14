# M001: React Migration & Visual Redesign — Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

## Project Description

WheelScan is a browser-based options wheel strategy screener. It scans curated ticker lists against financial APIs, scores stocks for cash-secured put suitability, and presents results in a sortable dashboard with option chain drill-down.

## Why This Milestone

The current vanilla HTML/CSS/JS monolith (app.js: 1334 lines, style.css: 1385 lines) has no module boundaries, no types, no tests, and tightly coupled DOM manipulation with business logic. Adding features (new filters, new API providers, responsive design) is increasingly fragile.

Migrating to React 19 + TypeScript gives us typed interfaces, component composition, testable pure functions, and a modern toolchain. The visual redesign to "Financial Terminal Noir" creates a premium aesthetic fitting the financial data domain.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open the app in a browser, enter API keys for Finnhub/Alpaca/Massive.com, select a filter preset, and run a full scan
- View scored results in a sortable table with gradient score bars and numeric score tooltips
- Click into any result to see the option chain with put scores and recommendation badges
- Export results to CSV
- Toggle between dark and light themes
- Use the app on tablet-sized screens with responsive layout

### Entry point / environment

- Entry point: `http://localhost:5173` (dev) or static `dist/` folder (deploy)
- Environment: browser (Chrome/Firefox/Safari, desktop primary, tablet secondary)
- Live dependencies involved: Finnhub API, Alpaca API, Massive.com/Polygon API (all via browser fetch, no backend)

## Completion Class

- Contract complete means: All Vitest tests pass for scoring/filtering parity, all 32 requirements addressed
- Integration complete means: Full scan flow works with real Finnhub API key, option chain loads with real data
- Operational complete means: Static build deploys and works without dev server

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Full scan with Finnhub API key produces scored results matching vanilla app output for same tickers
- Option chain modal loads and displays put scores with correct 5-component breakdown
- All 3 presets produce correct filter values and scan results reflect those filters
- Dark and light themes render correctly across all views
- Static build (`npm run build`) produces working SPA

## Risks and Unknowns

- Massive.com free tier (5 calls/min) may be too slow for reasonable UX — mitigated by clear rate-limit feedback and queuing
- Scoring weight edge cases — vanilla JS uses loose comparisons and implicit coercion in places; TypeScript strict mode may surface subtle differences — mitigated by parity tests
- shadcn/ui + Tailwind v4 is relatively new — some components may need CSS adjustments

## Existing Codebase / Prior Art

- `app.js` — All business logic (scoring, filtering, API calls, rate limiting), DOM rendering, event handlers. Source of truth for parity.
- `style.css` — Complete visual design. Reference for layout structure, but being replaced with new design system.
- `index.html` — Dashboard layout structure. Reference for component hierarchy.
- `base.css` — CSS reset. Being replaced by Tailwind's preflight.
- `spec.md` — Detailed migration specification with component tree, store shapes, color system
- `IMPLEMENTATION_SPEC.md` — Massive.com option chain integration specification
- `STRATEGY_FILTERS.md` — New strategy filters (D/E, net margin, sales growth, ROE, sector exclusion) and score tooltip spec

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001–R005 — Foundation, types, business logic, tests (S01)
- R006–R008 — State management, API services, TanStack Query (S02)
- R009–R011 — Layout shell, sidebar, responsive (S03)
- R012–R015 — Sidebar controls, presets, sliders (S04)
- R016–R020 — Results table, KPIs, scan flow, CSV export (S05)
- R021–R023 — Option chain modal, put scoring, Massive.com (S06)
- R024–R028 — Animations, polish, fonts, theme toggle (S07)
- R029–R032 — Cleanup, linting, optimization, deploy build (S08)

## Scope

### In Scope

- Complete React 19 + TypeScript rewrite of all app functionality
- Financial Terminal Noir visual redesign (dark-first, emerald primary)
- 3 API provider integrations (Finnhub, Alpaca, Massive.com)
- New strategy filters (D/E ratio, net margin, sales growth, ROE, sector exclusion)
- Filter presets (Finviz Cut 2, Conservative, Aggressive)
- Responsive layout (desktop, tablet)
- Unit tests for scoring/filtering parity
- Static SPA build

### Out of Scope / Non-Goals

- Server-side rendering or backend
- Mobile-native experience (responsive but not mobile-first)
- Real-time streaming data / WebSocket connections
- User accounts or authentication
- Database persistence (localStorage only)
- Self-hosted fonts (CDN for now, Decision #8)
- E2E / integration tests (unit tests for business logic only)

## Technical Constraints

- Browser-only — all API calls via fetch, no backend proxy
- API keys stored in localStorage (no server-side key management)
- Massive.com free tier: 5 API calls/minute hard limit
- Must work in Chrome, Firefox, Safari (modern versions)

## Integration Points

- Finnhub API — stock quotes, option chains, company profiles, earnings calendar
- Alpaca API — real-time quotes (alternative data source)
- Massive.com / Polygon.io API — option chain data (secondary provider)

## Open Questions

- None remaining — all clarified during discussion
