# T03: Lazy-load ChainModal and verify production build

## Slice Context
**Goal:** Old vanilla files removed, ESLint + Prettier configured, ChainModal lazy-loaded, static SPA builds under 500KB.
**This task:** Code-splits ChainModal via React.lazy() and runs the final production build verification.

## Description
ChainModal (362 lines) is statically imported in App.tsx, contributing to a single 539KB JS chunk that triggers Vite's 500KB warning. Wrapping it in React.lazy() + Suspense will split it into a separate chunk loaded on demand. This is also the final verification gate — confirm the static SPA serves correctly from dist/.

## Must-Haves
- ChainModal.tsx has a default export (alongside existing named export)
- App.tsx uses `React.lazy(() => import(...))` instead of static import
- ChainModal usage wrapped in `<Suspense fallback={null}>`
- `npm run build` produces 2+ JS chunks in dist/assets/
- No "chunks are larger than 500 kB" warning in build output
- `npm run preview` serves the SPA at localhost:4173
- All 222 tests still pass
- `npx tsc --noEmit` clean, `npx eslint .` clean

## Steps

1. **Add default export to ChainModal.tsx:**
   At the bottom of `src/components/main/ChainModal.tsx`, add:
   ```typescript
   export default ChainModal;
   ```
   This preserves the existing named export `export function ChainModal()` for any direct imports while satisfying React.lazy()'s requirement for a default export.

2. **Update App.tsx imports:**
   - Remove: `import { ChainModal } from "@/components/main/ChainModal";`
   - Add `lazy, Suspense` to the React import: `import { lazy, Suspense, ... } from "react";`
     (Or add a separate import if React is imported differently)
   - Add: `const ChainModal = lazy(() => import("@/components/main/ChainModal"));`

3. **Wrap ChainModal in Suspense in App.tsx:**
   Find where `<ChainModal />` is rendered (should be around line 63) and wrap it:
   ```tsx
   <Suspense fallback={null}>
     <ChainModal />
   </Suspense>
   ```
   `fallback={null}` is correct here — the modal shows its own loading state internally via chainStore.

4. **Build and check chunks:**
   ```bash
   npm run build
   ```
   Verify:
   - 2+ `.js` files in `dist/assets/`
   - No "chunks are larger than 500 kB" warning in output
   - Note the main chunk size — should be under 500KB

5. **Preview the static build:**
   ```bash
   npm run preview
   ```
   Open localhost:4173 in a browser or verify it starts. The SPA should load and render the dashboard.

6. **Run the full verification suite:**
   ```bash
   npx tsc --noEmit     # 0 errors
   npx eslint .         # 0 errors (from T02)
   npx prettier --check . # all formatted (from T02)
   npx vitest run       # 222 pass
   ```

## Verification
```bash
# Build produces multiple chunks
npm run build 2>&1 | grep -c "500 kB"
# Expected: 0 (no warning)

ls dist/assets/*.js | wc -l
# Expected: ≥ 2

# Full suite
npx tsc --noEmit     # 0 errors
npx vitest run       # 222 pass
npx eslint .         # 0 errors
```

## Inputs
- `src/components/main/ChainModal.tsx` — 362-line component with named export `export function ChainModal()` at line 158
- `src/App.tsx` — line 15 has `import { ChainModal } from "@/components/main/ChainModal"`, line 63 has `<ChainModal />`
- Build currently produces single 539KB JS chunk

## Expected Output
- `src/components/main/ChainModal.tsx` — has `export default ChainModal;` at bottom
- `src/App.tsx` — uses `lazy()` + `<Suspense>` for ChainModal
- `dist/assets/` — 2+ JS files (main chunk + ChainModal chunk)
- Main chunk under 500KB, no Vite warning
- SPA loads from static build via `npm run preview`
