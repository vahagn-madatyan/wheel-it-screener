# S07: Visual Polish + Animation — Research

**Date:** 2026-03-15

## Summary

S07 covers requirements R024–R028 plus the visual polish portion of R002. The codebase is functionally complete — all components render and all 222 tests pass. This slice adds the animation layer and visual refinements on top of existing DOM structure without changing behavior.

Three areas of work: **(1) Motion library integration** for page staggers, modal spring transitions, and theme toggle morph; **(2) Typography** via CDN fonts (Space Grotesk, General Sans, JetBrains Mono); **(3) Surface treatments** — noise texture overlay, gradient card borders, run button gradient with progress fill.

The main constraint is that Radix Dialog's controlled mode requires Framer Motion to work *inside* DialogContent, not around the Dialog root (per S06 forward intelligence). The existing tw-animate-css dialog animations should be replaced, not layered on top.

## Recommendation

**Two tasks:**

- **T01: Fonts, noise texture, gradient borders, theme toggle** — Loads CDN fonts in index.html, configures Tailwind font-family in index.css @theme, adds SVG noise texture as a fixed overlay, adds gradient border utility to card components, builds ThemeToggle component with animated Sun/Moon icon, places it in Header actions slot. Pure CSS + one small component.

- **T02: Motion animations + run button gradient** — Installs `motion@^12.36.0`, adds stagger variants to KpiCards and ResultsTable rows, replaces Dialog CSS animation with Framer Motion spring slide-up + backdrop fade, adds AnimatePresence to ProgressBar and EmptyState for enter/exit, upgrades run button with emerald gradient + progress fill bar during scan. All Framer Motion work in one task so the dependency is contained.

This ordering lets T01 be pure CSS/markup with no new dependencies, while T02 is the Motion-specific work.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Spring physics animations | `motion` (npm package, formerly framer-motion) | Decision #4 mandates it. React 19 compatible. Import from `motion/react`. |
| SVG noise texture | Inline `<svg>` with `<feTurbulence>` + `<feColorMatrix>` | One-time static SVG, no library needed. Common pattern for terminal/grain aesthetics. |
| Icon morph (Sun/Moon) | Lucide `Sun` + `Moon` icons + motion.div rotate/scale | Lucide already in deps. Simple crossfade with rotation — no icon morphing library needed. |
| Font loading | Google Fonts (Space Grotesk, JetBrains Mono) + Fontshare (General Sans) | Decision #8 chose CDN. Both endpoints verified working. `<link>` tags in index.html. |

## Existing Code and Patterns

- `src/stores/theme-store.ts` — toggleTheme/setTheme exist, persist to localStorage, apply class to `<html>`. ThemeToggle component just needs to consume this.
- `src/components/layout/Header.tsx` — Has `actions` ReactNode slot (line 9, 29) — ThemeToggle goes here.
- `src/components/ui/dialog.tsx` — Uses tw-animate-css `animate-in`/`animate-out` classes on DialogOverlay and DialogContent. These must be replaced with Framer Motion for spring physics. The `data-[state=open/closed]` animation classes get removed.
- `src/components/main/KpiCards.tsx` — 4 cards in a grid. Stagger via parent variant with `delayChildren: stagger(0.08)`. Each card gets `motion.div` with fade+slide-up.
- `src/components/main/ResultsTable.tsx` — Table rows can use `motion.tr` with stagger. Keep stagger short (0.02s per row) to avoid sluggish feel with many results.
- `src/components/main/ChainModal.tsx` — S06 says: "add AnimatePresence/motion.div inside DialogContent, not around Dialog itself." Radix controls open/close; Motion handles the visual transition.
- `src/components/sidebar/ActionButtons.tsx` — Run button (line 25-38) needs gradient background and progress fill overlay. scanStore phase + progress available for fill width.
- `src/components/main/ProgressBar.tsx` — Currently returns null when idle/complete. Wrap in AnimatePresence for enter/exit fade.
- `src/components/main/EmptyState.tsx` — Same pattern — AnimatePresence for mount/unmount transition.
- `src/theme.css` — oklch variables for both dark and light themes. Noise overlay should use `pointer-events-none` and low opacity (~3-5%) to be subtle.
- `index.html` — Bare `<head>` with no font links. Add `<link rel="preconnect">` and font CSS links.
- `src/index.css` — Tailwind @theme inline block. Add `--font-sans`, `--font-display`, `--font-mono` overrides.

## Constraints

