# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| 1 | 2026-03-12 | architecture | State management library | Zustand with persist middleware | Simple API, minimal boilerplate, persist middleware handles localStorage for API keys and theme. 6 stores: filter, results, scan, apiKey, theme, chain. | no |
| 2 | 2026-03-12 | architecture | Server state management | TanStack Query v5 | useMutation for scan flow (progress/cancel), useQuery for option chains. Built-in caching, retry, loading states. | no |
| 3 | 2026-03-12 | architecture | Component library | shadcn/ui with Tailwind v4 | Copy-paste components, full control over styling, CSS variables theming, Radix primitives for accessibility. | no |
| 4 | 2026-03-12 | architecture | Animation library | Framer Motion | AnimatePresence for modal transitions, spring physics for toggles, stagger for page load. | no |
| 5 | 2026-03-12 | scope | Score tooltip style | Numeric breakdown tables, not radar charts | Radar charts are harder to read at tooltip size. Numeric breakdown with score bars is clearer and simpler to implement. | yes |
| 6 | 2026-03-12 | scope | Options data providers | Finnhub + Alpaca + Massive.com (Polygon) | User wants all three. Massive.com free tier has 5 calls/min limit — needs careful rate limiting. | no |
| 7 | 2026-03-12 | quality | Testing strategy | Vitest unit tests for scoring/filtering parity | Critical business logic (scoring weights, filter logic, formatters) must produce identical outputs to vanilla app. Tests catch regressions during migration. | no |
| 8 | 2026-03-12 | architecture | Font hosting | CDN (Google Fonts + Fontshare) | Faster to ship. Self-host later if needed for performance/offline. | yes |
| 9 | 2026-03-12 | deployment | Deploy target | Static SPA (Vite build) | Build outputs static files deployable to Vercel/Netlify/GitHub Pages. No SSR needed. | no |
| 10 | 2026-03-12 | architecture | Migration approach | Ground-up rewrite, not incremental | Vanilla monolith has no module boundaries. Cleaner to extract business logic into typed modules and build new component tree than to incrementally migrate DOM manipulation code. | no |
| 11 | 2026-03-12 | toolchain | Vite + React plugin versions | vite@7.3.1 + @vitejs/plugin-react@5.2.0 | @tailwindcss/vite@4 requires vite 5-7, @vitejs/plugin-react@6 requires vite 8. Using plugin-react@5.2.0 (supports vite 4-8) resolves the conflict. Revisit when @tailwindcss/vite adds vite 8 support. | yes |
| 12 | 2026-03-12 | theming | shadcn/ui CSS variable pattern | theme.css (oklch vars) → index.css (@import chain + @theme inline) | Follows shadcn/ui v4 manual install pattern. Theme vars separated into theme.css for easy palette swapping. All components consume via Tailwind utilities (text-primary, bg-background, etc.). | no |
| 13 | 2026-03-12 | toolchain | Path alias resolution | vite-tsconfig-paths plugin | Reads @/ alias from tsconfig.json, works in both Vite and tsc without duplicating config in resolve.alias. | no |
| 14 | 2026-03-12 | migration | Vanilla index.html preserved | Renamed to index.vanilla.html | Preserves original for reference during extraction tasks. Will be deleted in S08 cleanup. | no |
| 15 | 2026-03-12 | architecture | escapeHtml implementation | String-based replace chain (not DOM) | Must run in Node test environment (Vitest). Produces identical output for all HTML entity cases. | no |
| 16 | 2026-03-12 | architecture | Scoring function purity | New objects returned, no mutation, explicit parameters | computeWheelMetrics takes earningsEntry as param instead of global lookup. All scoring functions return spread copies. Required for React state management and testability. | no |
| 17 | 2026-03-12 | architecture | NaN-sentinel field typing | undefined instead of NaN + isNaN() | TypeScript-idiomatic. FilterState uses `number \| undefined` for optional numeric filters (maxDebtEquity, minNetMargin, etc.). Filter functions guard with `!== undefined`. | no |
