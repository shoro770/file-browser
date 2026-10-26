---
title: 'Preview Word documents'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: 'f5b982dbb38afefee5871d611effbb30994b403d'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A `.docx` file resolves to the `docx` kind, but `rendererFor` sends it to the Metadata Card, so an exported summary cannot be read in the app.

**Approach:** Add a lazily loaded `DocxPreview`. A converter (`mammoth`, default) turns the file's bytes into HTML, the same `services/sanitize` used for Markdown (no second path) turns that into an inert `DocumentFragment`, and the component appends it. Embedded raster images show from in-document `data:` URLs; every other image becomes the "Remote image blocked" placeholder; only `#anchor` links stay live.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components` (AD-1); components never import `services/`. HTML reaches the DOM only as the `sanitize` fragment, appended with `replaceChildren`; no `innerHTML`, `dangerouslySetInnerHTML`, `fetch(`, inline `style=`, new object-URL call (only `previewSession` makes them) or icon library. The converter loads only through `React.lazy` or `import()` reachable from `DocxPreview`; initial JS stays under 150 KB gzipped, measured, and the lazy chunk size is recorded. Call the converter with `externalFileAccess: false` explicitly. The renderer is chosen once by `rendererFor`; the same result drives the branch and the announcement, and a docx announces "Previewing {name}" only. Any throw or rejection (corrupt, password-protected, non-zip) renders the Metadata Card with `RENDER_FAILED_MESSAGE`; the error is never read, logged or shown; failure is keyed by source object so reselecting retries. Legacy `.doc` stays a card and loads no converter. Reuse the Markdown pipeline pieces (sanitizer, heading ids, anchor click handling, styles) rather than copying them. Rules: all of `.claude/rules/*.md`. Verify the converter and its version against current documentation and record them in Implementation Notes.

**Never:** Weaken or fork `sanitize`; edit `AGENTS.md`, `scripts/check-readonly.mjs`, `src/architecture.test.ts`, `index.css` tokens, `resolvePreviewKind` tables or `RENDER_FAILED_MESSAGE`. Add the meta CSP or PDF work (3.3, 3.4). Use `docx-preview` or any renderer that emits `style` attributes, `iframe srcdoc`, or SVG images. Write the user's files. Make a network request. Commit in this planning pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Formatted document | Headings, bold, italic, lists, table, hyperlink | Real `h1`..`h6`, `strong`, `em`, `ul`/`ol`, `table`, link; prose max 760px, `ui-body` | N/A |
| Embedded image | PNG/JPEG/GIF/WebP in the document | `<img>` from the in-document `data:` URL, alt kept | N/A |
| Unsafe image | Linked (external) image, SVG or non-raster data | Placeholder named "Remote image blocked", alt as caption | No request |
| Links | `#bookmark`, `https://…`, `javascript:` | `#` link stays only if its target exists in the output; others plain text | Missing target: plain text |
| Hostile payload | `<script>` text, `javascript:` link, external image reference | Text shown literally; nothing executable, no `style`, no request | Sanitizer strips |
| Legacy `.doc` | `a.doc` | Card "Legacy .doc files can't be previewed…"; converter never loaded | N/A |
| Bad file | Corrupt, encrypted, non-zip `.docx` | Header stays; card with failure text; announces "{name}: no preview available" | `renderFailed` |
| Supersede | A selected, B selected before A converts | B shows; A's late result dropped | N/A |

</frozen-after-approval>

## Open Questions

Non-interactive run: each default is applied in the tasks. A human can overturn it before implementation.

