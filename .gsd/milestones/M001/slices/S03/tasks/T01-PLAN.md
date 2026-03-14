---
estimated_steps: 7
estimated_files: 9
---

# T01: Bootstrap shadcn/ui deps and build layout components

**Slice:** S03 — Layout Shell
**Milestone:** M001

## Description

Install all shadcn/ui foundation dependencies, create `components.json`, add `cn()` to the existing utils module, add the Collapsible component, and build the four layout components: DashboardLayout (CSS Grid shell), Header, Sidebar, and SidebarSection (Radix Collapsible wrapper). Wire everything into App.tsx. This task delivers the static layout structure — mobile interactivity comes in T02.

## Steps

1. Install deps: `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `tw-animate-css`, `@radix-ui/react-collapsible`
2. Create `components.json` manually — `rsc: false`, blank `tailwind.config`, `css: src/index.css`, aliases matching existing `@/` paths. Do NOT run `npx shadcn init` (risks overwriting CSS).
3. Append `cn()` export to `src/lib/utils.ts` — import `clsx` and `twMerge`, compose them. Existing exports untouched.
4. Add Collapsible component — try `npx shadcn add collapsible`. If CLI fails with Tailwind v4, write the component manually (it's ~30 lines wrapping Radix primitives).
5. Build `src/components/layout/DashboardLayout.tsx` — CSS Grid with `grid-cols-1 lg:grid-cols-[320px_1fr]`, `min-h-dvh`, accepts `sidebar` and `children` props.
6. Build `src/components/layout/Sidebar.tsx` — fixed `w-80`, `overflow-y-auto overscroll-contain`, uses `bg-sidebar text-sidebar-foreground border-sidebar-border` theme tokens. Accepts `children` for section injection by S04. Include placeholder sections using SidebarSection.
7. Build `src/components/layout/SidebarSection.tsx` — wraps `CollapsibleTrigger` + `CollapsibleContent`. Trigger shows title + ChevronDown icon that rotates on open. Content uses `overflow-hidden` and CSS animation via `--radix-collapsible-content-height` for smooth height transitions.
8. Build `src/components/layout/Header.tsx` — top bar with app title, placeholder slot for hamburger button (hidden on desktop, visible on mobile), placeholder slot for theme toggle.
9. Replace `src/App.tsx` with DashboardLayout rendering Sidebar (with demo SidebarSections) in the sidebar slot and placeholder content in main area.

## Must-Haves

- [ ] `cn()` appended to `src/lib/utils.ts` without breaking existing 26 test imports
- [ ] `components.json` created with correct shadcn v4 config (rsc: false, blank tailwind.config)
- [ ] Collapsible component exists at `src/components/ui/collapsible.tsx`
- [ ] DashboardLayout renders CSS Grid with `320px + 1fr` columns on desktop
- [ ] SidebarSection animates height using Radix Collapsible with smooth transition
- [ ] Header renders with app title and mobile-only hamburger placeholder

## Verification

- `npx tsc --noEmit` — zero TypeScript errors
- `npx vitest run` — all 128 existing tests still pass
- `npm run dev` — layout renders with sidebar + main area, sections collapse/expand

## Inputs

- `src/lib/utils.ts` — existing domain utilities (parseStrikeFromSymbol, isExcludedSector, getTickerList). Append cn() without modifying.
- `src/index.css` — existing Tailwind import chain + @theme inline block with sidebar color tokens
- `src/theme.css` — oklch CSS variables for sidebar-*, background, foreground, etc.
- S01 summary — path aliases via @/, theme.css → index.css pattern, `noUnusedLocals: true` in tsconfig

## Expected Output

- `components.json` — shadcn CLI config for future component additions
- `src/lib/utils.ts` — now exports `cn()` alongside existing domain utils
- `src/components/ui/collapsible.tsx` — Radix Collapsible wrapper
- `src/components/layout/DashboardLayout.tsx` — CSS Grid shell accepting sidebar + children
- `src/components/layout/Sidebar.tsx` — sidebar container with theme colors
- `src/components/layout/SidebarSection.tsx` — collapsible section with animated height
- `src/components/layout/Header.tsx` — top bar with title and placeholder slots
- `src/App.tsx` — wired to render full layout with demo content
