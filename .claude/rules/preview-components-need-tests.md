---
date: 2026-10-26
reason: Epic 2 retro finding 3 (deferred-work.md grew from 9 to 14 entries; logging a gap does not retire the risk)
paths:
  - "src/components/PreviewPane.tsx"
  - "src/components/preview/**"
  - "src/components/MetadataCard.tsx"
  - "src/components/PreviewHeader.tsx"
  - "src/hooks/usePreview.ts"
---

# Preview components are tested once a DOM environment exists

Every Epic 2 story logged the same gap in `deferred-work.md`. That satisfies [component-unit-tests.md](component-unit-tests.md) but leaves dropping `onError`, the per-source key or the `truncated` guard invisible to build, lint and tests. Extends [component-tests.md](component-tests.md).

- Once a DOM test environment exists (retro item `epic-2-retro-item-5`), every preview component change ships with a test that renders it and asserts its role and state: `region`, `aria-labelledby`, `tabindex`, the banner, the card's failure text and the announcement.
- Each deferred entry that names a preview component is closed by a test, not by a note. Remove the entry in the same commit.
- Until the environment exists, each new renderer adds an entry to `deferred-work.md` and the story says it was not exercised in a browser. Never call it verified.

## Bad

```tsx
it('renders', () => {
  render(<TextPreview source={source} />)
  expect(document.body).toBeTruthy() // no role, no banner, no text-node check
})
```

## Good

```tsx
it('shows a pinned banner and plain text for a truncated file', () => {
  render(<TextPreview source={truncatedSource} />)
  expect(screen.getByText(/Showing the first 1 MB of 4.2 MB/)).toBeInTheDocument()
  expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument() // literal text
})
```