- **Motion import path is `motion/react`**, not `framer-motion`. Package name is `motion`. Decision #4 says "Framer Motion" but the library rebranded at v12.
- **Dialog animation replacement**: tw-animate-css provides `animate-in`/`animate-out` via `data-[state]` selectors. When replacing with Motion, remove those Tailwind animation classes from DialogOverlay and DialogContent to avoid double-animation.
- **Radix Dialog controlled mode**: isOpen prop controls mount/unmount. AnimatePresence must wrap the content *inside* DialogPortal, with the overlay and content as motion.div children. The Dialog root stays as-is.
- **useShallow on all multi-field Zustand selectors** — Decision #29. Any new selectors must follow this pattern.
- **Score color thresholds (≥70 emerald, ≥45 yellow, <45 red)** shared between ResultsTable and ChainModal — don't change these.
- **Font CDN approach** (Decision #8) — `<link>` tags, not self-hosted. Google Fonts for Space Grotesk + JetBrains Mono, Fontshare API for General Sans.
- **General Sans on Fontshare** uses `https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap` — verified 200 response.
- **No `@emotion/is-prop-valid`** in deps — motion lists it as optional peer dep. Only needed if passing custom props through motion components. Shouldn't be needed here since we're using standard HTML elements (`motion.div`, `motion.tr`, `motion.button`).

## Common Pitfalls

- **Double animation on Dialog** — If tw-animate-css classes aren't removed from DialogOverlay/DialogContent, CSS and Framer Motion animations will fight. Remove `animate-in`/`animate-out`/`fade-in`/`zoom-in`/`slide-in` classes before adding Motion.
- **AnimatePresence needs stable keys** — Each direct child of AnimatePresence needs a unique `key`. For conditional renders (ProgressBar, EmptyState), use the component name as key.
- **Table row stagger performance** — Staggering 50+ `motion.tr` elements can jank. Cap the stagger to first ~20 rows, or use `viewport` option to only animate visible rows. Alternatively, use a single `transition-[width]` on score bars (already exists) and skip per-row stagger for large result sets.
- **Fontshare CORS** — Fontshare CDN works with `<link>` tags. Don't try to fetch via JS.
- **Noise texture z-index** — Must be above backgrounds but below all interactive elements. Use `z-[1]` with `pointer-events-none`. Apply to a pseudo-element or fixed overlay div.
- **Theme toggle in Header** — Header component expects `actions` as a prop, but App.tsx currently passes no `actions` to DashboardLayout/Header. Need to thread the ThemeToggle through or have Header import themeStore directly. Since Header already exists as a simple component, adding the toggle inside Header (importing themeStore) is cleaner than prop-drilling.

## Open Risks

- **Motion bundle size** — `motion` adds ~30-40KB gzipped. Since S08 handles bundle optimization and code splitting, this is acceptable for now. S08 can evaluate if motion components should be lazy-loaded.
- **Fontshare availability** — Third-party CDN. If it goes down, General Sans won't load and system font fallback kicks in. Acceptable for now per Decision #8 (self-host later if needed).
- **Dialog animation timing** — Replacing CSS transitions with spring physics changes the feel of open/close. Spring overshoot on a modal might feel off — will need tuning (stiffness/damping) during implementation.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Framer Motion / Motion | patricio0312rev/skills@framer-motion-animator (1.5K installs) | available — not installing (Context7 docs + library API sufficient for this scope) |
| Tailwind CSS | tailwindcss-advanced-layouts | already installed |
| Frontend design | frontend-design | already installed |

## Sources

- Motion React installation and import path: `import { motion } from "motion/react"` (source: [motion.dev docs](https://motion.dev/docs/react-installation))
- Motion supports React 18+19 via `peerDependencies` (source: `npm info motion peerDependencies`)
- AnimatePresence modes: sync (default), wait, popLayout (source: [motion.dev AnimatePresence](https://motion.dev/docs/react-animate-presence))
- Stagger via `delayChildren: stagger(0.1)` in parent variants (source: [motion.dev transitions](https://motion.dev/docs/vue-transitions))
- Spring config: `type: 'spring'`, `stiffness`, `damping`, `mass` for physics-based; `duration` + `bounce` for duration-based (source: [motion.dev transitions](https://motion.dev/docs/vue-transitions))
- Google Fonts endpoint for Space Grotesk + JetBrains Mono verified (source: curl test)
- Fontshare API for General Sans verified 200 (source: curl test)
- Latest stable: `motion@12.36.0` (source: npm registry)
