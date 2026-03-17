# S03: Layout Shell — Research

**Date:** 2026-03-12

## Summary

S03 delivers the CSS Grid dashboard layout, collapsible sidebar sections, and responsive breakpoints (R009, R010, R011). The vanilla app provides a clear reference: a `320px + 1fr` two-column grid with a full-height sidebar, sticky header, and scrollable main area. At 1024px it collapses to single-column with a hamburger toggle; at 640px it stacks vertically with simplified KPI grid.

The critical gap is that **shadcn/ui tooling isn't bootstrapped yet**. S01 set up the oklch theme variables and Tailwind v4, but no `components.json`, no `cn()` utility, no `radix-ui`, `clsx`, `tailwind-merge`, or `lucide-react` are installed. S03 must initialize the shadcn CLI, install these foundation deps, and add the Collapsible component — then build the layout shell on top.

The layout itself is straightforward CSS Grid in Tailwind. The collapsible sections use Radix Collapsible primitives (via shadcn/ui's thin wrapper), which expose `--radix-collapsible-content-height` for smooth height animation via CSS keyframes. The responsive behavior is standard Tailwind breakpoint classes plus a state-driven mobile sidebar overlay. No exotic patterns needed — the risk is correctly wiring `cn()` into the existing `src/lib/utils.ts` without clobbering the domain utilities already there.

## Recommendation

**Bootstrap shadcn/ui CLI + deps first, then build layout components bottom-up.**

1. Install missing deps: `radix-ui`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`
2. Create `components.json` for shadcn CLI (rsc: false, Tailwind v4 — leave config blank, css: `src/index.css`, aliases match existing `@/` paths)
3. Add `cn()` to `src/lib/utils.ts` alongside existing domain utilities (append, don't replace)
4. Use shadcn CLI to add collapsible component → creates `src/components/ui/collapsible.tsx`
5. Build layout components: `DashboardLayout`, `Sidebar`, `SidebarSection` (wraps Collapsible), `Header`
6. Wire responsive behavior with Tailwind `lg:` breakpoint + React state for mobile sidebar toggle
7. Verify at desktop, 1024px, and 640px widths in browser

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Collapsible sections with animation | `radix-ui` Collapsible via shadcn/ui wrapper | Accessible, keyboard-navigable, exposes CSS vars for animated height transitions. Vanilla app rolled its own max-height animation — Radix is better. |
| Conditional Tailwind class merging | `clsx` + `tailwind-merge` via `cn()` | Standard shadcn pattern. Every component downstream will need this. Prevents conflicting Tailwind classes. |
| Icons (chevrons, hamburger, logo) | `lucide-react` | Already spec'd as shadcn icon library. Consistent icon set across all future components. |
| Mobile sidebar overlay backdrop | Tailwind classes + React state | Simple enough for Tailwind. No need for Radix Dialog/Sheet for this — it's just a visibility toggle with backdrop. |

## Existing Code and Patterns

- `style.css:169-210` — Vanilla dashboard grid: `grid-template-columns: 320px 1fr`, `grid-template-rows: auto 1fr`. Sidebar spans all rows, header+main in column 2. Direct reference for Tailwind grid recreation.
- `style.css:846-900` — Vanilla responsive breakpoints. At 1024px: single-column grid, sidebar loses border-right, header becomes sticky. At 640px: KPI goes 1-col, header-stats hidden, reduced padding. Map these to `lg:` and `sm:` Tailwind breakpoints.
- `style.css:935-965` — Vanilla collapsible: `section-toggle` flex row with chevron rotation (`-90deg` when collapsed), `section-content` uses `max-height: 1200px → 0` transition. Replace entirely with Radix Collapsible.
- `style.css:968-990` — Mobile sidebar toggle: hidden by default, `display: flex` at ≤1024px, sidebar gets `display: none` when `mobile-hidden` class applied. Reimplement as React state.
- `index.vanilla.html:29-45` — Dashboard structure: `<aside class="sidebar">` with logo, then sections, then action buttons. `<header class="header">` with hamburger + title + theme toggle. `<main class="main">` with KPI row + results.
- `src/theme.css` — oklch CSS variables for both light and dark modes. Already defines `--sidebar`, `--sidebar-foreground`, `--sidebar-border` etc. Layout components should use these via Tailwind: `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`.
- `src/index.css` — `@theme inline` block already maps all shadcn CSS vars to Tailwind `--color-*` tokens, including sidebar variants. Layout classes can use `bg-sidebar` etc. directly.
- `src/stores/theme-store.ts` — Theme toggle with DOM classList sync. Header's theme toggle button will call `useThemeStore().toggleTheme()`.
- `src/lib/utils.ts` — Currently has domain utilities only (parseStrikeFromSymbol, isExcludedSector, getTickerList). **Must add `cn()` here** — shadcn components import from `@/lib/utils`.
- `src/main.tsx` — Already wraps App in QueryClientProvider. No changes needed for layout.
- `src/App.tsx` — Currently a placeholder centered div. Replace with DashboardLayout rendering sidebar + main area.

## Constraints

- **`src/lib/utils.ts` is shared** — 26 existing tests import from here. Adding `cn()` must not break existing exports. Append only.
- **No `components.json` exists** — shadcn CLI needs it before `npx shadcn add collapsible` will work. Must create manually or via `npx shadcn init` (but init may overwrite CSS files — safer to create manually).
- **Tailwind v4 + shadcn** — `tailwind.config` must be blank in `components.json` (Decision #12, shadcn docs confirm for v4).
- **`noUnusedLocals: true`** in tsconfig — any new import must be consumed. Placeholder components must actually use their props.
- **S04 depends on DashboardLayout + Sidebar** — exported components must accept children/slots for sidebar content injection. Design API as `<DashboardLayout sidebar={<Sidebar>...</Sidebar>}>` or use composition with named children.
- **320px sidebar width** comes from vanilla app. Using `w-80` (320px) in Tailwind. Must be fixed width, not flex-shrink.
- **Theme already applies `class="dark"` on html element** — layout components using `dark:` variant are already functional via the `@custom-variant dark` in index.css.

## Common Pitfalls

- **shadcn `init` overwriting CSS** — Running `npx shadcn init` can overwrite `index.css` and add a new `globals.css`. Since S01 already set up the CSS chain (theme.css → index.css), it's safer to create `components.json` manually and install deps with npm directly. Then use `npx shadcn add collapsible` which only adds component files.
- **Radix Collapsible height animation** — The CSS animation using `--radix-collapsible-content-height` requires `overflow: hidden` on the content. Without it, content leaks during transition. Must add `overflow-hidden` class to CollapsibleContent.
- **Mobile sidebar z-index** — Overlay sidebar on mobile must sit above main content. Need `z-50` or similar, plus a backdrop overlay to close on outside click. Vanilla uses `display: none` toggle, but an overlay approach is more UX-friendly in React.
- **Grid height on mobile** — Vanilla switches from `height: 100dvh` (desktop) to `min-height: 100dvh` with `overflow: auto` on body at 1024px. Tailwind equivalent: `h-dvh lg:h-auto lg:min-h-dvh` — but simpler to just set `min-h-dvh` always and let the grid handle overflow.
- **Sidebar scroll containment** — Sidebar needs `overflow-y: auto` with `overscroll-behavior: contain` to prevent scroll-chaining to the body. Tailwind: `overflow-y-auto overscroll-contain`.
- **`cn()` import collision** — shadcn components import `cn` from `@/lib/utils`. The existing `utils.ts` exports domain functions. Adding `cn` as a named export works fine, but if a component does `import { cn } from '@/lib/utils'` it must not collide with any existing export name. Current exports: `parseStrikeFromSymbol`, `isExcludedSector`, `getTickerList` — no collision.

## Open Risks

- **shadcn CLI version compatibility with Tailwind v4** — shadcn v4.0.6 (latest) should handle Tailwind v4 correctly when `tailwind.config` is blank. But if the CLI auto-detects and generates incorrect CSS, may need to manually write the collapsible component file (it's only ~30 lines — low risk).
- **Sidebar width on tablets** — 320px sidebar takes 31% of a 1024px screen. The vanilla app collapses to single-column at 1024px, which is correct. But between 1024-1280px the sidebar may feel tight. Not a blocker — matches existing behavior.
- **Verifying responsive behavior** — Need to visually confirm layout at 1024px and 640px. Vitest can't test visual layouts. Browser tools are the verification method.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| shadcn/ui | `shadcn/ui@shadcn` (16.1K installs) | available — `npx skills add shadcn/ui@shadcn` |
| Tailwind v4 + shadcn | `jezweb/claude-skills@tailwind-v4-shadcn` (2.7K installs) | available — `npx skills add jezweb/claude-skills@tailwind-v4-shadcn` |
| Radix UI | `sickn33/antigravity-awesome-skills@radix-ui-design-system` (246 installs) | available — low install count, skip |

The shadcn/ui skill (16.1K installs) would be useful here for correct CLI usage and component patterns. The tailwind-v4-shadcn combo skill is also relevant. Neither is installed.

## Sources

- Radix Collapsible API: animated height via `--radix-collapsible-content-height` CSS variable, `data-state="open"|"closed"` attributes for animation triggers (source: Radix Primitives docs)
- shadcn/ui Collapsible component: thin wrapper over radix-ui, deps on `radix-ui` package only (source: `npx shadcn view collapsible` output)
- shadcn/ui manual install: requires `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `tw-animate-css`; `cn()` utility in `@/lib/utils`; `components.json` with `rsc: false` and blank `tailwind.config` for v4 (source: shadcn/ui installation docs)
- Vanilla layout structure: CSS Grid `320px 1fr` columns, `auto 1fr` rows, sidebar spans all rows, responsive at 1024px and 640px (source: `style.css` lines 169-900)
