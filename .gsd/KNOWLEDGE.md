# Knowledge Base

<!-- Append-only. Non-obvious rules, recurring gotchas, and useful patterns
     discovered during execution. Only add entries that would save future
     agents from repeating investigation. -->

## eslint-plugin-react-hooks v7 includes React Compiler rules

As of react-hooks v7, the plugin bundles React Compiler lint rules (`purity`, `set-state-in-effect`, `preserve-manual-memoization`) that are enabled by default in `recommended` config. If the project doesn't use React Compiler, these produce false positives:
- `purity`: Flags `Date.now()` in render as impure function call
- `set-state-in-effect`: Flags `setState` in effects that sync external props to local state
- `preserve-manual-memoization`: Flags granular useMemo deps that differ from inferred deps

**Fix:** Explicitly disable all three in eslint config rules: `'react-hooks/purity': 'off'`, etc.

## npm ERESOLVE with eslint 10 + react-hooks plugin

When `npm install -D eslint` resolves to eslint@10, it conflicts with eslint-plugin-react-hooks v7 which peer-requires `eslint@^3-9`. Pin `eslint@^9` explicitly.

## eslint-disable-next-line doesn't suppress react-hooks/exhaustive-deps in v7

In react-hooks v7, `// eslint-disable-next-line react-hooks/exhaustive-deps` comments may not work as expected for some rules. Fixing the actual dependency array is more reliable than suppressing.

## window type assertion in strict TypeScript

`window as Record<string, unknown>` fails because Window and Record don't overlap sufficiently. Use two-step: `window as unknown as Record<string, unknown>`.

## .prettierignore needed for .gsd/ metadata

GSD agent metadata files (.gsd/, .bg-shell/) are auto-generated markdown that doesn't conform to Prettier formatting rules. Without a `.prettierignore`, `npx prettier --check .` reports these as unformatted and fails CI/verification. Add `.gsd/` and `.bg-shell/` to `.prettierignore` in any project using both GSD and Prettier.
