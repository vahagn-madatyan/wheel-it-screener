# S08: Cleanup + Deploy — UAT

**Milestone:** M001
**Written:** 2026-03-16

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice is entirely build tooling, file deletion, and formatting — all verifiable via CLI commands with deterministic pass/fail output. No new UI behavior was added.

## Preconditions

- Node.js installed with npm
- `npm install` has been run (all dependencies present in node_modules)
- Working directory is the project root (`wheel-it-screener`)

## Smoke Test

Run `npm run build && npm run preview` — build should succeed with no warnings about chunks >500KB, and preview server should start at localhost:4173 serving the SPA.

## Test Cases

### 1. Vanilla files fully removed

1. Run `ls app.js style.css base.css index.vanilla.html 2>&1`
2. **Expected:** All 4 commands report "No such file or directory"

### 2. tw-animate-css dependency fully removed

1. Run `grep -r "tw-animate-css" package.json package-lock.json src/`
2. **Expected:** Zero matches — no references to tw-animate-css anywhere in source or package manifest
3. Run `ls node_modules/tw-animate-css 2>&1`
4. **Expected:** "No such file or directory"

### 3. ESLint passes clean

1. Run `npx eslint .`
2. **Expected:** Exit code 0, zero errors. One warning in ScoringWeightsSection.tsx about react-refresh/only-export-components is acceptable.

### 4. Prettier passes clean

1. Run `npx prettier --check .`
2. **Expected:** "All matched files use Prettier code style!" — exit code 0

### 5. TypeScript compiles clean

1. Run `npx tsc --noEmit`
2. **Expected:** Exit code 0, zero errors

### 6. All 222 tests pass

1. Run `npx vitest run`
2. **Expected:** 12 test files, 222 tests passed, 0 failed

### 7. Production build produces split chunks

1. Run `npm run build`
2. **Expected:** Build succeeds. Output lists at least 2 JS files in dist/assets/:
   - `index-*.js` at ~491KB (must be under 500KB)
   - `ChainModal-*.js` at ~49KB
3. Run `ls dist/assets/*.js | wc -l`
4. **Expected:** 2 or more

### 8. No 500KB chunk warning

1. Run `npm run build 2>&1 | grep "500 kB"`
2. **Expected:** Zero matches — Vite should not emit the "chunks are larger than 500 kB" warning

### 9. Preview server serves SPA

1. Run `npm run preview` (starts server in background)
2. Open http://localhost:4173 in a browser (or `curl -s -o /dev/null -w "%{http_code}" http://localhost:4173`)
3. **Expected:** HTTP 200, page renders the WheelScan dashboard with sidebar, header, and main area
4. Stop the preview server

### 10. ChainModal is lazy-loaded in source

1. Run `grep -n "lazy(" src/App.tsx`
2. **Expected:** Line shows `const ChainModal = lazy(() => import("@/components/main/ChainModal"))`
3. Run `grep -n "Suspense" src/App.tsx`
4. **Expected:** Suspense wrapper present around ChainModal usage

## Edge Cases

### ESLint config handles TypeScript + React correctly

1. Run `npx eslint src/App.tsx`
2. **Expected:** No errors about JSX syntax, TypeScript types, or import resolution. ESLint correctly parses TSX files.

### Prettier ignores agent metadata

1. Run `npx prettier --check .gsd/`
2. **Expected:** Should not check files in .gsd/ — the .prettierignore excludes it
3. Run `cat .prettierignore`
4. **Expected:** Contains `.gsd/` and `.bg-shell/` entries

### Tooltip still has working animation classes

1. Run `grep -A2 "transition" src/components/ui/tooltip.tsx`
2. **Expected:** Contains `transition-[opacity,transform]` with `data-[state=open]` and `data-[state=closed]` modifiers — pure CSS transitions replacing tw-animate-css

## Failure Signals

- `npm run build` exits non-zero or emits "chunks are larger than 500 kB" warning
- `npx eslint .` reports any errors (warnings are acceptable)
- `npx prettier --check .` reports unformatted files
- `npx tsc --noEmit` reports type errors
- `npx vitest run` shows any test failures or fewer than 222 passing
- Any of the 4 vanilla files still exist in the project root
- `grep` finds any tw-animate-css references in source or dependencies
- Preview server returns non-200 or blank page

## Requirements Proved By This UAT

- R029 — Vanilla files deleted (test case 1)
- R030 — ESLint + Prettier configured and passing (test cases 3, 4)
- R031 — Code splitting via lazy-load produces 2+ chunks under 500KB (test cases 7, 8, 10)
- R032 — Static SPA build deploys and serves correctly (test cases 7, 9)

## Not Proven By This UAT

- Full end-to-end scan flow with real API keys (proven in S05 UAT)
- Visual design fidelity of the Financial Terminal Noir theme (proven in S07 UAT)
- Scoring parity with vanilla app (proven in S01 UAT via 128 parity tests)
- Responsive layout behavior at breakpoints (proven in S03 UAT)

## Notes for Tester

- The 1 react-refresh warning about ScoringWeightsSection.tsx exporting `WEIGHT_KEYS` alongside the component is expected and harmless — not worth splitting into a separate file.
- The main chunk at 491KB is intentionally close to the 500KB threshold. This is the expected result after code-splitting ChainModal.
- All test cases can be run without any API keys or network access — they are purely build/tooling checks.
