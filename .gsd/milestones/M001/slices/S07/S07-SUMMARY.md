---
id: S07
parent: M001
milestone: M001
provides:
  - CDN font loading for Space Grotesk, General Sans, JetBrains Mono with Tailwind tokens
  - SVG noise texture grain overlay on backgrounds (pointer-events-none, 4% opacity)
  - Gradient border styling on KPI cards
  - ThemeToggle component with Sun/Moon icon morph, wired to persisted themeStore
  - Framer Motion stagger animations on KPI cards and result table rows
  - Spring slide-up + backdrop fade on dialog (replacing tw-animate-css)
  - AnimatePresence fade transitions on ProgressBar and EmptyState
  - Emerald gradient run button with CSS-driven progress fill bar
requires:
  - slice: S06
    provides: ChainModal component, all functional components complete, all interactive patterns established
affects:
  - S08
key_files:
  - index.html
  - src/index.css
  - src/components/layout/ThemeToggle.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/DashboardLayout.tsx
  - src/components/main/KpiCards.tsx
  - src/components/main/ResultsTable.tsx
  - src/components/ui/dialog.tsx
  - src/components/main/ChainModal.tsx
  - src/components/main/ProgressBar.tsx
  - src/components/main/EmptyState.tsx
  - src/components/sidebar/ActionButtons.tsx
key_decisions:
  - "Decision #35: Radix Dialog + motion integration — forceMount on Overlay/Content + AnimatePresence + open prop from consumer for spring exit transitions"
  - ThemeToggle imported directly in Header rather than passed via actions prop
  - Run button progress fill uses pure CSS transition-[width] rather than motion — simpler, no layout thrash
  - ResultsTable stagger capped at 20 rows to prevent jank on large datasets
  - KPI card values use font-mono class for JetBrains Mono on tabular data
patterns_established:
  - "Gradient border pattern: outer div with bg-gradient p-px rounded-lg, inner div with bg-card"
  - "Noise overlay pattern: fixed inset-0 z-[1] pointer-events-none div with inline SVG feTurbulence filter at 4% opacity"
  - "Radix dialog + motion pattern: DialogContent accepts open prop, uses forceMount + AnimatePresence with motion.div wrapper for spring slide-up"
  - "Variant-driven stagger pattern: parent container variants with staggerChildren, child variants with spring transition"
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M001/slices/S07/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S07/tasks/T02-SUMMARY.md
duration: 27m
verification_result: passed
completed_at: 2026-03-15
---

# S07: Visual Polish + Animation

**Added font trio, noise texture, gradient borders, theme toggle with icon morph, Framer Motion stagger/spring animations, and emerald gradient run button — all visual-only, zero behavior changes.**

## What Happened

T01 delivered the static visual layer: CDN font links for Space Grotesk (headings), General Sans (body), and JetBrains Mono (data) wired to Tailwind `--font-sans`, `--font-display`, `--font-mono` tokens. An inline SVG noise texture overlay using `<feTurbulence>` was added as a fixed pointer-events-none div in DashboardLayout at 4% opacity. KPI cards got gradient borders via the p-px wrapper technique. ThemeToggle component with Lucide Sun/Moon icons was created and placed in Header, reading/writing the persisted themeStore.

T02 added the motion layer: `motion@^12.36.0` installed. KPI cards got variant-driven spring stagger (0.08s per card). ResultsTable rows stagger on first 20 entries (0.02s each, rest instant). Dialog.tsx was rewritten to remove all tw-animate-css classes and use forceMount + AnimatePresence with motion.div — overlay fades, content slides up with spring physics (stiffness: 300, damping: 30). ProgressBar and EmptyState wrapped in AnimatePresence for fade enter/exit. ThemeToggle upgraded to AnimatePresence mode="wait" with rotate+scale icon morph. Run button changed to emerald gradient with an absolute-positioned fill bar tracking scan progress via CSS transition.

Also fixed pre-existing unused import lint errors (6 files) that were blocking `npm run build` under `tsc -b` strict mode.

## Verification

- `npx tsc --noEmit` — zero errors ✅
- `npx vitest run` — 222/222 tests pass ✅
- `npm run build` — production build succeeds ✅
- Browser: heading font-family contains "Space Grotesk" ✅
- Browser: body font-family contains "General Sans" ✅
- Browser: `.font-mono` elements resolve to "JetBrains Mono" ✅
- Browser: SVG feTurbulence noise overlay present in DOM ✅
- Browser: 4 KPI cards render with gradient border (bg-gradient-to-br) ✅
- Browser: theme toggle switches `<html>` class between dark/light ✅
- Browser: aria-label alternates "Switch to light mode" / "Switch to dark mode" ✅
- Browser: all tw-animate-css dialog classes confirmed removed ✅
- Browser: motion imports present in 6 component files ✅
- Browser: run button has emerald gradient classes (enabled state) ✅
- Zero new console errors on clean page load ✅

