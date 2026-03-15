---
estimated_steps: 5
estimated_files: 5
---

# T01: Build reusable UI primitives and API Keys section

**Slice:** S04 — Sidebar Controls
**Milestone:** M001

## Description

Create the 4 reusable input primitives (Switch, Slider, NumberInput, ApiKeyInput) that all sidebar sections will consume, then compose the ApiKeysSection to prove the store-binding pattern works end-to-end. These primitives follow the data-slot pattern established by `src/components/ui/collapsible.tsx`.

## Steps

1. **Radix Switch wrapper** (`src/components/ui/switch.tsx`): Import from `@radix-ui/react-switch`. Wrap Root with `data-slot="switch"` and Thumb with `data-slot="switch-thumb"`. Style with Tailwind: 42×24px track with `data-[state=checked]:bg-primary` / `data-[state=unchecked]:bg-muted`, 20×20px thumb with `data-[state=checked]:translate-x-[18px]` transition. Accept `checked`, `onCheckedChange`, `disabled`, `className` props.

2. **Radix Slider wrapper** (`src/components/ui/slider.tsx`): Import from `@radix-ui/react-slider`. Wrap Root > Track > Range > Thumb with data-slots. Style: Track as 4px-high bg-muted rounded bar, Range as bg-primary fill, Thumb as 16×16px ring-2 circle. Accept `value`, `onValueChange`, `min`, `max`, `step`, `className` props. Since Radix Slider uses `value` as array, adapter wraps/unwraps for single-value use.

3. **NumberInput** (`src/components/sidebar/NumberInput.tsx`): Renders `<label>` + `<input type="number">` with label/value/onChange/min/max/step/placeholder props. For `number | undefined` fields (maxDebtEquity, minNetMargin, minSalesGrowth, minROE), converts empty string → `undefined` and `undefined` → `""` for display. For required fields, `parseFloat(value) || 0`. Uses internal string state to allow editing (avoids cursor jumping), commits to store on blur/enter.

4. **ApiKeyInput** (`src/components/sidebar/ApiKeyInput.tsx`): Renders masked input with show/hide eye toggle (`Eye`/`EyeOff` from lucide-react), status badge (green "Set" / neutral "Not Set" from apiKeyStore.status), and label. `type` toggles between `"password"` and `"text"` via local state. Accepts `label`, `value`, `onChange`, `status`, `placeholder`, `helpText` props.

5. **ApiKeysSection** (`src/components/sidebar/ApiKeysSection.tsx`): Composes 3 ApiKeyInput groups — Finnhub (single input), Alpaca (Key ID + Secret Key, calls `setAlpacaKeys(keyId, secretKey)` on each change using current store values for the other field), Massive.com (single input). Reads `useApiKeyStore` for values and status, calls store setters on change. Wraps content for injection as children of SidebarSection.

## Must-Haves

- [ ] Switch renders with accessible Radix primitives, styled for dark theme
- [ ] Slider renders with Track/Range/Thumb, accepts single-value API
- [ ] NumberInput handles `number | undefined` ↔ empty string conversion for optional fields
- [ ] NumberInput uses internal string state and commits on blur/enter (no cursor jumping)
- [ ] ApiKeyInput toggles password visibility, shows status badge
- [ ] ApiKeysSection reads from and writes to apiKeyStore correctly
- [ ] Alpaca coordinated update — each field change passes current value of other field from store

## Verification

- `npx tsc --noEmit` — zero errors
- `npx vitest run` — all 188 existing tests pass (no regressions)
- Dev server: API Keys section renders with 4 inputs (Finnhub, Alpaca Key ID, Alpaca Secret, Massive)
- Dev server: typing in Finnhub key field → `useApiKeyStore.getState().status.finnhub` changes to "set"
- Dev server: eye icon toggles input between masked and visible text

## Inputs

- `src/components/ui/collapsible.tsx` — pattern for data-slot Radix wrappers
- `src/stores/api-key-store.ts` — store shape and setters for API key binding
- `src/lib/utils.ts` — cn() for class merging
- `src/components/layout/SidebarSection.tsx` — children injection pattern

## Expected Output

- `src/components/ui/switch.tsx` — Radix Switch wrapper component
- `src/components/ui/slider.tsx` — Radix Slider wrapper component
- `src/components/sidebar/NumberInput.tsx` — Labeled number input with undefined handling
- `src/components/sidebar/ApiKeyInput.tsx` — Masked input with status badge
- `src/components/sidebar/ApiKeysSection.tsx` — Composed API keys sidebar section
