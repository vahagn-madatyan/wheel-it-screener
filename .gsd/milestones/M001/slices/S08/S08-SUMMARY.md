---
id: S08
parent: M001
milestone: M001
provides:
  - vanilla-files-deleted
  - tw-animate-css-removed
  - eslint-v9-flat-config
  - prettier-config
  - codebase-formatted
  - chainmodal-lazy-loaded
  - production-build-verified
  - prettierignore-config
requires:
  - slice: S07
    provides: complete-app-with-visual-polish
affects: []
key_files:
  - eslint.config.mjs
  - .prettierrc
  - .prettierignore
  - src/App.tsx
  - src/components/main/ChainModal.tsx
  - src/components/ui/tooltip.tsx
  - src/index.css
key_decisions:
  - "Decision #36: Tooltip animation via pure CSS transitions + data-[state] selectors, replacing tw-animate-css keyframes"
  - "Decision #37: eslint@^9 pinned — react-hooks v7 doesn't support eslint 10 yet"
  - "Decision #38: React Compiler lint rules (purity, set-state-in-effect, preserve-manual-memoization) disabled — false positives without React Compiler"
  - "Decision #39: ChainModal code-split via React.lazy + Suspense — main chunk 491KB (under 500KB threshold)"
  - "Decision #40: .prettierignore excludes .gsd/ and .bg-shell/ agent metadata from formatting checks"
patterns_established:
  - "ESLint v9 flat config: typescript-eslint + react-hooks + react-refresh + eslint-config-prettier"
  - "Prettier via .prettierrc: semi, singleQuote, printWidth:80, trailingComma:all"
  - "React.lazy() + Suspense fallback={null} for code-splitting heavy modals that manage their own loading state"
  - "transition-[opacity,transform] with data-[state=open/closed] selectors for Radix UI animation (no tw-animate-css)"
observability_surfaces:
  - "`npx eslint .` — exit 0 = clean codebase, non-zero = errors with file:line detail"
  - "`npx prettier --check .` — reports unformatted files, exit 0 = all formatted"
  - "`npm run build` — prints per-chunk sizes; verify no '500 kB' warning"
  - "`npm run preview` — serves static SPA at localhost:4173 for visual verification"
drill_down_paths:
  - .gsd/milestones/M001/slices/S08/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S08/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S08/tasks/T03-SUMMARY.md
duration: 22m
verification_result: passed
completed_at: 2026-03-16
---

# S08: Cleanup + Deploy

**Removed all vanilla legacy files, configured ESLint v9 + Prettier for TypeScript/React, code-split ChainModal to bring main chunk under 500KB, and verified production build produces a deployable static SPA.**

## What Happened

Three tasks shipped the final cleanup and deployment readiness for the React migration:

**T01 — Legacy removal.** Deleted the 4 vanilla files (app.js 55KB, style.css 29KB, base.css 2KB, index.vanilla.html 24KB) that had been preserved as reference during migration. Fully removed the tw-animate-css dependency — uninstalled the package, removed the CSS import, and replaced its keyframe animation classes in tooltip.tsx with pure CSS transitions using `transition-[opacity,transform]` with `data-[state=open/closed]` modifiers. The slide-in-from-* directional classes were also tw-animate-css utilities and were dropped as unnecessary.

**T02 — Code quality tooling.** Rewrote the eslint.config.mjs from a vanilla JS config (with CDN globals) into a proper ESLint v9 flat config with typescript-eslint, react-hooks, react-refresh, and eslint-config-prettier. Had to pin eslint@^9 due to react-hooks v7 peer dep conflict, and disabled three React Compiler rules that react-hooks v7 now bundles by default (they produce false positives without React Compiler). Created .prettierrc and formatted the entire codebase. Fixed three `no-explicit-any` violations in App.tsx and simplified a 25-field useMemo dependency array in StockFiltersSection to just `[state]`.

**T03 — Code splitting + production build.** Added a default export to ChainModal.tsx and converted the static import in App.tsx to `React.lazy()` with a `Suspense` wrapper. This split the 539KB monolithic bundle into a 491KB main chunk + 49KB ChainModal chunk, eliminating the Vite 500KB warning. Added .prettierignore for .gsd/ and .bg-shell/ agent metadata directories. Verified the static build serves correctly via `npm run preview`.

## Verification

All 8 slice-level checks pass:

