---
estimated_steps: 5
estimated_files: 6
---

# T01: Load fonts, add noise texture + gradient borders, build ThemeToggle

**Slice:** S07 — Visual Polish + Animation
**Milestone:** M001

## Description

Deliver all CSS/markup visual polish with zero new npm dependencies. Three concerns: (1) CDN font loading for the Space Grotesk / General Sans / JetBrains Mono trio with Tailwind font-family wiring, (2) SVG noise texture overlay using `<feTurbulence>` for terminal grain aesthetic, (3) gradient borders on KPI cards, and (4) a ThemeToggle component with Lucide Sun/Moon icons wired to the existing themeStore, placed in the Header actions slot.

## Steps

1. **Add font `<link>` tags to index.html** — Preconnect to `fonts.googleapis.com`, `fonts.gstatic.com`, `api.fontshare.com`. Add CSS links for Space Grotesk (400,500,600,700), JetBrains Mono (400,500,600), and General Sans (400,500,600,700) with `display=swap`.

2. **Wire fonts into Tailwind theme** — In `src/index.css` @theme inline block, add `--font-sans: 'General Sans', ui-sans-serif, system-ui, sans-serif;` and `--font-display: 'Space Grotesk', var(--font-sans);` and `--font-mono: 'JetBrains Mono', ui-monospace, monospace;`. Apply `font-display` class to the WheelScan heading in Header. Verify tabular-nums cells pick up JetBrains Mono via `font-mono`.

3. **Add SVG noise texture overlay in DashboardLayout** — Create a fixed-position `<div>` at z-[1] with `pointer-events-none inset-0` containing an inline `<svg>` with `<filter>` using `<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3">` and `<feColorMatrix>` for opacity. Rect fills the filter. Set the overlay div to ~4% opacity. This goes inside the DashboardLayout grid wrapper, above backgrounds but below all interactive content.

4. **Add gradient border to KPI cards** — In KpiCards.tsx, replace the static `border border-border` with a gradient border technique: use a wrapper div with `bg-gradient-to-br from-primary/30 via-border to-border p-px rounded-lg`, with the inner card having solid `bg-card` and matching rounded corners. Subtle emerald-to-border gradient.

5. **Create ThemeToggle component and wire into Header** — New file `src/components/layout/ThemeToggle.tsx`. Imports `Sun` and `Moon` from lucide-react, reads `theme`/`toggleTheme` from `useThemeStore`. Renders a button that shows Sun when dark (switch to light), Moon when light (switch to dark), with a CSS `transition-transform` for rotation on click. Place ThemeToggle inside Header by importing it directly (Header already has `actions` slot but DashboardLayout owns Header — simplest to import themeStore in Header and render toggle inline, or pass via actions prop from DashboardLayout). Per S07 research recommendation: import directly in Header for simplicity.

## Must-Haves

- [ ] Three CDN font families load successfully (no 404s, correct weights)
- [ ] Tailwind --font-sans, --font-display, --font-mono tokens resolve to correct families
- [ ] Noise texture overlay visible but subtle (~4% opacity), non-interactive (pointer-events-none)
- [ ] KPI cards show gradient border (emerald primary glow to border fade)
- [ ] ThemeToggle button in header toggles dark ↔ light mode
- [ ] ThemeToggle reads from and writes to useThemeStore (persisted)
- [ ] Zero new npm dependencies added

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — 222/222 pass (no behavior changes)
- Browser: inspect computed font-family on heading → contains "Space Grotesk"
- Browser: inspect computed font-family on body text → contains "General Sans"
- Browser: noise overlay div visible in DOM with correct styles
- Browser: click theme toggle → class on `<html>` switches between dark/light

## Inputs

- `index.html` — bare `<head>` with no font links
- `src/index.css` — @theme inline block with color tokens but no font tokens
- `src/components/layout/Header.tsx` — has `actions` ReactNode slot, renders WheelScan heading
- `src/components/layout/DashboardLayout.tsx` — grid wrapper, renders Header internally (Decision #25)
- `src/components/main/KpiCards.tsx` — 4 KPI cards with `border border-border`
- `src/stores/theme-store.ts` — toggleTheme(), theme state, persisted

## Expected Output

- `index.html` — updated with font preconnect + CSS link tags
- `src/index.css` — updated with --font-sans, --font-display, --font-mono in @theme
- `src/components/layout/ThemeToggle.tsx` — new component with Sun/Moon toggle
- `src/components/layout/Header.tsx` — imports and renders ThemeToggle in actions area
- `src/components/layout/DashboardLayout.tsx` — noise texture overlay added
- `src/components/main/KpiCards.tsx` — gradient border wrapper on cards
