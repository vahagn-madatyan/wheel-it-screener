---
estimated_steps: 5
estimated_files: 8
---

# T01: Scaffold Vite + React 19 + Tailwind v4 + shadcn/ui + Vitest

**Slice:** S01 — Foundation + Business Logic
**Milestone:** M001

## Description

Set up the entire build toolchain: Vite with React 19 and TypeScript, Tailwind v4 via `@tailwindcss/vite` plugin, shadcn/ui manually installed with correct `@import` chain, Financial Terminal Noir theme defined as oklch CSS variables, Vitest integrated through the Vite config, and `@/` path aliases working. The old `index.html` at project root stays untouched — the new React entry point is a separate `index.html` that Vite serves.

## Steps

1. Run `npm create vite@latest . -- --template react-ts` (or manually create project files if the directory isn't empty — scaffold only the src/ folder, new index.html, vite.config.ts, tsconfig files, package.json). Install React 19 (`react@19 react-dom@19`), `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss`, `tw-animate-css`, and `vitest` as dev dependencies.
2. Configure `vite.config.ts`: add `@tailwindcss/vite` plugin, add `tsconfigPaths: true` via `vite-tsconfig-paths` plugin for `@/` path aliases, add Vitest `test` block with `globals: true` and `environment: 'node'`. Configure `tsconfig.json` / `tsconfig.app.json` with `"paths": { "@/*": ["./src/*"] }`, strict mode enabled, target ES2020+.
3. Set up `src/index.css` with the shadcn/ui import chain: `@import "tailwindcss"; @import "tw-animate-css"; @import "./theme.css";`. Create `src/theme.css` with Financial Terminal Noir oklch CSS variables — `:root` and `.dark` blocks mapping all shadcn semantic tokens (background, foreground, primary, secondary, muted, accent, destructive, card, popover, border, input, ring, sidebar-*) to the noir palette. Primary emerald → oklch(~0.76 0.18 163). Background near-black → oklch(~0.15 0.02 260). Use `.dark` as default class on `<html>`.
4. Create `src/main.tsx` (renders `<App />` into `#root`), `src/App.tsx` (minimal component with a themed heading to verify Tailwind works — e.g. `<h1 className="text-primary">WheelScan</h1>`), and a new `index.html` at project root for Vite (the old vanilla `index.html` will be renamed or handled in S08).
5. Verify the scaffold: `npm run dev` starts, `npx tsc --noEmit` passes, `npx vitest run` executes successfully (even with 0 tests).

## Must-Haves

- [ ] Vite dev server starts and serves the React app
- [ ] TypeScript strict mode enabled, `npx tsc --noEmit` clean
- [ ] `@/` path aliases resolve correctly in both TypeScript and Vite
- [ ] Tailwind v4 processes CSS (utility classes render in browser)
- [ ] shadcn/ui CSS imports present (`tailwindcss`, `tw-animate-css`)
- [ ] Financial Terminal Noir oklch CSS variables defined for all shadcn semantic tokens
- [ ] `.dark` class on `<html>` by default
- [ ] Vitest runs via `npx vitest run` without errors

## Verification

- `npm run dev` starts without errors (check stdout for "Local:" URL)
- `npx tsc --noEmit` exits with code 0
- `npx vitest run` exits without crash (0 tests OK or no test suites is fine)

## Inputs

- Vanilla `app.js`, `style.css`, `base.css`, `index.html` — existing files to preserve (not modify)
- S01-RESEARCH.md — shadcn/ui manual install pattern, oklch color notes, Vitest config approach

## Expected Output

- `package.json` — all dependencies installed
- `vite.config.ts` — Vite + Tailwind + tsconfig paths + Vitest
- `tsconfig.json`, `tsconfig.app.json` — strict mode + path aliases
- `src/index.css` — Tailwind + shadcn/ui import chain
- `src/theme.css` — Financial Terminal Noir oklch CSS variables
- `src/main.tsx` — React 19 entry point
- `src/App.tsx` — minimal themed component
- `index.html` — new Vite entry point (old vanilla index.html moved aside if needed)
