# S07: Visual Polish + Animation

**Goal:** Add the visual refinement layer — fonts, noise texture, gradient borders, theme toggle, and Framer Motion animations — on top of the functionally complete app, without changing any behavior.
**Demo:** App loads with Space Grotesk headings, General Sans body text, JetBrains Mono data cells. Subtle grain texture visible on backgrounds. KPI cards and result rows stagger in on scan completion. Chain modal slides up with spring physics. Theme toggle in header switches dark/light with icon morph. Run button shows emerald gradient with progress fill during scan.

## Must-Haves

- Font trio loaded via CDN (Space Grotesk, General Sans, JetBrains Mono) and wired to Tailwind font-family tokens
- SVG noise texture overlay on backgrounds (pointer-events-none, ~3-5% opacity)
- Gradient borders on KPI cards
- ThemeToggle component in header with Sun/Moon icon swap, connected to themeStore
- Framer Motion page stagger on KPI cards
- Framer Motion spring slide-up + backdrop fade on chain modal (replacing tw-animate-css)
- AnimatePresence on ProgressBar and EmptyState for enter/exit transitions
- Run button emerald gradient background with progress fill bar during scan
- All 222 existing tests still pass
- tsc clean

## Proof Level

- This slice proves: UAT — visual design matches Financial Terminal Noir spec, animations feel premium
- Real runtime required: yes (browser verification of fonts, animations, transitions)
- Human/UAT required: yes (animation feel is subjective; automated checks confirm nothing broke)

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — 222/222 tests pass (no behavior changes)
- Browser: fonts rendered (Space Grotesk on heading, JetBrains Mono on tabular-nums)
- Browser: noise texture visible as subtle grain overlay
- Browser: theme toggle in header toggles dark ↔ light
- Browser: chain modal slides up with spring (not CSS zoom), backdrop fades
- Browser: run button shows gradient with fill during scan

## Tasks

- [x] **T01: Load fonts, add noise texture + gradient borders, build ThemeToggle** `est:25m`
  - Why: Delivers all CSS/markup visual polish (R025, R026, R027) with zero new dependencies before the motion task adds animation complexity
  - Files: `index.html`, `src/index.css`, `src/components/layout/ThemeToggle.tsx` (new), `src/components/layout/Header.tsx`, `src/components/layout/DashboardLayout.tsx`, `src/components/main/KpiCards.tsx`
  - Do: Add font `<link>` tags (preconnect + CSS) to index.html for Google Fonts (Space Grotesk, JetBrains Mono) and Fontshare (General Sans). Add `--font-sans`, `--font-display`, `--font-mono` to index.css @theme block. Add inline SVG noise texture overlay (`<feTurbulence>` + `<feColorMatrix>`) as a fixed div in DashboardLayout with pointer-events-none and ~4% opacity. Add gradient border class to KPI cards. Create ThemeToggle component with Lucide Sun/Moon icons and CSS transition for icon swap, wired to `useThemeStore`. Place ThemeToggle inside Header's actions slot (pass from DashboardLayout or import directly in Header).
  - Verify: `npx tsc --noEmit` clean, `npx vitest run` 222 pass, browser shows fonts + noise + toggle
  - Done when: All three fonts render in browser, noise grain visible on dark background, theme toggles between dark/light, KPI cards have gradient borders

- [x] **T02: Install motion, add page staggers, dialog spring, AnimatePresence, and run button gradient** `est:30m`
  - Why: Delivers all Framer Motion animations (R024, R028) plus run button gradient in a single task so the motion dependency is contained
  - Files: `package.json`, `src/components/main/KpiCards.tsx`, `src/components/main/ResultsTable.tsx`, `src/components/ui/dialog.tsx`, `src/components/main/ChainModal.tsx`, `src/components/main/ProgressBar.tsx`, `src/components/main/EmptyState.tsx`, `src/components/sidebar/ActionButtons.tsx`, `src/components/layout/ThemeToggle.tsx`
  - Do: Install `motion@^12.36.0`. Add stagger variants to KpiCards (parent `delayChildren: stagger(0.08)`, children fade+slide-up). Add stagger to ResultsTable rows (cap at first 20, 0.02s per row). Replace tw-animate-css dialog animations in dialog.tsx with Framer Motion: remove `animate-in`/`animate-out`/`fade-in`/`zoom-in`/`slide-in` classes, add motion.div inside DialogContent for spring slide-up + backdrop fade via AnimatePresence. Wrap ProgressBar and EmptyState returns in AnimatePresence with fade enter/exit. Upgrade ThemeToggle icon swap to motion.div with rotate+scale spring. Upgrade run button in ActionButtons with emerald gradient background and CSS transition progress fill bar driven by scanStore progress.
  - Verify: `npx tsc --noEmit` clean, `npx vitest run` 222 pass, browser shows KPI stagger, modal spring, progress fill
  - Done when: KPI cards stagger on scan complete, chain modal slides up with spring physics (no CSS zoom), ProgressBar/EmptyState fade in/out, run button shows gradient + progress fill, theme toggle icon animates

## Files Likely Touched

- `index.html`
- `src/index.css`
- `src/components/layout/ThemeToggle.tsx` (new)
- `src/components/layout/Header.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/components/main/KpiCards.tsx`
- `src/components/main/ResultsTable.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/main/ChainModal.tsx`
- `src/components/main/ProgressBar.tsx`
- `src/components/main/EmptyState.tsx`
- `src/components/sidebar/ActionButtons.tsx`
- `package.json`
