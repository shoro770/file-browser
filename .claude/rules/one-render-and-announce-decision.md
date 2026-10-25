---
date: 2026-10-26
reason: Epic 2 retro findings 5 and 6 (render and announcement drifted apart in review; failure state must retry on reselect)
paths:
  - "src/components/PreviewPane.tsx"
  - "src/components/preview/**"
  - "src/lib/preview.ts"
---

# The pane renders and announces from one decision

Stories 2.2 and 2.3 each found the pane announcing "{name}: no preview available" for a file it actually rendered. One shared decision (`rendererFor` in `lib/preview.ts`) fixes that, and Story 2.4 keyed failures per source so that reselecting a failed file retries.

- Choose the renderer once, with `rendererFor`, and use that result for both the rendered branch and the status announcement. Never re-derive the kind in a second place.
- Key a failed outcome by the source object (new for every selection), not by file id, so selecting the same file again retries.
- Never read, log or show a caught error. The user sees the fixed failure text from `cardExplanation`.
- A new renderer (Epic 3: Markdown, DOCX, PDF) extends `rendererFor` and `cardExplanation`, and adds a unit test for the new branch.

## Bad

```tsx
const kind = resolvePreviewKind(name, mime)           // second derivation in the component
if (kind === 'text') announce(`${name}: no preview available`)
return <PreviewBoundary key={id}>...</PreviewBoundary> // failure sticks to the id
// catch (e) { setMessage(String(e)) }                  // raw error text in the UI
```

## Good

```tsx
const renderer = rendererFor(kind, hasText, hasImage) // one decision
if (renderer === 'card') announce(`${name}: no preview available`)
return <PreviewBoundary key={sourceKey}>{render(renderer)}</PreviewBoundary>
```
