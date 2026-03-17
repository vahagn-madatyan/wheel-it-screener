---
estimated_steps: 5
estimated_files: 9
---

# T02: Install motion, add page staggers, dialog spring, AnimatePresence, and run button gradient

**Slice:** S07 — Visual Polish + Animation
**Milestone:** M001

## Description

Install the `motion` package (v12+, import from `motion/react`) and add Framer Motion animations across the app: KPI card stagger, result row stagger, dialog spring slide-up replacing tw-animate-css, AnimatePresence on ProgressBar/EmptyState, theme toggle icon rotation, and run button emerald gradient with progress fill. All Motion work consolidated in one task to contain the dependency.

## Steps

1. **Install motion** — `npm install motion@^12.36.0`. Verify no peer dep warnings for `@emotion/is-prop-valid` (not needed — only standard HTML motion elements used). Confirm import from `motion/react` works.

2. **KPI card stagger animation** — In KpiCards.tsx, wrap the grid in `motion.div` with parent variants (`visible: { transition: { staggerChildren: 0.08 } }`). Wrap each KpiCard in `motion.div` with `initial={{ opacity: 0, y: 12 }}` → `animate={{ opacity: 1, y: 0 }}` with a short spring or ease-out transition. Only animate when scan has data (hasScanData).

3. **Replace dialog CSS animations with Framer Motion** — In dialog.tsx, remove all `data-[state=open]:animate-in`, `data-[state=closed]:animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-from-*` classes from DialogOverlay and DialogContent. The overlay gets `motion.div` with fade `opacity: 0 → 1`. The content gets `motion.div` with spring slide-up (`y: 24 → 0`, `opacity: 0 → 1`, `type: 'spring'`, stiffness ~300, damping ~30). Wrap both in `AnimatePresence` inside DialogPortal. Keep the `forceMount` pattern on Radix overlay/content if needed for AnimatePresence to manage exit. Test that modal open/close both animate smoothly.

4. **AnimatePresence on ProgressBar, EmptyState, and ThemeToggle icon** — Wrap ProgressBar's conditional return in `AnimatePresence` with `motion.div` fade (`opacity: 0 → 1` on enter, reverse on exit). Same for EmptyState. For ThemeToggle (from T01), upgrade the icon swap from CSS transition to `motion.div` with `key={theme}` inside `AnimatePresence`, rotating 90° on enter and scaling from 0 → 1 for a smooth icon morph effect. Add stagger to ResultsTable rows — use `motion.tr` on first 20 rows with 0.02s stagger to avoid jank on large result sets; rows beyond 20 render instantly.

5. **Run button emerald gradient + progress fill** — In ActionButtons.tsx, update the run button background from `bg-primary` to an emerald gradient (`bg-gradient-to-r from-emerald-600 to-emerald-500` when enabled). When `phase === 'running'`, add an absolute-positioned inner div with `bg-emerald-400/20` whose width is driven by `useScanStore((s) => s.progress)` as a percentage. Use CSS `transition-[width] duration-150 ease-out` for smooth fill — no Framer Motion needed for the fill bar itself.

## Must-Haves

- [ ] `motion` package installed and importable from `motion/react`
- [ ] KPI cards stagger in with fade+slide-up on scan completion
- [ ] Dialog overlay fades, content slides up with spring physics (no CSS zoom/slide artifacts)
- [ ] All tw-animate-css dialog animation classes removed from dialog.tsx
- [ ] ProgressBar fades in/out via AnimatePresence
- [ ] EmptyState fades in/out via AnimatePresence
- [ ] ThemeToggle icon animates with rotation on theme switch
- [ ] First 20 ResultsTable rows stagger on initial render; rows 21+ render instantly
- [ ] Run button shows emerald gradient; progress fill bar visible during scan
- [ ] All 222 existing tests still pass
- [ ] tsc clean

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — 222/222 pass
- Browser: KPI cards stagger visibly on page load/scan
- Browser: chain modal slides up smoothly (no zoom, spring overshoot visible)
- Browser: chain modal close has smooth exit animation
- Browser: toggle theme → icon rotates/scales
- Browser: click Run Screener → button shows gradient fill growing

## Inputs

- T01 output: ThemeToggle with CSS transition (upgrade to motion)
- T01 output: KpiCards with gradient border wrapper (add motion.div stagger)
- `src/components/ui/dialog.tsx` — tw-animate-css classes to replace
- `src/components/main/ChainModal.tsx` — uses Dialog; no changes needed (dialog.tsx handles animation)
- `src/components/main/ProgressBar.tsx` — conditional null return to wrap in AnimatePresence
- `src/components/main/EmptyState.tsx` — conditional null return to wrap in AnimatePresence
- `src/components/main/ResultsTable.tsx` — table rows to add motion.tr stagger
- `src/components/sidebar/ActionButtons.tsx` — run button to get gradient + progress fill
- `src/stores/scan-store.ts` — progress (0-1) for fill width

## Expected Output

- `package.json` — motion@^12 added to dependencies
- `src/components/main/KpiCards.tsx` — motion.div stagger wrapper + child animations
- `src/components/main/ResultsTable.tsx` — motion.tr on first 20 rows with stagger
- `src/components/ui/dialog.tsx` — tw-animate-css classes removed, AnimatePresence + motion.div for overlay/content
- `src/components/main/ProgressBar.tsx` — AnimatePresence wrapper with fade
- `src/components/main/EmptyState.tsx` — AnimatePresence wrapper with fade
- `src/components/layout/ThemeToggle.tsx` — motion.div icon animation replacing CSS transition
- `src/components/sidebar/ActionButtons.tsx` — emerald gradient + progress fill bar
