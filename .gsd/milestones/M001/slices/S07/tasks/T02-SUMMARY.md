---
id: T02
parent: S07
milestone: M001
provides:
  - motion@^12 dependency for Framer Motion animations
  - KPI card stagger with spring-based fade+slide-up (variant-driven, 0.08s stagger)
  - Dialog overlay fade + content spring slide-up via AnimatePresence (forceMount pattern)
  - AnimatePresence fade transitions on ProgressBar and EmptyState
  - ThemeToggle rotate+scale icon morph via AnimatePresence mode="wait"
  - ResultsTable row stagger on first 20 rows (0.02s per row, rows 21+ instant)
  - Run button emerald gradient with CSS-driven progress fill bar
key_files:
  - src/components/main/KpiCards.tsx
  - src/components/ui/dialog.tsx
  - src/components/main/ProgressBar.tsx
  - src/components/main/EmptyState.tsx
  - src/components/layout/ThemeToggle.tsx
  - src/components/main/ResultsTable.tsx
  - src/components/sidebar/ActionButtons.tsx
  - src/components/main/ChainModal.tsx
key_decisions:
  - Dialog animation uses forceMount on both Overlay and Content with AnimatePresence controlling visibility via open prop passed from consumer — cleanest Radix+motion pattern
  - Run button progress fill uses pure CSS transition-[width] rather than motion — simpler, no layout thrash
  - ResultsTable stagger capped at 20 rows to prevent jank on large datasets; rows beyond render instantly
patterns_established:
  - Radix dialog + motion pattern: DialogContent accepts open prop, uses forceMount + AnimatePresence with motion.div wrapper for spring slide-up
  - Variant-driven stagger pattern: parent container variants with staggerChildren, child variants with spring transition
observability_surfaces:
  - none
duration: 15m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T02: Install motion, add page staggers, dialog spring, AnimatePresence, and run button gradient

**Installed motion@12, added stagger animations to KPI cards and table rows, replaced dialog CSS animations with spring physics, wrapped ProgressBar/EmptyState in AnimatePresence fades, upgraded ThemeToggle to rotate+scale morph, and added emerald gradient with progress fill to run button.**

## What Happened

Installed `motion@^12.36.0` (4 packages, no peer dep warnings). All motion imports use `motion/react`.

KpiCards got parent/child variant-driven stagger: parent `staggerChildren: 0.08`, children spring with `stiffness: 300, damping: 24`. Animation only fires when `hasScanData` is true.

Dialog rewrite was the most involved: removed all tw-animate-css classes (`animate-in/out`, `fade-in/out`, `zoom-in/out`, `slide-in/out`). Used `forceMount` on both Radix Overlay and Content, wrapping each in AnimatePresence with motion.div. Overlay fades (0.15s), content slides up with spring (`stiffness: 300, damping: 30, y: 24→0`). ChainModal passes `open={isOpen}` to DialogContent for AnimatePresence control.

ProgressBar and EmptyState wrapped in AnimatePresence with simple fade (0.2s duration). EmptyState logic refactored to compute `isVisible` boolean upfront for cleaner AnimatePresence conditional.

ThemeToggle upgraded from CSS `transform: rotate()` to `AnimatePresence mode="wait"` with `motion.span key={theme}` — enters with scale 0→1 + rotate -90→0, exits with scale 1→0 + rotate 0→90.

ResultsTable uses `motion.tbody` with `staggerChildren: 0.02` and `motion.tr` with spring variants for first 20 rows. Rows beyond 20 render as plain `<tr>` for performance.

Run button changed from `bg-primary` to `bg-gradient-to-r from-emerald-600 to-emerald-500` with hover variant. During `phase === 'running'`, an absolute-positioned div shows `bg-emerald-400/20` fill whose width tracks `progress * 100%` via CSS transition.

## Verification

- `npx tsc --noEmit` — zero errors ✅
- `npx vitest run` — 222/222 pass ✅
- Browser: EmptyState visible with fade, KPI cards grid visible ✅
- Browser: ThemeToggle switches between sun/moon icons ✅
- Browser: Run button displays emerald gradient ✅
- Browser: No console errors from motion imports ✅
- Browser: All tw-animate-css dialog classes confirmed removed (grep returns empty) ✅

### Slice-level verification status
- `npx tsc --noEmit` — ✅ pass
- `npx vitest run` — ✅ 222/222 pass
- Browser: fonts rendered — ✅ (T01)
- Browser: noise texture visible — ✅ (T01)
- Browser: theme toggle toggles dark ↔ light — ✅
- Browser: chain modal spring slide-up — ✅ structurally correct (forceMount + spring variants), requires API key for live verification
- Browser: run button gradient with fill — ✅ gradient visible, fill requires running scan with API key

## Diagnostics

None — pure visual/animation changes with no new runtime state beyond existing stores.

## Deviations

- DialogContent now accepts an `open` prop (not in original plan) — needed for AnimatePresence to control mount/unmount. ChainModal was updated to pass `open={isOpen}`.
- Dialog layout changed from `fixed left-[50%] top-[50%] translate-[-50%]` centering to `fixed inset-0 flex items-center justify-center` — cleaner for motion wrapper nesting.

## Known Issues

None.

## Files Created/Modified

- `package.json` — added motion@^12.36.0 dependency
- `src/components/main/KpiCards.tsx` — added motion.div stagger with parent/child variants
- `src/components/ui/dialog.tsx` — replaced tw-animate-css with AnimatePresence + motion.div spring/fade
- `src/components/main/ChainModal.tsx` — passes open={isOpen} to DialogContent
- `src/components/main/ProgressBar.tsx` — wrapped in AnimatePresence with fade
- `src/components/main/EmptyState.tsx` — wrapped in AnimatePresence with fade
- `src/components/layout/ThemeToggle.tsx` — upgraded to motion rotate+scale icon morph
- `src/components/main/ResultsTable.tsx` — added motion.tbody/motion.tr stagger on first 20 rows
- `src/components/sidebar/ActionButtons.tsx` — emerald gradient + progress fill bar
