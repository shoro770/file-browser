---
date: 2026-10-26
reason: Epic 3 retro findings 4 and 11 (three lazy renderers shipped a blank body while the chunk loaded; HTML must have one sanitizing chokepoint)
paths:
  - "src/components/**"
  - "src/services/**"
---

# Lazy renderers show a loading status, and all HTML goes through `sanitize`

The `mammoth` chunk is 95 KB gzipped, so the first `.docx` preview showed an empty pane while it loaded. The pane must never be blank without an explanation. `src/architecture.test.ts` now enforces both points below.

- Wrap every lazy renderer in `<Suspense fallback={<PreviewLoading />}>`. Never omit the fallback or pass `null` or `undefined`.
- Only `services/sanitize.ts` turns parsed markup into DOM. No other file uses `insertAdjacentHTML`, `outerHTML`, `createContextualFragment`, `DOMParser` or `document.write`.
- A new HTML-producing renderer (Epic 4 and later) reuses `sanitize` and gets a hostile-input case in `sanitize.test.ts`.

## Bad

```tsx
<Suspense fallback={null}><MarkdownPreview source={source} /></Suspense>
el.insertAdjacentHTML('beforeend', html)
```

## Good

```tsx
<Suspense fallback={<PreviewLoading />}><MarkdownPreview source={source} /></Suspense>
el.replaceChildren(sanitize(html))
```
