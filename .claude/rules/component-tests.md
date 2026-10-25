---
paths:
  - "src/components/**"
  - "src/hooks/**"
  - "src/App.tsx"
---

# Component behavior needs tests

Epic 1 retro (A1): every story deferred the same gap — the component layer has no tests, so policy behavior (single `tabIndex=0`, key map, `role="group"`, `aria-*`, focus handling) can regress while build, lint and tests stay green.

- Put decision logic in pure `src/lib/` helpers with unit tests, and keep components thin. Do not grow `Tree.tsx` further without first extracting its logic into `lib/`.
- Once a DOM test environment exists, any change to tree, divider or toolbar behavior ships with a component test for that behavior. Until it exists, add an entry to `_bmad-output/implementation-artifacts/deferred-work.md` naming the untested behavior.
- Never describe component behavior as verified from build, lint or unit tests alone. Say it was not exercised in a browser unless it was.
