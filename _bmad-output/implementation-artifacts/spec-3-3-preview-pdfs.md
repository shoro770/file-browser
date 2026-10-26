---
title: 'Preview PDFs'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: '591d1a8e0aa69d63fe73ab5489316ade4eb3da23'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A `.pdf` resolves to the `pdf` kind, but `rendererFor` sends it to the Metadata Card, so an exported report cannot be read in the app. `lib/pdf.ts` still holds the retired `countPdfPages`.

**Approach:** `previewSession` creates the `blob:` URL (typed `application/pdf`) only for a selected `pdf`. A lazily loaded `PdfPreview` embeds it in `<object type="application/pdf">`, so the browser's own viewer shows a continuous scroll. No page count, no custom navigation or zoom, no `fetch`. `rendererFor` gains a `pdf` branch.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components` (AD-1). Only `previewSession` calls `URL.createObjectURL`/`revokeObjectURL`; it creates the URL after its last `await`, tracks it in the same slot `end()` revokes, and never creates one at list time. The renderer is chosen once by `rendererFor`; that result drives the branch and the announcement, and a PDF announces "Previewing {name}" only. Size comes from CSS classes: no `style=`, `fetch(`, `innerHTML`, icon library or new dependency. `PdfPreview` loads through `React.lazy` inside `Suspense` inside `PreviewBoundary` (boundary outside Suspense); initial JS stays under 150 KB gzipped, measured, and the lazy chunk size recorded. A throw, a missing URL, or a detectable load failure renders the Metadata Card with `RENDER_FAILED_MESSAGE`, keyed by source object so reselecting retries; the error is never read, logged or shown. `<object>` gets `title` = file name and a text fallback child, so the body is never blank. Zero-byte PDFs stay cards (resolver). All of `.claude/rules/*.md` applies.

**Never:** Add or change the meta CSP (Story 3.4); edit `AGENTS.md`, `scripts/check-readonly.mjs`, `src/architecture.test.ts`, `index.css` tokens, `resolvePreviewKind` tables or `RENDER_FAILED_MESSAGE`. Use `iframe`, `embed`, a PDF.js dependency, page counts or content sniffing. Read PDF bytes in JS. Write the user's files, make a network request, or commit in this planning pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid PDF | `a.pdf` or `application/pdf` | Header, then `<object>` filling the pane under it; browser viewer scrolls pages | N/A |
| Announcement | PDF ready | "Previewing a.pdf" only | N/A |
| Zero-byte PDF | size 0 | Card "This file is empty." | N/A |
| Corrupt or undisplayable | Object fires `error` | Card with failure text; announces "{name}: no preview available" | `renderFailed` |
| Corrupt, silent | Browser shows its own error in the viewer | Left as is; header stays | Not detectable (logged) |
| URL creation throws | `createObjectURL` throws | `failed` state, card | Existing path |
| Supersede | A selected, B before A ready | A returns `null`, owns no URL; B's URL revoked on the next selection or `close()` | N/A |
| Reselect | Same PDF after failure | New source object, fresh attempt | N/A |

</frozen-after-approval>

## Open Questions

Non-interactive run: each default is applied in the tasks. A human can overturn it.

- Corrupt PDFs — the browser viewer rarely fires `error` for a bad PDF, so the card shows only where detectable; default accepts the gap (epic AC says "where detectable"). Alternative: read the first 5 bytes for `%PDF-` (content sniffing, which Epic 2 forbids, so not chosen).
- Failure signal — React does not wire `onError` on `<object>` (verify against current React docs), so default is a native `error` listener added in an effect inside `PdfPreview`. Verify in Chrome that it ever fires.
- Embed fragment — default: plain `blob:` URL, no `#toolbar=0`, `#view=` or `#page=` (those are viewer controls; UX-DR16). 
- Keyboard — the pane region is already the tab stop; Chromium's viewer takes focus inside the object. Default: no extra handling; check in a browser that Tab can leave it and that the pane scrolls without a mouse; log if it traps.
- Lazy chunk — `PdfPreview` is a few hundred bytes; lazy is kept because AD-9 and the story AC require it.
- Manual checks (Chrome or Edge, `vite build` + `vite preview`): a multi-page PDF scrolls continuously, a corrupt PDF, a 20 MB PDF timed, rapid clicking, three themes, and CSP interplay with `object-src blob:` (Story 3.4 owns the CSP, but note the finding). Cannot be proven headlessly; run them or report not run.

