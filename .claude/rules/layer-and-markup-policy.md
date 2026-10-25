---
date: 2026-10-26
reason: Epic 2 retro finding 2 (layering, read-only and no-network policy held only by convention)
paths:
  - "src/components/**"
  - "src/hooks/**"
  - "src/services/**"
  - "src/App.tsx"
---

# Layer and markup policy is enforced by a test, not by memory

Epic 2 kept every boundary, but only because reviewers grepped for violations by hand. `src/architecture.test.ts` now scans non-test `src` files and fails on any of these.

- `components/` and `App.tsx` never import `services/`. Services are reached through `hooks/` (AD-1).
- `URL.createObjectURL` and `revokeObjectURL` appear only in `services/previewSession.ts` (AD-10).
- No `dangerouslySetInnerHTML`, `innerHTML`, inline `style=` or `fetch(` anywhere in non-test code (AD-11, AD-12, NFR5, NFR6).
- Do not edit the scanner or `scripts/check-readonly.mjs` to make a change pass. Fix the code.

## Bad

```tsx
import { readItemFile } from '../services/tree' // component reaches into services
const url = URL.createObjectURL(file)             // outside previewSession
return <div style={{ width }} dangerouslySetInnerHTML={{ __html: html }} />
```

## Good

```tsx
const { state } = usePreview(selectedId)          // hook bridges to the session
return <img className="image-preview" src={state.imageUrl} alt={name} />
```
