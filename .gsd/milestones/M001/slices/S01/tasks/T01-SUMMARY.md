---
id: T01
parent: S01
milestone: M001
provides:
  - Vite + React 19 + TypeScript dev environment
  - Tailwind v4 with shadcn/ui CSS variable chain
  - Financial Terminal Noir theme (oklch)
  - Vitest test runner
  - "@/" path aliases
key_files:
  - vite.config.ts
  - tsconfig.app.json
  - src/index.css
  - src/theme.css
  - src/main.tsx
  - src/App.tsx
  - index.html
key_decisions:
  - "Pinned vite@7.3.1 + @vitejs/plugin-react@5.2.0 to satisfy @tailwindcss/vite peer dep (vite 5-7) alongside React plugin (vite 4-8)"
  - "Renamed vanilla index.html to index.vanilla.html rather than deleting — preserves original for reference in later extraction tasks"
  - "Used vite-tsconfig-paths plugin for @/ alias resolution instead of manual Vite resolve.alias — reads from tsconfig.json, works in both Vite and tsc"
  - "Dark mode as default via class='dark' on <html> — Financial Terminal Noir is a dark-first theme"
patterns_established:
  - "shadcn/ui CSS variable pattern: theme.css (oklch vars) → index.css (@import chain + @theme inline + @custom-variant dark) → components consume via Tailwind utility classes"
  - "Test location: src/__tests__/ directory"
observability_surfaces:
  - none
duration: ~8min
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T01: Scaffold Vite + React 19 + Tailwind v4 + shadcn/ui + Vitest

**Scaffolded complete Vite dev environment with React 19, Tailwind v4 + shadcn/ui theming (Financial Terminal Noir oklch palette), and Vitest — all three verification commands pass clean.**

## What Happened

Created the project scaffold from scratch in a directory containing existing vanilla files (app.js, style.css, base.css, index.html). Renamed the vanilla `index.html` to `index.vanilla.html` to avoid conflict with Vite's entry point.

Installed React 19, Vite 7.3.1, @vitejs/plugin-react 5.2.0, Tailwind v4 with @tailwindcss/vite, tw-animate-css, Vitest, and vite-tsconfig-paths. Had to resolve a peer dependency conflict: @tailwindcss/vite requires vite 5-7 while @vitejs/plugin-react@6 requires vite 8. Solution: pin @vitejs/plugin-react@5.2.0 which supports vite 4-8.

Built the Financial Terminal Noir theme as oklch CSS variables covering all shadcn semantic tokens (background, foreground, primary, secondary, muted, accent, destructive, card, popover, border, input, ring, sidebar-*, chart-*). Primary emerald at oklch(0.76 0.18 163), near-black background at oklch(0.14 0.02 260). Both `:root` (light) and `.dark` (dark) blocks defined, with `.dark` as default.

The CSS import chain follows shadcn/ui v4 manual install pattern: `@import "tailwindcss" → @import "tw-animate-css" → @import "./theme.css"`, plus `@theme inline` block mapping all CSS vars to Tailwind colors, `@custom-variant dark`, and base layer styles.

## Verification

- `npx tsc --noEmit` — exits 0, zero errors (TypeScript strict mode enabled)
- `npx vitest run` — 1 test file, 1 test passed
- `npm run dev` — Vite dev server starts on localhost:5173
- Browser: "WheelScan" renders in emerald primary color (oklch 0.76 0.18 163), dark background visible, `html.dark` class present
- Browser: `text-primary`, `text-muted-foreground`, `bg-background` Tailwind utilities all resolve to correct oklch values
- `@/` path alias: `src/main.tsx` imports `@/App` successfully — resolved by both tsc and Vite

### Slice-level verification (partial — T01 is first of 5 tasks):
- ✅ `npm run dev` — Vite dev server starts without errors
- ✅ `npx tsc --noEmit` — zero TypeScript errors
- ✅ `npx vitest run` — passes (1 placeholder test; parity tests come in T04/T05)

## Diagnostics

None — scaffold task, no runtime behavior to observe.

## Deviations

- Renamed `index.html` → `index.vanilla.html` instead of "handling in S08" as the plan suggested. The rename was necessary now because Vite requires `index.html` at project root.
- Added `src/__tests__/setup.test.ts` placeholder test — Vitest exits 1 with zero test files, so a minimal test was needed to pass the verification check.

## Known Issues

- A transient 404 on initial browser load (favicon.ico) — cosmetic, no impact.

## Files Created/Modified

- `package.json` — project manifest with all dependencies and scripts
- `vite.config.ts` — Vite + React + Tailwind + tsconfig-paths + Vitest config
- `tsconfig.json` — project references (app + node)
- `tsconfig.app.json` — strict TypeScript config with `@/*` path aliases
- `tsconfig.node.json` — TypeScript config for vite.config.ts
- `src/index.css` — Tailwind + shadcn/ui import chain + @theme inline + base layer
- `src/theme.css` — Financial Terminal Noir oklch CSS variables (all shadcn semantic tokens)
- `src/main.tsx` — React 19 entry point rendering App into #root
- `src/App.tsx` — minimal themed component verifying Tailwind works
- `src/vite-env.d.ts` — Vite client type reference
- `src/__tests__/setup.test.ts` — placeholder test for Vitest verification
- `index.html` — new Vite entry point with `class="dark"` on html element
- `index.vanilla.html` — renamed original vanilla index.html (preserved)
