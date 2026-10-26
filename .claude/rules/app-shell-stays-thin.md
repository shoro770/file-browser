---
date: 2026-10-26
reason: Epic 4 retro findings 4 and 5 (App.tsx grew +79 lines across three stories into an announcement state machine and carried the only eslint-disable)
paths:
  - "src/App.tsx"
  - "src/hooks/**"
---

# The app shell stays thin; behavior moves into hooks

Refresh added `announce`, `say`, `announceFrame`, `awaiting`, `selectedIdRef` and `announcedCount` to `App.tsx`, which Epic 5 touches next for the theme control. `src/architecture.test.ts` now fails if `App.tsx` exceeds 220 lines or any non-test `src` file contains `eslint-disable`.

- Before adding state, effects or refs to `App.tsx`, extract the existing announcement logic into a hook under `src/hooks/` (for example `useAnnouncer`) with its own test. The shell composes hooks and renders.
- The new theme control (Epic 5) lives in its own hook and component, not in `App.tsx`.
- Fix a dependency-array warning by making the dependency stable (`useCallback`, a ref), not by suppressing the lint. Never raise the line cap or add `eslint-disable` to pass the test.

## Bad

```tsx
// App.tsx
const [theme, setTheme] = useState(readTheme())   // theme state, effect and persistence inline
useEffect(() => { /* announce + persist + apply */ }, []) // eslint-disable-line
```

## Good

```tsx
// App.tsx
const { status, announce } = useAnnouncer()
const { theme, setTheme } = useTheme()             // hooks/useTheme.ts owns storage and the attribute
```