- Converter — `mammoth` 1.13.0 (default; semantic HTML, no inline styles, `{arrayBuffer}` browser input, `externalFileAccess` off; BSD-2) / `docx-preview` (fidelity, but emits `style` attributes: conflicts with AD-12) / `jszip` + hand-written OOXML walker (smallest, highest regression risk). Its browser bundle is large; the chunk is measured and recorded, and may be well over 15 KB gzipped, which is fine only because it is lazy.
- Document bookmarks — mammoth emits `id`-anchors that the sanitizer strips, so default: `#` links whose target is absent become plain text (dead links never take a tab stop). Alternative: keep bookmark ids behind a `docx-` prefix added after sanitizing, as `md-` does for headings.
- Heading anchors — default: reuse `headingIds` so headings carry `md-` ids and `tabindex="-1"` (shared helper). Alternative: no heading ids in DOCX.
- Size cap — default: no cap beyond reading the file; NFR3 targets under 5 MB. Alternative: show the card above a limit (for example 50 MB) to protect the main thread; mammoth runs synchronously-ish on the main thread and `source.signal` cannot cancel it (same open item as Markdown).
- Test fixtures — default: build minimal `.docx` zips in tests with `jszip` as a devDependency (already a mammoth dependency, now declared). Alternative: check in binary fixtures.
- Manual checks (Chrome or Edge: a real Word export, a hostile docx with the network panel open, a 5 MB docx timed from click to paint including first lazy load, three themes) cannot be proven headlessly; run them or report them not run.

## Code Map

- `src/lib/preview.ts` -- `rendererFor` returns `'text' | 'markdown' | 'image' | 'card'`; add `'docx'` (kind `docx` needs no text or URL). `cardExplanation`, `LEGACY_DOC_MESSAGE` untouched. Tests in `preview.test.ts`: docx branch, `.doc` and zero-byte still `card`.
- `src/services/sanitize.ts` -- reuse as is. Call with `{ allowDataImages: true }` (option already exists; Markdown keeps `false`). Its raster-only `data:` pattern already excludes SVG. Do not change; if a change proves needed, record it as a deviation.
- `src/services/markdown.ts` -- extract the heading-id/`tabindex` loop (and `headingText`) into a shared helper (for example `services/headings.ts`) used by both; Markdown behavior and tests must not change.
- `src/services/docx.ts` (new) -- `renderDocx(file, signal) -> Promise<DocumentFragment>`: `await file.arrayBuffer()`, dynamic converter call with `{ arrayBuffer }`, `externalFileAccess: false`, default data-URI images; `sanitize(html, { allowDataImages: true })`; shared heading ids; drop `a[href^="#"]` with no matching id. Throws on `signal.aborted`. The only importer of the converter.
- `src/hooks/useDocx.ts` (new) -- `WeakMap<PreviewSource, Promise<DocumentFragment>>`, same shape as `useMarkdown.ts`.
- `src/components/preview/RenderedContent.tsx` (new) -- extracted from `MarkdownPreview`: fragment clone via `useLayoutEffect` plus the `#anchor` click/focus/scroll handler. `MarkdownPreview` uses it; its existing tests must still pass.
- `src/components/preview/DocxPreview.tsx` (new) -- `use(useDocx(source))`, renders `RenderedContent` in `.docx-preview`; no banner (no truncation).
- `src/components/PreviewPane.tsx` -- add the `docx` branch: `lazy(() => import('./preview/DocxPreview'))` inside `Suspense`, inside `PreviewBoundary`. `sourceKey`, `rendererOf` and the announcement stay one decision.
- `src/services/previewSession.ts` -- no change: docx reads nothing beyond `getFile()`; bytes are read by the renderer from `source.file`.
- `src/App.css` -- share the `.markdown-preview` prose rules with `.docx-preview` (selector list or a common class); add none that need new tokens. 760px cap, `ui-body`, 1px `accent` link underline, offset 2px.
- `src/types.ts` -- `DocxPreviewProps { source: PreviewSource }`.
- `src/testDocx.ts` (new, test helper) -- `makeDocx({ body, rels, media })` builds a zip with `jszip`.
- `package.json` -- dependencies `mammoth`; devDependencies `jszip`.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- add: DOCX browser checks, bookmark links, size cap and main-thread cost, `.docx` blank body during lazy load. Leave existing entries; `usePreview` stays open.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- add `mammoth` and `jszip` after checking versions against current docs; record versions and registry date -- AD-15
- [x] `src/lib/preview.ts` + `preview.test.ts` -- `docx` branch -- one render decision
- [x] `services/headings.ts`, `services/markdown.ts` -- extract shared heading ids; Markdown tests unchanged -- no second path
- [x] `src/services/docx.ts`, `src/hooks/useDocx.ts`, `src/testDocx.ts` + `docx.test.ts` -- conversion pipeline. Cases: headings/bold/italic/lists/table/link; embedded PNG kept; SVG and external image become placeholder; `javascript:` and `https:` links plain text; `<script>` text stays literal; no `style`/`on*`/`id` clobbering; bookmark link without target unwrapped; non-zip, corrupt and truncated zip reject; aborted signal rejects -- AD-11, NFR6
- [x] `src/components/preview/RenderedContent.tsx`, `DocxPreview.tsx`, `MarkdownPreview.tsx`, `PreviewPane.tsx`, `src/types.ts`, `src/App.css` -- renderer, lazy dispatch, styles
- [x] Component tests (jsdom) -- `DocxPreview` (heading/list/table/link roles, placeholder name, no `style` attribute, anchor click keeps URL, StrictMode); `PreviewPane` (docx announces "Previewing" only, `.doc` card with legacy text, bad docx failure card and announcement, retry on reselect, supersede) -- `preview-components-need-tests.md`
- [x] `deferred-work.md` -- entries above