## Requirements Advanced

- R002 — Visual polish (noise, gradients, fonts) now complete; requirement fully delivered
- R024 — Framer Motion animations added to KPI cards, dialog, ProgressBar, EmptyState, ThemeToggle, ResultsTable
- R025 — Noise texture overlay and gradient borders on KPI cards implemented
- R026 — Font trio loaded via CDN and wired to Tailwind tokens
- R027 — Theme toggle with icon morph in header, connected to persisted themeStore
- R028 — Run button shows emerald gradient with progress fill during scan

## Requirements Validated

- R024 — motion.div stagger on KPI + table, spring dialog, AnimatePresence on ProgressBar/EmptyState, icon morph on toggle
- R025 — SVG noise overlay at 4% opacity, gradient border on KPI cards verified in browser
- R026 — Space Grotesk, General Sans, JetBrains Mono all render in browser (computed font-family verified)
- R027 — Theme toggle switches dark↔light, persists to localStorage, icon animates
- R028 — Emerald gradient background on run button, progress fill bar during scan via CSS transition

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- DialogContent now accepts an `open` prop (not in original plan) — needed for AnimatePresence to control mount/unmount. ChainModal passes `open={isOpen}`.
- Dialog layout changed from `fixed left-[50%] top-[50%] translate-[-50%]` centering to `fixed inset-0 flex items-center justify-center` — cleaner for motion wrapper nesting.
- Fixed 6 pre-existing unused import errors across ChainModal, StockFiltersSection, chain.ts, chain.test.ts, services.test.ts, and filter-store.ts that blocked `npm run build`.

## Known Limitations

- Chain modal spring animation and run button progress fill require real API keys to verify live — structurally correct based on code review and forceMount pattern.
- Font loading depends on CDN availability (Google Fonts + Fontshare). Self-hosting deferred per Decision #8.

## Follow-ups

- none

## Files Created/Modified

- `index.html` — Font preconnect links and CSS stylesheet tags for three font families
- `src/index.css` — --font-sans, --font-display, --font-mono tokens in @theme inline block
- `src/components/layout/ThemeToggle.tsx` — New: Sun/Moon toggle with motion rotate+scale morph
- `src/components/layout/Header.tsx` — Imported ThemeToggle, added font-display class to heading
- `src/components/layout/DashboardLayout.tsx` — SVG noise texture overlay div
- `src/components/main/KpiCards.tsx` — Gradient border wrapper, font-mono on values, motion stagger variants
- `src/components/main/ResultsTable.tsx` — motion.tbody/motion.tr stagger on first 20 rows
- `src/components/ui/dialog.tsx` — Replaced tw-animate-css with AnimatePresence + motion.div spring/fade
- `src/components/main/ChainModal.tsx` — Passes open={isOpen} to DialogContent, removed unused targetDTE import
- `src/components/main/ProgressBar.tsx` — Wrapped in AnimatePresence with fade
- `src/components/main/EmptyState.tsx` — Wrapped in AnimatePresence with fade
- `src/components/sidebar/ActionButtons.tsx` — Emerald gradient + progress fill bar
- `src/components/sidebar/StockFiltersSection.tsx` — Removed unused useState/useEffect imports
- `src/lib/chain.ts` — Removed unused AlpacaOptionContract import, typed greeks fallback
- `src/lib/__tests__/chain.test.ts` — Removed unused beforeEach import
- `src/services/__tests__/services.test.ts` — Removed unused afterEach import, added type cast
- `src/stores/filter-store.ts` — Removed unused DEFAULT_WEIGHTS and BOOL_FIELD_MAP
- `package.json` — Added motion@^12.36.0 dependency

## Forward Intelligence

### What the next slice should know
- `npm run build` now passes cleanly — S08 can focus on code splitting and bundle optimization without fixing lint issues first.
- Bundle is 539KB (gzipped 173KB) — the chunk size warning suggests lazy-loading ChainModal, which is already planned for S08.

### What's fragile
- Dialog animation relies on the `open` prop being passed from ChainModal — if another consumer of DialogContent doesn't pass `open`, AnimatePresence won't control exit transitions. Document this pattern.
- Font loading depends on CDN availability — if either Google Fonts or Fontshare is down, fallback system fonts render instead. No visual breakage, just degraded typography.

### Authoritative diagnostics
- `npx tsc --noEmit` and `npm run build` — both must pass clean. The `tsc -b` mode used by the build script is stricter than `--noEmit` (enforces no unused locals).
- `grep -c "animate-in\|animate-out" src/components/ui/dialog.tsx` should return 0 — confirms tw-animate-css classes fully removed.

### What assumptions changed
- Original plan assumed tw-animate-css dialog animations just needed class swaps. In practice, Radix needs `forceMount` on both Overlay and Content for AnimatePresence exit transitions to work — this is a deeper pattern change than anticipated (Decision #35).