| Check | Result |
|-------|--------|
| `ls app.js style.css base.css index.vanilla.html` → 4 "No such file" | ✅ |
| `grep -c "tw-animate-css" package.json src/index.css` → 0 | ✅ |
| `npx eslint .` → 0 errors | ✅ |
| `npx prettier --check .` → all formatted | ✅ |
| `npx tsc --noEmit` → 0 errors | ✅ |
| `npx vitest run` → 222 tests pass | ✅ |
| `npm run build` → 2 JS chunks (491KB + 49KB), no 500KB warning | ✅ |
| `npm run preview` → serves SPA at localhost:4173 | ✅ |

## Requirements Advanced

- R029 — All 4 vanilla files deleted (app.js, style.css, base.css, index.vanilla.html)
- R030 — ESLint v9 flat config + Prettier installed and passing clean on entire codebase
- R031 — ChainModal lazy-loaded, build produces 2 JS chunks, main chunk 491KB (under 500KB)
- R032 — `npm run build` produces static dist/ with correct asset paths, preview server confirms SPA works

## Requirements Validated

- R029 — `ls` confirms all 4 files deleted; `grep` confirms zero tw-animate-css references
- R030 — `npx eslint .` exits 0, `npx prettier --check .` reports all files formatted
- R031 — Build output shows 2 chunks (491KB + 49KB), no 500KB Vite warning
- R032 — `npm run build` succeeds, `npm run preview` serves working SPA at localhost:4173

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- T01 removed slide-in-from-* directional classes from tooltip.tsx in addition to the animate-in/out classes called out in the plan — these were also tw-animate-css utilities with no pure Tailwind equivalent, and the tooltip works cleanly without them.
- T02 pinned eslint@^9 instead of unversioned eslint due to react-hooks v7 peer dep conflict. Also disabled three React Compiler lint rules not mentioned in the plan.
- T03 added .prettierignore (not in plan) to exclude .gsd/ and .bg-shell/ metadata from Prettier checks.

## Known Limitations

- 1 react-refresh warning in ScoringWeightsSection.tsx — exports constant `WEIGHT_KEYS` alongside component. Harmless, not worth splitting into a separate file.
- Main chunk is 491KB (gzipped 158KB). Close to the 500KB threshold. Adding significant new dependencies to the main bundle could push it over.
- Fonts loaded from CDN (Google Fonts + Fontshare). Self-hosting would improve offline support and reduce external dependencies.

## Follow-ups

- none — this is the final slice of M001.

## Files Created/Modified

- `app.js` — deleted (55KB vanilla JS monolith)
- `style.css` — deleted (29KB vanilla CSS)
- `base.css` — deleted (2KB vanilla CSS reset)
- `index.vanilla.html` — deleted (24KB vanilla layout reference)
- `src/index.css` — removed `@import "tw-animate-css"` line
- `src/components/ui/tooltip.tsx` — replaced tw-animate-css classes with pure CSS transitions
- `eslint.config.mjs` — rewritten as ESLint v9 flat config for TypeScript/React
- `.prettierrc` — created with project formatting conventions
- `.prettierignore` — created to exclude agent metadata directories
- `package.json` — tw-animate-css removed, 7 devDeps added (eslint, prettier, plugins)
- `src/App.tsx` — ChainModal lazy-loaded via React.lazy() + Suspense; fixed no-explicit-any
- `src/components/main/ChainModal.tsx` — added default export for lazy loading
- `src/components/sidebar/StockFiltersSection.tsx` — simplified useMemo deps to `[state]`

## Forward Intelligence

### What the next slice should know
- M001 is complete. All 32 requirements validated. The app is a fully working React 19 + TypeScript SPA with production build.
- The codebase has ESLint + Prettier configured — any new code should pass both automatically.
- The build produces 2 JS chunks. Any new heavy component should follow the React.lazy() pattern established here.

### What's fragile
- Main chunk at 491KB is close to the 500KB Vite warning threshold. Adding large dependencies (charting libraries, new UI component suites) to the main bundle will likely trigger it. Use React.lazy() for anything substantial.
- eslint@^9 pin is a temporary constraint — react-hooks v7 doesn't support eslint 10 yet. When it does, the pin can be relaxed.

### Authoritative diagnostics
- `npm run build` output — the single most trustworthy signal. Shows exact chunk sizes, warns on threshold violations, and fails on TypeScript errors.
- `npx vitest run` — 222 tests across 12 files covering all business logic parity. If these pass, scoring/filtering behavior matches the vanilla app.

### What assumptions changed
- Plan assumed tw-animate-css removal was limited to two class strings in tooltip.tsx. In reality, the adjacent line also had tw-animate-css utilities (slide-in-from-*) that needed removal.
- Plan assumed eslint latest would work. eslint 10 conflicts with react-hooks v7, requiring a ^9 pin.