**Acceptance Criteria:**
- Given a `.docx`, when selected, then headings, bold, italic, lists, tables and links show as real elements inside a focusable, scrollable region.
- Given the hostile fixture, when rendered, then nothing executable, no `style`, no off-page `src`/`href` remains and no request is made.
- Given a document with embedded and linked images, then raster embedded images show and all others show the "Remote image blocked" placeholder.
- Given `vite build`, then initial JS is under 150 KB gzipped, the converter sits in a separate chunk, and both sizes are recorded in Implementation Notes.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec and `sprint-status.yaml`.

## Implementation Notes

**Libraries (checked against current docs through Context7 and the npm registry on 2026-10-26):** `mammoth` 1.13.0 (registry modified 2026-09-26; `convertToHtml({ arrayBuffer }, options)` in the browser; `externalFileAccess` off by default and set off explicitly; `convertImage` via `mammoth.images.imgElement`; rejects for non-zip or a missing main document part) and `jszip` 3.10.2 as a devDependency (`generateAsync({ type: 'arraybuffer' })`), used only to build `.docx` fixtures in tests.

**Measured with `vite build`:** initial JS `index-*.js` 250.07 kB, **78.72 kB gzip** (budget 150 kB; Story 3.1 measured 78.54 kB); lazy converter chunk `lib-*.js` (mammoth, jszip and their dependencies) 308.12 kB, **95.11 kB gzip**; `DocxPreview-*.js` 0.75 kB gzip; the sanitizer and DOMPurify now sit in a shared `RenderedContent-*.js` chunk, 12.84 kB gzip; `MarkdownPreview-*.js` 14.00 kB gzip; CSS 3.28 kB gzip. `index.html` references no converter chunk.

