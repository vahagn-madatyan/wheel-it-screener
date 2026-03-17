# S08: Cleanup + Deploy — Research

**Date:** 2026-03-16

## Summary

S08 is the final slice — cleanup, tooling, optimization, and deploy verification. The app is fully functional (222 tests pass, `npm run build` succeeds at 539KB JS / 45KB CSS). Four things remain: delete the vanilla files (R029), set up proper ESLint + Prettier for the TypeScript/React codebase (R030), lazy-load ChainModal to code-split the bundle (R031), and verify the static SPA build works standalone (R032).

The existing `eslint.config.mjs` is a pre-migration vanilla JS config (global CDN vars, `no-undef` rules) — it needs a complete rewrite for TypeScript + React. ESLint is not in `devDependencies` (the `"lint"` script uses npx). Prettier has no config or dependency. ChainModal is 362 lines statically imported in App.tsx — wrapping it in `React.lazy()` + `Suspense` is the standard code-splitting pattern and should push the main chunk under the 500KB warning threshold.

## Recommendation

Four independent tasks, natural build order:

1. **Delete vanilla files** first — zero risk, gets them out of the way for lint.
2. **ESLint + Prettier** — install deps, write flat config for TS/React, format codebase, fix any lint issues.
3. **Lazy-load ChainModal** — `React.lazy()` + `Suspense` in App.tsx, verify chunk split in build output.
4. **Build verification** — clean build, check bundle sizes, serve `dist/` and confirm it loads.

## Implementation Landscape

### Key Files

- `app.js` — Vanilla monolith (55KB). Delete.
- `style.css` — Vanilla styles (29KB). Delete.
- `base.css` — Vanilla CSS reset (2KB). Delete.
- `index.vanilla.html` — Preserved vanilla layout reference (24KB). Delete per Decision #14.
- `eslint.config.mjs` — Current config is vanilla JS (globals-based, CDN vars). Complete rewrite for TypeScript + React flat config.
- `src/App.tsx` — Statically imports `ChainModal`. Change to `React.lazy()` + `Suspense`.
- `src/components/main/ChainModal.tsx` — 362 lines, default export needed for `React.lazy()`. Currently uses named export `export function ChainModal()` — needs a default export added.
- `vite.config.ts` — May add `build.rollupOptions.output.manualChunks` for vendor splitting if chunk is still >500KB after lazy ChainModal.
- `package.json` — Add `eslint`, `prettier`, and related plugins to `devDependencies`. Update `"lint"` script.

### Build Order

1. **Delete vanilla files** — unblocks clean lint scope, zero dependencies.
2. **ESLint + Prettier** — install `eslint@^9`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier`, `eslint-config-prettier`. Write `eslint.config.mjs` (flat config). Write `.prettierrc`. Run `prettier --write .` then `eslint --fix .`. Fix any remaining errors.
3. **Lazy-load ChainModal** — Add `export default ChainModal` (or convert to default export) in `ChainModal.tsx`. In `App.tsx`, replace static import with `const ChainModal = lazy(() => import(...))` and wrap usage in `<Suspense fallback={null}>`. Verify build splits into 2+ JS chunks.
4. **Final build verification** — `npm run build` clean, bundle sizes checked, `npm run preview` serves correctly.

### Verification Approach

- `npx vitest run` — 222 tests still pass (no behavioral changes)
- `npx tsc --noEmit` — zero errors
- `ls app.js style.css base.css index.vanilla.html` — all return "No such file"
- `npx eslint .` — zero errors (with new config)
- `npx prettier --check .` — all files formatted
- `npm run build` — succeeds, main chunk <500KB (no Vite warning)
- `npm run preview` — static SPA loads in browser at localhost:4173
- Build output shows 2+ JS chunks (main + ChainModal lazy chunk)

## Constraints

- `ChainModal.tsx` uses named export (`export function ChainModal()`). `React.lazy()` requires a default export. Either add `export default ChainModal` at the bottom or convert to `export default function ChainModal()`. The named export should be preserved alongside the default for any existing imports.
- ESLint v9 uses flat config (`eslint.config.mjs`). The existing file already uses this format — just needs the content replaced. `typescript-eslint` v8+ supports flat config natively.
- `tsconfig.app.json` already has `noUnusedLocals: true` and `noUnusedParameters: true` — ESLint's `@typescript-eslint/no-unused-vars` should be set to match or be disabled to avoid double-reporting.
- The `"lint"` script in package.json (`eslint .`) works but ESLint is not in devDependencies — it runs via npx. Must install as devDep for reliable CI.

## Common Pitfalls

- **React.lazy requires default export** — Forgetting to add `export default` to ChainModal.tsx will cause a runtime error (`Element type is invalid`). Verify the lazy import works in dev before building.
- **ESLint + Prettier conflict** — `eslint-config-prettier` must be the last config in the array to disable formatting rules that conflict with Prettier. Without it, ESLint and Prettier fight over semicolons, quotes, etc.
- **Build asset paths** — The dist/index.html uses absolute paths (`/assets/...`). This works on Vercel/Netlify root deploys but breaks if deployed to a subdirectory. If subdirectory deploy is needed later, set `base` in vite.config.ts. Not a concern for now.
- **tw-animate-css still in devDependencies** — S07 removed the tw-animate-css classes from dialog.tsx, but the package is still in package.json and imported in `src/index.css` (`@import "tw-animate-css"`). The import should be removed and the dep uninstalled to reduce CSS bundle. Check if any remaining components use tw-animate-css classes before removing.
