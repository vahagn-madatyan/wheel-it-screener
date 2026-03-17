---
id: T01
parent: S07
milestone: M001
provides:
  - CDN font loading for Space Grotesk, General Sans, JetBrains Mono
  - Tailwind font-family tokens (--font-sans, --font-display, --font-mono)
  - SVG noise texture grain overlay in DashboardLayout
  - Gradient border styling on KPI cards
  - ThemeToggle component with dark/light switching
key_files:
  - index.html
  - src/index.css
  - src/components/layout/ThemeToggle.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/DashboardLayout.tsx
  - src/components/main/KpiCards.tsx
key_decisions:
  - ThemeToggle imported directly in Header rather than passed via actions prop — simpler, avoids threading through DashboardLayout
  - KPI card values use font-mono class for JetBrains Mono on tabular data
  - Gradient border uses p-px wrapper technique with bg-gradient-to-br from-primary/30
patterns_established:
  - Gradient border pattern: outer div with bg-gradient p-px rounded-lg, inner div with bg-card and calc(radius-1px) rounding
  - Noise overlay pattern: fixed inset-0 z-[1] pointer-events-none div with inline SVG feTurbulence filter at 4% opacity
observability_surfaces:
  - none
duration: 12m
verification_result: passed
completed_at: 2026-03-15
blocker_discovered: false
---

# T01: Load fonts, add noise texture + gradient borders, build ThemeToggle

**Added CDN font trio, SVG grain overlay, gradient KPI borders, and Sun/Moon theme toggle wired to persisted themeStore.**

## What Happened

Added preconnect + CSS link tags to index.html for three font families: Space Grotesk (Google Fonts, display headings), JetBrains Mono (Google Fonts, tabular data), General Sans (Fontshare, body text). Wired them into Tailwind via `--font-sans`, `--font-display`, `--font-mono` tokens in the @theme inline block. Applied `font-display` to the WheelScan heading and `font-mono` to KPI card values.

Added an inline SVG noise texture overlay using `<feTurbulence type="fractalNoise">` inside DashboardLayout as a fixed, pointer-events-none div at 4% opacity. Provides subtle grain aesthetic without any image assets.

Replaced flat `border border-border` on KPI cards with a gradient border technique — outer wrapper with `bg-gradient-to-br from-primary/30 via-border to-border p-px` and inner card with solid `bg-card`.

Created ThemeToggle component using Lucide Sun/Moon icons, reads/writes `useThemeStore`. Imported directly in Header for simplicity. Icon rotates 180° on toggle via CSS transition-transform.

## Verification

- `npx tsc --noEmit` — zero errors ✓
- `npx vitest run` — 222/222 tests pass ✓
- Browser: heading computed font-family contains "Space Grotesk" ✓
- Browser: body computed font-family contains "General Sans" ✓
- Browser: `.font-mono` elements resolve to "JetBrains Mono" ✓
- Browser: noise overlay SVG filter present in DOM with correct attributes ✓
- Browser: KPI cards render with gradient border (visible emerald glow) ✓
- Browser: clicking theme toggle switches `<html>` class between `dark` and `light` ✓
- Browser: aria-label switches between "Switch to light mode" / "Switch to dark mode" ✓
- Zero new npm dependencies ✓

### Slice-level verification (partial — T01 of 2):
- ✅ `npx tsc --noEmit` — zero errors
- ✅ `npx vitest run` — 222/222 pass
- ✅ Browser: fonts rendered (Space Grotesk on heading, JetBrains Mono on tabular-nums)
- ✅ Browser: noise texture visible as subtle grain overlay
- ✅ Browser: theme toggle in header toggles dark ↔ light
- ⬜ Browser: chain modal slides up with spring (T02)
- ⬜ Browser: run button shows gradient with fill during scan (T02)

## Diagnostics

None — pure visual CSS/markup changes with no runtime state beyond existing themeStore.

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `index.html` — Added font preconnect links and CSS stylesheet tags for three font families
- `src/index.css` — Added --font-sans, --font-display, --font-mono tokens to @theme inline block
- `src/components/layout/ThemeToggle.tsx` — New component: Sun/Moon toggle wired to useThemeStore
- `src/components/layout/Header.tsx` — Imported ThemeToggle, added font-display class to heading
- `src/components/layout/DashboardLayout.tsx` — Added SVG noise texture overlay div
- `src/components/main/KpiCards.tsx` — Gradient border wrapper on cards, font-mono on values