## Code Map

- `src/lib/pdf.ts` -- delete `countPdfPages` (and its `FileItem` use only if unused); keep `isPdf` (already via `isPdfName` → resolver). No tests reference `countPdfPages`.
- `src/lib/preview.ts` + `preview.test.ts` -- `rendererFor(kind, hasText, hasImageUrl, hasPdfUrl = false)` returns `'pdf'` for kind `pdf` with a URL, else `card`; update JSDoc. Tests: pdf with and without URL, `a.doc` and zero-byte still card. `cardExplanation` unchanged.
- `src/types.ts` -- `PreviewSource.pdfUrl?: string` (set only for `pdf`; revoked by the session); `PdfPreviewProps { source: PreviewSource; onError?: () => void }`.
- `src/services/previewSession.ts` + test -- for `kind === 'pdf'`, `urls.createObjectURL(file.slice(0, file.size, 'application/pdf'))` after the last await, stored in `currentUrl`; throw → `failed`. Rename the shared local so one slot serves image and PDF. Tests: URL typed `application/pdf` and absent for non-PDF; revoked on next `open` and `close`; superseded session creates none; throw → `failed`; never created for text/docx.
- `src/components/preview/PdfPreview.tsx` (new) -- throws if `pdfUrl` is missing (boundary catches); renders `<div className="pdf-preview"><object className="pdf-preview__object" type="application/pdf" data={url} title={name}>fallback text</object></div>`; native `error` listener via ref + `useEffect` calls `onError`.
- `src/components/PreviewPane.tsx` -- `lazy(() => import('./preview/PdfPreview'))`; `pdf` branch under `PreviewBoundary key={key}` + `Suspense`, passing `onError={fail}`; `rendererOf` passes `!!pdfUrl`; `sourceKey` includes `pdfUrl`; update the announcement comment.
- `src/App.css` -- `.pdf-preview` height `calc(100% - var(--preview-header-height))`; `.pdf-preview__object` display block, width and height 100%, border 0. No new tokens.
- `src/components/preview/PdfPreview.test.tsx`, `PreviewPane.pdf.test.tsx` (new) -- see Tasks.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- append entries (browser checks, silent corrupt PDF, keyboard trap, `object-src` CSP note for 3.4). Leave existing entries; the Suspense-placeholder entry is extended to PDF.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts`, `src/lib/preview.ts`, `preview.test.ts` -- `pdfUrl`, `PdfPreviewProps`, `rendererFor` pdf branch with tests -- one render decision
- [x] `src/lib/pdf.ts` -- remove `countPdfPages`; run `grep -rn countPdfPages src` to confirm no users -- AD-3
- [x] `src/services/previewSession.ts` + `previewSession.test.ts` -- lazy typed PDF URL, revoke and supersede cases -- AD-10
- [x] `src/components/preview/PdfPreview.tsx`, `PreviewPane.tsx`, `src/App.css` -- renderer, lazy dispatch, CSS-only sizing -- AD-9, AD-12
- [x] Component tests (jsdom) -- `PdfPreview`: `getByTitle(name)` has `type="application/pdf"` and `data` equal to the URL, no `style` attribute, fallback text present, native `error` event calls `onError`, missing URL throws. `PreviewPane`: pdf shows region `aria-labelledby` header and `tabindex=0`, announces nothing for a good PDF, failure card plus "no preview available" after an `error` event, reselect retries, supersede keeps B, a zero-byte PDF is a card, StrictMode safe -- `preview-components-need-tests.md`
- [x] `deferred-work.md` -- entries above; run `vite build`, record initial JS and `PdfPreview-*` chunk gzip sizes in Implementation Notes
- [x] `npm run build`, `npm run lint`, `npm test`, then `git status --short` -- only files named here, this spec, `sprint-status.yaml`

**Acceptance Criteria:**
- Given a `.pdf`, when selected, then a sized `<object type="application/pdf">` fills the pane under the header with no page navigation or zoom controls of our own.
- Given `grep`, then `countPdfPages` and PDF `fetch()` are gone and no renderer calls `fetch(`.
- Given a PDF is selected, then its `blob:` URL is created by `previewSession` only then, revoked on the next selection or close, and a superseded selection owns none.
- Given `vite build`, then initial JS is under 150 KB gzipped, `PdfPreview` is a separate chunk, and both sizes are recorded.
- Given an `error` from the embed, then the Metadata Card shows the failure text and the pane announces "{name}: no preview available".
- Given the three gates, then all pass.

## Implementation Notes

**Measured with `vite build`:** initial JS `index-*.js` 250.42 kB, **78.81 kB gzip** (budget 150 kB; Story 3.2 measured 78.72 kB); lazy `PdfPreview-*.js` 0.64 kB, **0.40 kB gzip**, in its own chunk; no new dependency.

**Checks:** `npm run build`, `npm run lint` and `npm test` pass (350 tests). `grep -rnE "countPdfPages|fetch\(" src` matches only `src/architecture.test.ts` (the scanner's own pattern and fixtures); no renderer or service calls `fetch(`.

**Deviations:** none from the frozen intent. The listener is attached in a layout effect and reads the latest `onError` through a ref (review patch). The Matrix row "Corrupt, silent" is untestable headlessly and is logged.

**Not exercised in a browser:** everything beyond jsdom: no PDF viewer ran, so continuous scrolling, sizing under the header, keyboard entry and exit, whether the `<object>` ever fires `error`, a corrupt PDF, a large PDF, rapid clicking, three themes, and the CSP interplay. See `deferred-work.md`.

## Review Triage Log

Three layers (Blind Hunter, Edge Case Hunter, Verification Gap) ran on the diff. Loopbacks: none.

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Error listener attached in a passive effect could miss an early `error`; re-subscribes per render (BH, EC) | low | patch | Now a layout effect keyed by URL, reading the latest `onError` via ref; test added for a changed callback. |
| Revoked URL while old viewer still mounted may fire a spurious `error` (EC) | maybe-false | defer | `fail` is bound to the old source, so the new source is unaffected; whether the old viewer flickers to the card needs a browser. Covered by the browser-check entry. |
| `countPdfPages` removal unchecked (BH, EC) | false | rejected | grep finds no users; spec task required it. |
| No size or zero-size guard in the session for PDFs (BH, EC) | false | rejected | The resolver returns `metadata` for size 0; tested in `previewSession.test.ts` and `preview.test.ts`. |
| `.pdf` that is not a PDF shows the browser error (BH) | medium (unverified) | defer | Logged as the silent-corrupt entry. |
| `hasPdfUrl` default false, positional booleans, two URL fields (BH, EC) | low | rejected | Single production caller; fix touches many tests and the public type. |
| `.pdf-preview` height needs a definite parent (BH, EC) | false | rejected | `.preview` has `height: 100%`, the same pattern as `.image-preview`. |
| Tests pass trivially without a listener (BH) | false | rejected | The error tests assert `onError` was called. |
| Keyboard trap in the viewer; fallback has no download link (BH) | medium (unverified) | defer | Logged for a browser check; a link would need another blob URL. |
| Deferred items not marked "not run"; `.review-3-3.diff` untracked (BH) | low | patch | Spec states not run; the diff file was removed before commit. |

## Design Notes

`object-src blob:` in the planned CSP already covers this embed. Chromium may show the PDF viewer in an internal frame governed by `frame-src`/`child-src` falling back to `default-src 'self'`; if so Story 3.4 must record the deviation. Do not weaken the sanitizer or add anything to this story for it.

## Verification

**Commands:**
- `npm run build` -- exits 0; note chunk sizes
- `npm run lint` -- exits 0, read-only gate included
- `npm test` -- all pass, `architecture.test.ts` included
- `git status --short` -- only intended files

**Manual checks (if no CLI):** `npm run build && npm run preview` in Chrome or Edge, network panel open: multi-page PDF scrolls continuously, keyboard reaches and leaves it, corrupt PDF, rapid clicking, three themes. If not run, report it as not run.

Commit when implemented: `feat(preview): preview PDFs` with footer `Story: 3-3` above Co-Authored-By.
