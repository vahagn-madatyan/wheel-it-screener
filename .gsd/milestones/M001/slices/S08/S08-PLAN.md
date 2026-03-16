# S08: Cleanup + Deploy

**Goal:** Old vanilla files removed, ESLint + Prettier configured for TS/React, ChainModal lazy-loaded for code splitting, `npm run build` produces a static SPA under the 500KB chunk warning threshold.
**Demo:** `ls app.js style.css base.css index.vanilla.html` → all "No such file". `npx eslint . && npx prettier --check .` → zero errors. `npm run build` → 2+ JS chunks, main chunk <500KB. `npm run preview` → SPA loads at localhost:4173.

## Must-Haves

- Delete app.js, style.css, base.css, index.vanilla.html (R029)
- Remove orphaned tw-animate-css dependency and its remaining usage in tooltip.tsx
- ESLint v9 flat config for TypeScript + React with eslint-config-prettier (R030)
- Prettier config and all source files formatted (R030)
- ChainModal lazy-loaded via React.lazy() + Suspense (R031)
- `npm run build` produces 2+ JS chunks with main <500KB (R031)
- Static dist/ serves correctly via `npm run preview` (R032)
- All 222 existing tests still pass (no behavioral changes)

## Proof Level

- This slice proves: operational + final-assembly
- Real runtime required: yes (build + preview server)
- Human/UAT required: no

## Verification

- `ls app.js style.css base.css index.vanilla.html 2>&1 | grep -c "No such file"` → 4
- `grep -c "tw-animate-css" package.json src/index.css` → 0
- `npx eslint .` → zero errors
- `npx prettier --check .` → all files formatted
- `npx tsc --noEmit` → zero errors
- `npx vitest run` → 222 tests pass
- `npm run build` → succeeds, 2+ JS chunks in dist/assets/, no "chunks are larger than 500 kB" warning
- `npm run preview` → serves at localhost:4173

## Observability / Diagnostics

- **Build output:** `npm run build` prints chunk sizes and warnings to stdout — check for "chunks are larger than 500 kB" absence.
- **Preview server:** `npm run preview` serves at localhost:4173 — visual inspection confirms SPA loads.
- **Lint/format:** `npx eslint .` and `npx prettier --check .` produce machine-readable pass/fail output.
- **Test suite:** `npx vitest run` outputs pass/fail counts — expect 222 pass, 0 fail.
- **Type checking:** `npx tsc --noEmit` outputs diagnostic count — expect 0 errors.
- **No secrets or sensitive data** in this slice — all changes are build tooling and static assets.

## Integration Closure

- Upstream surfaces consumed: All S01–S07 deliverables (complete app)
- New wiring introduced in this slice: React.lazy() + Suspense wrapper in App.tsx for ChainModal
- What remains before the milestone is truly usable end-to-end: nothing — this is the final slice

## Tasks

- [x] **T01: Delete vanilla files and remove tw-animate-css remnant** `est:15m`
  - Why: Clears legacy files (R029) and removes the orphaned tw-animate-css dependency that S07 partially cleaned but left in tooltip.tsx and index.css
  - Files: `app.js`, `style.css`, `base.css`, `index.vanilla.html`, `src/index.css`, `src/components/ui/tooltip.tsx`, `package.json`
  - Do: (1) Delete app.js, style.css, base.css, index.vanilla.html. (2) In tooltip.tsx line 46, replace the tw-animate-css classes `animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95` with standard Tailwind transition classes that achieve the same fade+zoom effect. (3) Remove `@import "tw-animate-css";` from src/index.css. (4) Run `npm uninstall tw-animate-css`. (5) Verify: `npx tsc --noEmit` clean, `npx vitest run` 222 tests pass, `npm run build` succeeds.
  - Verify: `ls app.js style.css base.css index.vanilla.html 2>&1 | grep -c "No such file"` → 4; `grep -rc "tw-animate-css" src/ package.json` → 0; `npx tsc --noEmit` → 0 errors; `npx vitest run` → 222 pass
  - Done when: All 4 vanilla files gone, tw-animate-css fully removed, build still passes

- [x] **T02: Configure ESLint v9 + Prettier for TypeScript/React** `est:25m`
  - Why: R030 — establish code quality tooling for the TS/React codebase. Current eslint.config.mjs is a vanilla JS config with CDN globals.
  - Files: `eslint.config.mjs`, `.prettierrc`, `package.json`
  - Do: (1) Install devDeps: `eslint@^9`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier`, `eslint-config-prettier`. (2) Rewrite eslint.config.mjs as flat config: import tseslint.configs.recommended, react-hooks plugin, react-refresh plugin, eslint-config-prettier last. Set parserOptions for tsx. Disable `@typescript-eslint/no-unused-vars` (tsconfig already enforces this via noUnusedLocals/noUnusedParameters). (3) Write .prettierrc with sensible defaults (semi, singleQuote, printWidth:80, trailingComma:all). (4) Run `npx prettier --write .` then `npx eslint --fix .` (5) Fix any remaining lint errors manually. (6) Verify clean: `npx eslint .` → 0 errors, `npx prettier --check .` → all formatted, tests still pass.
  - Verify: `npx eslint .` → 0 errors; `npx prettier --check .` → all formatted; `npx vitest run` → 222 pass; `npx tsc --noEmit` → 0 errors
  - Done when: ESLint + Prettier pass clean on entire codebase, both installed as devDependencies, lint script works without npx

- [ ] **T03: Lazy-load ChainModal and verify production build** `est:15m`
  - Why: R031 (code splitting) + R032 (static SPA build). ChainModal is 362 lines statically imported — lazy-loading it should push the main chunk under the 500KB Vite warning threshold.
  - Files: `src/components/main/ChainModal.tsx`, `src/App.tsx`
  - Do: (1) In ChainModal.tsx, add `export default ChainModal;` at the bottom (preserve existing named export for any direct imports). (2) In App.tsx, replace `import { ChainModal } from "@/components/main/ChainModal"` with `const ChainModal = lazy(() => import("@/components/main/ChainModal"))`. Add `lazy, Suspense` to React imports. (3) Wrap `<ChainModal />` usage in `<Suspense fallback={null}>`. (4) Run `npm run build` — verify 2+ JS chunks in dist/assets/, no 500KB warning. (5) Run `npm run preview` — verify SPA loads at localhost:4173. (6) Final gate: `npx vitest run` → 222 pass, `npx tsc --noEmit` clean.
  - Verify: `npm run build` succeeds with 2+ JS chunks; `ls dist/assets/*.js | wc -l` ≥ 2; build output has no "chunks are larger than 500 kB" warning; `npx vitest run` → 222 pass
  - Done when: Build produces split chunks, main <500KB, preview serves working SPA

## Files Likely Touched

- `app.js` (delete)
- `style.css` (delete)
- `base.css` (delete)
- `index.vanilla.html` (delete)
- `src/index.css`
- `src/components/ui/tooltip.tsx`
- `eslint.config.mjs`
- `.prettierrc`
- `package.json`
- `src/components/main/ChainModal.tsx`
- `src/App.tsx`
