---
id: T02
parent: S08
milestone: M001
provides:
  - eslint-v9-flat-config
  - prettier-config
  - codebase-formatted
key_files:
  - eslint.config.mjs
  - .prettierrc
  - package.json
key_decisions:
  - Pinned eslint@^9 because eslint-plugin-react-hooks v7 peer-requires eslint <=9
  - Disabled React Compiler rules (purity, set-state-in-effect, preserve-manual-memoization) — project does not use React Compiler and these produce false positives
  - Simplified StockFiltersSection useMemo deps from 25 granular fields to just `state` to satisfy exhaustive-deps
  - Used `window as unknown as Record<string, unknown>` instead of `as any` for DEV store exposure
patterns_established:
  - ESLint flat config with typescript-eslint + react-hooks + react-refresh + prettier-compat
  - Prettier via .prettierrc with semi, singleQuote, printWidth:80, trailingComma:all
observability_surfaces:
  - "`npx eslint .` — exit 0 = clean, non-zero = errors with file:line detail"
  - "`npx prettier --check .` — reports unformatted files, exit 0 = all formatted"
  - "`npm run lint` — same as eslint, backed by proper TS/React config"
duration: 12m
verification_result: passed
completed_at: 2026-03-16
blocker_discovered: false
---

# T02: Configure ESLint v9 + Prettier for TypeScript/React

**Replaced vanilla JS ESLint config with proper TypeScript/React flat config, installed Prettier, and formatted entire codebase to zero lint errors**

## What Happened

Rewrote `eslint.config.mjs` from a CDN-globals vanilla JS config to a proper ESLint v9 flat config with typescript-eslint, react-hooks, react-refresh, and eslint-config-prettier. Had to pin eslint@^9 because eslint-plugin-react-hooks v7 doesn't support eslint 10 yet. Also had to disable three React Compiler rules (purity, set-state-in-effect, preserve-manual-memoization) that react-hooks v7 introduced — these produce false positives for legitimate patterns since we don't use React Compiler. Created `.prettierrc` with project conventions and formatted the entire codebase. Fixed three `no-explicit-any` violations in App.tsx by using proper type assertion chain. Simplified a 25-field useMemo dep array in StockFiltersSection to just `[state]`.

## Verification

- `npx eslint .` → exit 0, 0 errors (1 harmless react-refresh warning about constant export)
- `npx prettier --check .` → "All matched files use Prettier code style!"
- `npx tsc --noEmit` → 0 errors
- `npx vitest run` → 222 tests pass
- `npm run build` → succeeds (500KB warning expected — T03 will fix with lazy-loading)

### Slice-level checks (T01+T02 cumulative)
- ✅ Vanilla files deleted (4/4)
- ✅ tw-animate-css removed (0 references)
- ✅ ESLint clean (0 errors)
- ✅ Prettier clean (all formatted)
- ✅ TSC clean (0 errors)
- ✅ 222 tests pass
- ⏳ Build chunk splitting (T03)
- ⏳ Preview server (T03)

## Diagnostics

- Run `npx eslint .` to verify lint status. Errors print as `file:line:col  error  message  rule-name`.
- Run `npx prettier --check .` to verify formatting. Lists unformatted file paths on failure.
- Both produce deterministic pass/fail exit codes (0 = clean).

## Deviations

- Pinned eslint@^9 instead of latest (plan said `eslint` unversioned) due to peer dep conflict with react-hooks plugin
- Disabled three React Compiler rules not mentioned in plan — react-hooks v7 includes these by default and they flagged legitimate patterns (Date.now() in render, setState in prop-sync effect, granular useMemo deps)
- Simplified StockFiltersSection useMemo deps from granular 25-field list to `[state]` instead of adding eslint-disable — cleaner and satisfies exhaustive-deps

## Known Issues

- 1 react-refresh warning in ScoringWeightsSection.tsx (exports constant `WEIGHT_KEYS` alongside component) — harmless, not worth splitting into separate file

## Files Created/Modified

- `eslint.config.mjs` — Rewritten: TypeScript/React flat config with 7 plugins/configs
- `.prettierrc` — Created: semi, singleQuote, printWidth:80, trailingComma:all
- `package.json` — 7 new devDependencies (eslint@^9, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, prettier, eslint-config-prettier)
- `src/App.tsx` — Fixed `window as any` → `window as unknown as Record<string, unknown>`
- `src/components/sidebar/StockFiltersSection.tsx` — Simplified useMemo deps to `[state]`
- `src/components/sidebar/ScoringWeightsSection.tsx` — Prettier formatting only
- All `src/**/*.{ts,tsx,css}` files — Prettier formatted
- `IMPLEMENTATION_SPEC.md` — Prettier formatted
- `.gsd/milestones/M001/slices/S08/tasks/T02-PLAN.md` — Added Observability Impact section
