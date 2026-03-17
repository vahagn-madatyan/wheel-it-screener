# T01: Delete vanilla files and remove tw-animate-css remnant

## Slice Context
**Goal:** Old vanilla files removed, ESLint + Prettier configured, ChainModal lazy-loaded, static SPA builds under 500KB.
**This task:** Removes legacy vanilla JS/CSS files and cleans up the orphaned tw-animate-css dependency.

## Description
Delete the 4 vanilla files (app.js, style.css, base.css, index.vanilla.html) that were preserved during migration. Also remove the tw-animate-css package — S07 removed its usage from dialog.tsx but it's still imported in index.css and still used in tooltip.tsx (line 46). Replace the tooltip animation classes with standard Tailwind equivalents.

## Must-Haves
- app.js, style.css, base.css, index.vanilla.html all deleted
- `@import "tw-animate-css"` removed from src/index.css
- tw-animate-css classes in tooltip.tsx replaced with Tailwind transition equivalents
- tw-animate-css uninstalled from devDependencies
- Build passes, all 222 tests pass

## Steps

1. **Delete vanilla files:**
   ```bash
   rm app.js style.css base.css index.vanilla.html
   ```

2. **Fix tooltip.tsx (line 46):** The current class string is:
   ```
   "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
   ```
   Replace with Tailwind transition + data-attribute classes that achieve the same fade+zoom effect:
   ```
   "transition-all duration-150 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
   ```
   
   Wait — those are tw-animate-css keyframe classes. Since we're removing tw-animate-css, use pure CSS transition approach instead. Replace the entire animation portion with:
   ```
   "transition-[opacity,transform] duration-200 data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=closed]:scale-95"
   ```
   Also add base classes `opacity-0 scale-95` to the default so the open state overrides them. Check the full className context to place correctly.

3. **Remove tw-animate-css import from src/index.css:**
   Delete the line `@import "tw-animate-css";` (line 2).

4. **Uninstall the package:**
   ```bash
   npm uninstall tw-animate-css
   ```

5. **Verify no remaining references:**
   ```bash
   grep -r "tw-animate-css\|animate-in\|animate-out\|fade-in-0\|fade-out-0\|zoom-in-95\|zoom-out-95" src/ --include="*.tsx" --include="*.ts" --include="*.css"
   ```
   Should return nothing.

6. **Run verification suite:**
   ```bash
   npx tsc --noEmit
   npx vitest run
   npm run build
   ```
   All must pass. Tests: 222 pass. Build: succeeds.

## Verification
```bash
# Vanilla files gone
ls app.js style.css base.css index.vanilla.html 2>&1 | grep -c "No such file"
# Expected: 4

# tw-animate-css fully removed
grep -rc "tw-animate-css" src/ package.json
# Expected: 0 (or no output)

# Build still works
npx tsc --noEmit    # 0 errors
npx vitest run      # 222 pass
npm run build       # succeeds
```

## Inputs
- `app.js` — 55KB vanilla JS monolith (delete)
- `style.css` — 29KB vanilla CSS (delete)
- `base.css` — 2KB vanilla CSS reset (delete)
- `index.vanilla.html` — 24KB preserved vanilla layout reference (delete)
- `src/index.css` — line 2 has `@import "tw-animate-css"` to remove
- `src/components/ui/tooltip.tsx` — line 46 has tw-animate-css animation classes to replace
- `package.json` — has `tw-animate-css` in devDependencies

## Observability Impact
- **Removed:** tw-animate-css keyframe animations from tooltip — now uses CSS transitions. No runtime signals change; tooltip open/close is purely visual.
- **Inspection:** `grep -r "tw-animate-css" src/ package.json` should return nothing post-task. `ls app.js style.css base.css index.vanilla.html` should all be "No such file".
- **Failure visibility:** If tw-animate-css remnants remain, tooltip animations will break silently (no error, just missing CSS). Build and tsc will still pass — visual inspection is the only signal.

## Expected Output
- 4 vanilla files deleted from project root
- src/index.css: no tw-animate-css import
- tooltip.tsx: uses standard Tailwind transition classes instead of tw-animate-css keyframes
- package.json: tw-animate-css removed from devDependencies
- tsc, vitest, and build all pass clean
