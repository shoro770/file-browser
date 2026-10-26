---
title: 'Preview Markdown safely'
type: 'feature'
created: '2026-10-26'
status: 'done'
route: 'dispatch'
baseline_commit: '5d080a663bda082da8eecc20dfac8ef4718c3966'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A `.md` file resolves to the `markdown` kind but `rendererFor` sends it to the Metadata Card, so a generated spec cannot be read formatted. There is no sanitizer, no DOM test environment, and no way to render untrusted HTML.

**Approach:** Add a lazily loaded `MarkdownPreview`: a parser turns the leading 1 MB into HTML, `services/sanitize` (allowlist) turns it into an inert `DocumentFragment`, and the component appends that fragment. Remote images become a "Remote image blocked" placeholder; only `#anchor` links stay live. Add the DOM test environment the sanitizer tests need and use it to test the preview components this story touches.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components` (AD-1); components never import `services/`. `lib/` stays pure with JSDoc `@param`/`@returns` and unit tests. Props typed in `src/types.ts`. HTML reaches the DOM only as the fragment returned by `sanitize`, appended with `replaceChildren`; no `innerHTML`, `dangerouslySetInnerHTML`, `fetch(`, inline `style=`, new object-URL call or icon library (inline SVG only). The parser and sanitizer load only through `React.lazy` or `import()` reachable from `MarkdownPreview`; initial JS stays under 150 KB gzipped, measured. The renderer is chosen once by `rendererFor` and the same result drives the branch and the announcement. Markdown announces "Previewing {name}" only, never "no preview available". A throw or rejection renders the Metadata Card with `RENDER_FAILED_MESSAGE`; the error is never read, logged or shown. The failed outcome is keyed by source object so reselecting retries. Rules: all of `.claude/rules/*.md`. Verify the parser and sanitizer versions against current documentation before use and record them in Implementation Notes.

**Never:** Edit `AGENTS.md`, `scripts/check-readonly.mjs`, `src/architecture.test.ts` or `index.css` tokens, the Tree keyboard map, `resolvePreviewKind` tables or `RENDER_FAILED_MESSAGE`. Add the meta CSP, DOCX or PDF work (Stories 3.2–3.4). Use `iframe srcdoc`, inline SVG from files or content sniffing. Write the user's files. Make a network request. Commit in this planning pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Formatted file | `# T`, list, table, fenced code, `[a](#t)`, `**b**` | Real `h1`, `ul`, `table`, `pre>code`, live in-page link, `strong`; prose max 760px | N/A |
| Hostile raw HTML | `<script>`, `<img onerror>`, `<a href="javascript:x">`, `style=`, `<iframe>`, `<form>` | Nothing runs, elements and attributes removed, no request | Sanitizer strips; no error |
| Remote image | `![cap](https://e.com/a.png)` | Placeholder, name "Remote image blocked", `cap` as caption; also for relative, `data:` and `javascript:` sources | No request |
| Links | `[x](#sec)` / `[x](https://e.com)` / `[x](./a.md)` / `[x](javascript:1)` | First stays and scrolls the pane without changing the URL; the rest are plain text, no tab stop | Missing target: click does nothing |
| Over 1 MB | 3 MB file ending mid-line or mid-fence | Leading 1 MB cut back to the last complete line, banner pinned above | Partial construct renders as text |
| Parser throws | Parser or sanitizer rejects | Header stays; Metadata Card with failure text; announces "{name}: no preview available" | `renderFailed` |
| Supersede | A selected, B selected before A renders | B shows; A's late render is dropped | N/A |

</frozen-after-approval>

## Open Questions

Non-interactive run: each default is applied in the tasks. A human can overturn it before implementation.

- Sanitizer engine — DOMPurify configured as an allowlist (default; vetted, ~9 KB gz) / hand-written DOM walker (no dependency, but the highest regression risk). Story 3.2 reuses whichever is picked.
- Parser — `marked` (default; tolerant of partial input, plain string-to-HTML) / `markdown-it` / `micromark` (stricter, larger). Measure the lazy chunk either way.
- DOM test environment — `jsdom` selected per file with `// @vitest-environment jsdom` plus `@testing-library/react` and `@testing-library/jest-dom` (default; DOMPurify's supported environment, no config change) / `happy-dom` (faster, weaker DOMPurify support) / a global `test.environment` in `vite.config.ts`.
- `data:` images — the AC removes them, but Story 3.2 says DOCX embedded image data may be shown. Default: `sanitize` takes an `allowDataImages` option, `false` here; Story 3.2 decides.
- Task-list checkboxes — default keeps `<input type="checkbox" disabled>` only (forced attributes); alternative drops all `input`, losing the marker.
- Test scope — default closes the Epic 2 deferred entries for `PreviewPane`, `PreviewHeader`, `MetadataCard`, `TextPreview`, `ImagePreview` and `PreviewBoundary` as `preview-components-need-tests.md` requires, and leaves `usePreview` and the Epic 1 entries open. Alternative: split this into a separate test story (the least coupled piece to cut).
- Manual checks (Chrome or Edge: a hostile `.md` with the network panel open, theme switch, Tab through links, a 3 MB file) cannot be proven headlessly; run them or report them not run.

## Code Map

- `src/lib/preview.ts` -- `rendererFor` returns `'text' | 'image' | 'card'`; add `'markdown'` (kind `markdown` with text). `cardExplanation` untouched. Do not alter `resolvePreviewKind`. Tests in `preview.test.ts`.
- `src/lib/text.ts` -- add `trimToLastLine(text, truncated)` (drops the partial final line only when truncated). Tests in `text.test.ts`.
- `src/lib/markdown.ts` (new) -- pure `slugify(heading)` and `uniqueSlugs(headings)` (GitHub-style, `md-` prefixed, de-duplicated) so anchors cannot clash with app ids. Tests alongside.
- `src/services/previewSession.ts` -- read leading text for `markdown` as for `text` (`readLeadingText` already slices 1 MB). Extend `previewSession.test.ts`: markdown gets `text`, no `imageUrl`.
- `src/services/sanitize.ts` (new) -- `sanitize(html, options?) -> DocumentFragment`: allowlist of tags and attributes (no `class`/`id`/`style`/`on*`), `a` kept only with `href` starting `#`, other `a` unwrapped to text, every `img` replaced by the placeholder (class `blocked-resource`, `role="img"`, `aria-label="Remote image blocked"`, inline SVG glyph, alt caption). Parses with `DOMParser`, so nothing loads before cleaning.
- `src/services/markdown.ts` (new) -- `renderMarkdown(text) -> Promise<DocumentFragment>`: parser, `sanitize`, then heading ids from `lib/markdown`. The only importer of the parser.
- `src/hooks/useMarkdown.ts` (new) -- returns the fragment promise cached in a `WeakMap` keyed by the `PreviewSource`, so the component can `use()` it and a rejection reaches the boundary.
- `src/components/preview/MarkdownPreview.tsx` (new) -- `use(promise)`; `useLayoutEffect` appends `fragment.cloneNode(true)` to a ref'd `div` (clone so StrictMode re-runs work); click handler on the `div` resolves `a[href^="#"]`, `preventDefault`, scrolls the `md-` target into view in the pane; renders the truncation banner exactly like `TextPreview` when `source.text.truncated`.
- `src/components/PreviewPane.tsx` -- add the `markdown` branch: `React.lazy(() => import('./preview/MarkdownPreview'))` inside `<Suspense>`, inside `PreviewBoundary` (boundary outside Suspense). `rendererOf` already feeds the announcement.
- `src/App.css` -- `.markdown-preview` rules: max-width `var(--reading-max)` or 760px, headings, lists, tables, `pre`/`code` on `--color-code-bg`, `a` underline (1px, accent, offset 2px), `.blocked-resource` (placeholder-bg, 1px dashed border-strong, min 120×48px). Reuse `.truncation-banner`. Tokens exist in `index.css`; add none.
- `src/types.ts` -- `MarkdownPreviewProps { source: PreviewSource }`; `SanitizeOptions`.
- `package.json` -- dependencies: parser, sanitizer; devDependencies: `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- remove entries closed by tests; add entries for `usePreview`, `MarkdownPreview` browser checks and the unproven 1 MB/theme/keyboard behaviors.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- add parser, sanitizer and test devDependencies after verifying versions against current documentation; record versions and registry date -- AC library check, AD-15
- [x] `src/lib/preview.ts`, `text.ts`, `markdown.ts` + tests -- `rendererFor` markdown branch, `trimToLastLine`, `slugify`/`uniqueSlugs` -- one render decision
- [x] `src/services/sanitize.ts` + `sanitize.test.ts` -- allowlist and placeholder; hostile corpus, one case per rule: `<script>`, `on*`, `style=`, `iframe`/`object`/`embed`/`form`, `javascript:`/`data:`/remote `href` and `src`, `id`/`class` clobbering, nested/malformed markup, `<svg>`/`<math>` script, plus assertions that no `Image` or request is made (DOM test environment) -- AD-11, NFR6
- [x] `src/services/markdown.ts`, `src/hooks/useMarkdown.ts`, `previewSession.ts` + tests -- render pipeline and the markdown text read
- [x] `src/components/preview/MarkdownPreview.tsx`, `PreviewPane.tsx`, `src/types.ts`, `src/App.css` -- renderer, lazy dispatch, styles
- [x] Component tests (jsdom) -- `MarkdownPreview` (headings/links/table roles, placeholder name, banner only when truncated, no `style` attribute, anchor click keeps URL), `PreviewPane` (region, `aria-labelledby`, `tabIndex`, markdown announces "Previewing" only, failure card via a rejecting render, retry on reselect), plus the closed Epic 2 entries -- `preview-components-need-tests.md`
- [x] `deferred-work.md` -- edits above

**Acceptance Criteria:**
- Given a `.md` file, when selected, then it shows real headings, lists, tables, code blocks and in-page links with the region focusable and scrollable.
- Given the hostile corpus, when sanitized, then nothing executable, no `style`, no off-page `src`/`href` remains and no request is made.
- Given a remote image, then the placeholder appears with the accessible name "Remote image blocked" and the alt text as caption.
- Given a file over 1 MB, then the leading 1 MB cut to a whole line renders under the pinned banner.
- Given `vite build`, then initial JS is under 150 KB gzipped, the parser and sanitizer sit in a separate chunk, and both sizes are recorded in Implementation Notes.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec, `epic-3-context.md` and `sprint-status.yaml`.

## Implementation Notes

**Libraries (checked against current docs through Context7 on 2026-10-26, installed from the npm registry):** `marked` 18.1.1 (`marked.parse(md, { async: false })` returns a string; GFM on by default; raw HTML passes through, so `sanitize` is the gate), `dompurify` 3.4.17 (`ALLOWED_TAGS`, `ALLOWED_ATTR`, `ALLOWED_URI_REGEXP`, `RETURN_DOM_FRAGMENT`), `jsdom` 30.1.3 (no subresource loading or script execution by default; chosen per file with `// @vitest-environment jsdom`), `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `@testing-library/jest-dom` 7.0.1 (`import '@testing-library/jest-dom/vitest'`, done in `src/testHelpers.ts`).

**Measured with `vite build`:** initial JS `index-*.js` 249.63 kB, **78.54 kB gzip** (budget 150 kB); lazy chunk `MarkdownPreview-*.js` 78.40 kB, **26.44 kB gzip** (marked, DOMPurify, sanitizer, renderer); CSS 3.26 kB gzip. Before this story the app had no Markdown dependency.

**Deviations from the plan:**
- The Code Map named `uniqueSlugs`; the helper is `headingIds` (plus `slugify`, `anchorTarget`).
- DOMPurify's `ALLOWED_URI_REGEXP` applies to every attribute not on its URI-safe list, so a `^#` regexp stripped `colspan`. The regexp now means "no URL scheme" (plus raster `data:` images when allowed) and `applyResourceRules` makes the real `href`/`src` decision afterwards. A first test run also showed an `svg+xml` data image slipping through when data images were allowed; the post-pass now re-checks `src` against the raster-only pattern.
- `TextPreview`'s banner moved into a shared `TruncationBanner` so both renderers show the same one.
- Headings get `tabindex="-1"`, and an in-page link focuses its target heading as well as scrolling to it.
- `src/testHelpers.ts` holds the shared jsdom setup and `makeSource` for component tests.
- The commit scope is `preview` (orchestrator instruction), not `markdown` as the spec's Verification line says.

**Not exercised in a browser:** everything visual and behavioral beyond jsdom: layout, sticky header and banner, 760px cap, link underline and placeholder rendering in three themes, scroll-margin under the header, Tab order, a 3 MB file, a real network panel (the SM-3 proof is Story 3.4), and the lazy chunk loading. See `deferred-work.md`. `npm run build`, `npm run lint` and `npm test` pass.

## Spec Change Log

## Review Triage Log

Three layers (Blind Hunter, Edge Case Hunter, Verification Gap) ran on the diff. Loopbacks: none.

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Heading ids collide: "Intro", "Intro", "Intro 1" (EC) | medium | patch | `headingIds` now tests against every id handed out. Test added. |
| Heading id includes "Remote image blocked" from an image placeholder (EC) | low | patch | `headingText` drops the label; alt caption stays. Test added. |
| `slugify` strips combining marks and underscores (BH, EC) | low | patch | Pattern keeps `\p{M}` and `_`. Tests added. |
| `trimToLastLine` ignores lone CR; blank result after a cut (EC) | low | patch | Cuts at LF or CR; returns the full text if the cut would leave only blank space. Tests added. |
| Anchor click moves no focus (BH, EC) | medium | patch | Headings are `tabindex="-1"`; the handler focuses the target. Test added. |
| `table { display: block }` drops table semantics (BH) | low | patch | Rule removed; long cells wrap. |
| Hostile-HTML and no-request tests claim more than jsdom proves (BH) | low | patch | Renamed and commented honestly; DOM-shape assertions carry the proof. |
| Test globals leak on failure (`scrollIntoView`, stubs, `restoreAllMocks`) (BH, EC) | low | patch | Restored in `afterEach`. |
| StrictMode double effect untested (BH) | low | patch | StrictMode test added. |
| Main-thread parse cost, no cancellation (BH, EC) | medium (unverified) | defer | Not measured; logged in `deferred-work.md`. |
| `pre` not keyboard-scrollable; lazy chunk failure path (BH) | medium (unverified) | defer | Needs a layout engine and a browser; logged. |
| `details`/`summary` and badge images (BH) | low (unverified) | defer | Follows the AC; logged. |
| Blank body while the lazy chunk loads (BH, EC) | low (unverified) | defer | Already logged. |
| Unhandled rejection when `use()` is never reached (EC) | false | rejected | The component calls `use()` in the same render that creates the promise. |
| `allowDataImages` unused in production (BH) | low | rejected | Accepted open-question default; Story 3.2 decides. Fix would edit the spec. |
| Stray `<input>` becomes a checkbox; leading-space `href`; modifier clicks; `DOMPurify.isSupported`; raw-HTML `id`/`name` anchors lost (BH, EC) | low | rejected | Fail safe or unreachable in the browser; fixes add branches for no everyday harm. |
| `useMarkdown` is not a hook; `testHelpers` in `src`; per-file jsdom pragma; banner wording after trim (BH) | low | rejected | Naming and layout choices the spec made; no named harm. |
| Spec says DOMParser, code calls DOMPurify; `uniqueSlugs` name (EC) | low | rejected | DOMPurify parses with `DOMParser` internally; fix would edit the spec. Noted above. |
| No verification gaps (VG) | none | n/a | Layer reported none; it did not check bundle split or browser behavior, which are reported as not run. |

## Design Notes

`sanitize` returns a fragment rather than a string so no `innerHTML` is ever needed and `architecture.test.ts` stays satisfied. React 19 `use(promise)` sends a rejection to `PreviewBoundary` without the renderer reading the error; keep `PreviewBoundary` outside `Suspense`. Sanitized output has no classes, so styling is by descendant selector under `.markdown-preview`. Heading ids are added after sanitizing, and the anchor handler looks them up by the `md-` prefix, so a file cannot clobber `root` or `preview-title`.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (the real type check); note the printed chunk sizes
- `npm run lint` -- expected: exits 0, read-only gate included
- `npm test` -- expected: all pass, `architecture.test.ts` included
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run build && npm run preview` in Chrome or Edge, network panel open: select a hostile `.md` (remote image, script, `onerror`, `javascript:` link, `style`), a 3 MB `.md` and a normal one; confirm zero requests, the placeholder, inert links, the banner, Tab order and three themes. If not run, report it as not run.
- Commit when implemented: `feat(markdown): preview Markdown safely` with footer `Story: 3-1` above Co-Authored-By.
