---
date: 2026-10-25
reason: AD-3/AD-10 violation prevention (ensuring stable path-based IDs instead of random values)
paths:
  - "src/services/**"
  - "src/lib/**"
---

# Tree node ids derive from the path, nothing else

A node id is its slash-joined path from the root (`src/a.ts`). Selection, expansion and the children cache are keyed by it, so an id that changes between reads breaks them silently.

- Derive ids only from the parent id and the entry name (`toId`).
- Never use `crypto.randomUUID()`, `Math.random()`, `Date.now()`, counters or object identity in an id.
- `src/services/tree.test.ts` enforces this: it fails if an id depends on anything but the path.

## Bad

```ts
const id = crypto.randomUUID()
const id = `${parentId}/${entry.name}-${Date.now()}`
const id = String(++counter)
```

## Good

```ts
const id = toId(parentId, entry.name) // 'src/a.ts' every time
```