**Deviations from the plan:**
- `vite.config.ts` was edited (not in the Code Map): it imports `defineConfig` from `vitest/config` and aliases `mammoth` to `mammoth/mammoth.browser.js` for tests only. Vitest's Node resolution ignores the package `browser` field that the app build applies, and mammoth's Node build rejects `{ arrayBuffer }`. The tests therefore exercise mammoth's prebuilt browser bundle, not the module the app build resolves.
- A custom `convertImage` (`images.imgElement`) was added: with external files off, mammoth silently drops a linked image; the converter now returns an empty `src` for any image it cannot read, so the sanitizer shows the blocked placeholder.
- `headings.ts` holds `addHeadingIds` (the Code Map's "shared helper"); `src/testDocx.ts` builds fixtures. CSS: `.markdown-preview__content` became `.rendered-content`, shared by both renderers, plus a `max-width: 100%` rule for images.
- Bookmark links: mammoth sets no id prefix, so `#Name` survives when `Name` slugs to a heading's text; Word `_Toc…` links become plain text.
- The review diff was written inside `_bmad-output/implementation-artifacts/` (writes outside the repo needed approval) and removed afterwards.
- The three review layers ran as subagents, as the orchestrator instructed; steps 3 and 5 were done inline.

**Not exercised in a browser:** everything beyond jsdom with synthetic fixtures: a real Word export, layout, the 760px cap, link and placeholder rendering in three themes, image sizing, the under-1-second target for a ~5 MB file including the first lazy load, the converter chunk loading in a real browser, and a real network panel (Story 3.4's proof). `npm run build`, `npm run lint` and `npm test` pass (333 tests). See `deferred-work.md`.

## Spec Change Log

## Review Triage Log

Three layers (Blind Hunter, Edge Case Hunter, Verification Gap) ran on the diff. Loopbacks: none.

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Docx bookmark link kept-live branch untested (VG) | low | patch | `idPrefix` is empty, so `#Intro` survives for a heading "Intro". Service and component click tests added; the "plain text" test now uses `_Toc` names. |
| Word images have no sizing rule (BH) | medium | patch | Only Markdown placeholders existed before; `.rendered-content img { max-width: 100%; height: auto }` added. |
| Placeholder test loose (own check) | low | patch | Asserts exactly 2 placeholders and the alt caption. |
| No size or time bound; base64 image budget; cancel mid-conversion (BH, EC) | medium (unverified) | rejected | Open-question default "no cap" was accepted; main-thread cost already logged in `deferred-work.md`. |
| `allowDataImages` missing from diff (BH) | false | rejected | The option exists since Story 3.1 (`sanitize.ts`, `SanitizeOptions`) and its SVG exclusion is tested there. |
| Dropped `result.messages`, blank conversion result (BH, EC) | low (unverified) | defer | Needs a notice design; logged. |
| TOC links never work (BH, EC) | low | rejected | Accepted open-question default; logged. |
| Tables without `th` (BH) | maybe-false | rejected | mammoth maps header rows to `th`; not shown to fail and low. |
| Unhandled rejection in `useDocx` (BH, EC) | false | rejected | React's `use()` attaches a handler to the thenable it suspends on. |
| `throwIfAborted` on older Safari (EC) | false | rejected | The app requires Chromium (File System Access API). |
| Blank body during lazy load (EC) | low | rejected | Already logged for Markdown; docx entry added. |
| `rendererFor` docx needs a file (EC) | false | rejected | The resolver returns `metadata` for zero bytes and every source carries a file. |
| `testDocx.ts` in `src`, second `jszip` (BH) | low | rejected | Same layout as `testHelpers.ts`; never imported by app code, so not bundled. |
| Missing tests: password-protected, announce on success (BH) | low | rejected | Encrypted `.docx` is not a zip and is covered by the non-zip case; activation announcements belong to `App`. |
| Alias fragility, no build verification record (BH, VG) | low | rejected | Recorded above as a deviation; build output measured. |

## Design Notes

DOCX is the only renderer that needs `allowDataImages: true`; in-document images reach the DOM as `data:` URLs the sanitizer allows (CSP `img-src` already lists `data:`), so no object URL is created and `previewSession` stays the only owner. `externalFileAccess: false` is set explicitly so a linked image cannot be read by the converter even if its default changes. Keep `PreviewBoundary` outside `Suspense`.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (the real type check); note chunk sizes
- `npm run lint` -- expected: exits 0, read-only gate included
- `npm test` -- expected: all pass, `architecture.test.ts` included
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run build && npm run preview` in Chrome or Edge, network panel open: select a real Word export, a hostile `.docx`, a legacy `.doc`, a corrupt `.docx` and a ~5 MB `.docx`; confirm zero requests, placeholders, inert links, under 1 s including first load, and three themes. If not run, report it as not run.
- Commit when implemented: `feat(preview): preview Word documents` with footer `Story: 3-2` above Co-Authored-By.
