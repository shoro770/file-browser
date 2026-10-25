---
title: 'Preview images'
type: 'feature'
created: '2026-10-25'
status: 'in-review'
route: 'dispatch'
baseline_commit: '8804fa67624396a7aa4020a14542672dd5e4bbdd'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Files that resolve to the `image` kind (PNG, JPEG, SVG, WebP, GIF) still show the Metadata Card, so a developer cannot check a generated mockup or asset without leaving the browser.

**Approach:** Add `ImagePreview`, reached through the existing `PreviewPane` dispatcher. `previewSession` creates the single object URL for the selection, carries it on `PreviewSource`, and revokes it when the selection changes or the session ends. The image is an `<img src="blob:...">` and nothing else.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components` (AD-1); `lib/` pure with JSDoc `@param`/`@returns` and Vitest tests; props typed in `src/types.ts`; role CSS variables only, no inline `style` attributes, no `fetch()`, no network, no new icon library. `ImagePreview` lives in `src/components/preview/ImagePreview.tsx`, consumes a `PreviewSource`, never a handle, and does not import `services/`. Only `previewSession` calls `URL.createObjectURL`/`revokeObjectURL`, and only when the kind is `image` (never at list time). The old `openedItems` ref and `revokeItemUrls` must not exist (confirm by grep; none today). SVG is never inlined: no `dangerouslySetInnerHTML`, no `<object>`/`<embed>`/`<iframe>`. `alt` is the file name. Sizing in CSS classes and custom properties only: native size when smaller than the pane (never enlarged), scaled down to fit with aspect ratio kept, media fills the pane width within `--size-preview-gutter`, no rounded corners. Animated GIF/APNG/WebP autoplay as authored with no pause control (documented v1 WCAG 2.2.2 exception, noted in `ImagePreview` JSDoc). Announcements: images announce only "Previewing {name}" (already in `App.handleSelect`); "{name}: no preview available" stays for card outcomes. The region stays `role="region"`, `aria-labelledby` the header `h2`, `tabindex="0"`; Tab order unchanged. Previous content stays until the new preview is ready; the previous image's URL must stay valid until then.

**Never:** Changes to `AGENTS.md`, `scripts/check-readonly.mjs`, `index.css` tokens, the Tree keyboard map or roving tabindex, `lib/{format,layout}.ts`, the order or tables of `resolvePreviewKind`. Content sniffing. Writing the user's files. Raw error text in the UI. The renderer-failure card text and `renderFailed` outcome (Story 2.4). Markdown, DOCX, PDF. Committing in this planning pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Large image | `shot.png`, 3000x2000 | `<img>` scaled to fit width and height of the pane, ratio kept | N/A |
| Small image | `icon.png`, 64x64 | Shown at 64x64, not enlarged | N/A |
| Hostile SVG | `x.svg` with `<script>` and an external `href` | Rendered by `<img>` only; no script runs, no request is made; no `svg` node in the DOM | N/A |
| SVG with empty device type | `.svg`, `File.type === ''` | Blob typed `image/svg+xml` from the extension so `<img>` renders it | N/A |
| Animated GIF | `a.gif` | Autoplays, no controls | N/A |
| Fast reselect | image A then B (or a text file) | A's result discarded; B shown; A's URL revoked; the URL of the image on screen is never revoked early | Late A result dropped, its URL revoked |
| Selection cleared / app closes | session closes | Every live URL revoked | N/A |
| Zero-byte `.png` | size 0 | Metadata Card "This file is empty." (unchanged) | N/A |
| Browser cannot decode (`.heic`, `.tiff`, corrupt) | `<img>` fires `error` | Alt text shows in the region; the card fallback is Story 2.4 (see Open Questions) | No raw error text |
| Read throws | file removed mid-read | Metadata Card with the failure text (existing `failed` outcome) | Typed outcome |

</frozen-after-approval>

## Open Questions

Non-interactive run: each default below is applied in the tasks. A human can overturn it before implementation.

- `resolvePreviewKind` maps `bmp|heic|tiff|ico|gif` to `image` via the file categorizer, but Chromium cannot decode `heic`/`tiff` — options: keep the resolver as is and let a failed decode wait for Story 2.4's card (default; the spec's "Never" forbids resolver changes) / narrow `image` to png, jpg, jpeg, gif, webp, svg, bmp, ico now (changes tree glyphs for heic/tiff).
- A failed `<img>` decode shows only alt text until Story 2.4 — options: accept (default, logged in `deferred-work.md`) / add a local `onError` card now (duplicates 2.4's outcome and text).
- Very large images (tens of MB) are not size-capped; decode cost is the browser's — options: no cap in v1 (default; no spec requirement) / cap and show the card.
- Epic text says "PNG, JPEG, SVG and WebP"; GIF/APNG are named in the animation criterion, so GIF is included — options: include (default) / exclude.
- Revoke timing — RESOLVED by the human: follow AD-10 literally. A new session aborts the previous and revokes its URLs at session start; the decoded `<img>` keeps its bitmap while the previous content stays. (The earlier default, revoke on settle, was rejected.)
- Manual checks (real folder, `<img>` sizing, three themes, hostile SVG with no network in DevTools) cannot be proven headlessly — options: run in Chrome or Edge (default) / report as not run.

## Code Map

- `src/services/previewSession.ts` -- `createPreviewSessions(read)`; for `kind === 'image'` create the blob URL, track it per session, revoke per the Design Notes. Add an optional injected URL API (default `URL`) so tests can fake `createObjectURL`/`revokeObjectURL`. Test file exists.
- `src/lib/preview.ts` (or new `src/lib/image.ts`) -- add pure `imageMimeFor(name, mime)`: keep a device type that starts with `image/`, otherwise map png, jpg, jpeg, gif, webp, svg, bmp, ico by extension, else `''`. Do not touch `resolvePreviewKind`.
- `src/types.ts` -- add `imageUrl?: string` to `PreviewSource` (~line 214) and `ImagePreviewProps`.
- `src/components/PreviewPane.tsx` -- branch `image` with a URL to `ImagePreview`; announcement predicate must skip announcing for image sources with a URL, like text.
- `src/components/preview/TextPreview.tsx` -- sibling to mirror for structure and comments.
- `src/App.css` -- `.image-preview` (height `calc(100% - var(--preview-header-height))`, flex centered, gutter padding) and `.image-preview__img` (`max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain`, no radius). `--preview-header-height` already exists.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- append the component-test entry.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts` -- `imageUrl?: string` on `PreviewSource`; `ImagePreviewProps { source: PreviewSource }` -- AD-9
- [x] `src/lib/preview.ts` (or `src/lib/image.ts`) + test -- `imageMimeFor`; tests for device type kept, empty type with `.svg`/`.png`/`.PNG`, unknown extension -- FR16, AD-11
- [x] `src/services/previewSession.ts` + `previewSession.test.ts` -- create the URL only for `image`; track and revoke; tests: URL created once for an image and never for text/metadata; stale image session's URL revoked and returns `null`; previous URL revoked only after the replacement settles; `close()` revokes all; read failure leaves no URL -- AD-10
- [x] `src/components/preview/ImagePreview.tsx` -- `<img src={source.imageUrl} alt={source.meta.name}>` keyed by the URL, JSDoc noting the animation exception -- FR16, UX-DR16
- [x] `src/components/PreviewPane.tsx` -- dispatch `image`; no "no preview available" announcement for it -- UX-DR22
- [x] `src/App.css` -- image styles per Code Map, no inline styles -- UX-DR16, AD-12
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- log untested `ImagePreview` (`alt`, `src` is `blob:`, no `svg` in DOM, no announcement) and `PreviewPane` image branch; no DOM test environment exists

**Acceptance Criteria:**
- Given an `image`-kind file, when selected, then it renders as `<img src="blob:...">` with `alt` equal to the file name, scaled to fit the pane with its ratio kept.
- Given an image smaller than the pane, then it shows at native size, not enlarged; given a larger one, it fills the pane width inside the 24px gutter, unrounded.
- Given an SVG with `<script>` or an external reference, then it appears only through `<img>`, nothing is inlined, no script runs and DevTools shows no network request.
- Given `previewSession`, then it alone calls `createObjectURL`/`revokeObjectURL` (grep `src/`), no URL exists at list time, and a test shows every URL created is revoked after reselect, supersede and `close()`.
- Given rapid clicks through images, then only the latest shows and no URL is left unrevoked (unit test plus manual check).
- Given an animated GIF, then it autoplays with no pause control.
- Given the pane, then no `fetch`, no inline `style`, no `dangerouslySetInnerHTML`; the region keeps `aria-labelledby`, `tabindex="0"`; image selection announces only "Previewing {name}".
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec and `sprint-status.yaml`.

## Implementation Notes

## Spec Change Log

- 2026-10-25, human override: the open-question default "revoke when the replacement settles" is rejected. Revocation happens at session start (`open()`) and in `close()`, per AD-10 and the AC. This supersedes the frozen lines "the previous image's URL must stay valid until then" (Boundaries) and "the URL of the image on screen is never revoked early" (Fast reselect row), and the task wording "previous URL revoked only after the replacement settles". Amended: Open Questions, Design Notes. Known-bad state avoided: a URL left live while the next selection loads. KEEP: URL created only for `image`, only in `previewSession`, after the abort check. Test: URL revoked on supersede, on reselect and on close.

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Announcement and dispatch re-spelled the same predicate; `PreviewPane` branch untested (BH, VG) | medium | patch | Logic moved to pure `rendererFor` in `lib/preview.ts` with a table test; the pane uses it for both. |
| `createObjectURL`/`slice` throwing makes `open()` reject (EC, VG) | medium | patch | Wrapped; returns the typed `failed` outcome; test added. |
| Missing tests: close() during pending image, revoke exactly once, zero-byte image, dangling `open()` (BH) | low | patch | Tests added and the dangling promise is now awaited. |
| Stale effect comment (BH) | low | patch | Updated to cover images. |
| Stray diff file, tasks unchecked, status mismatch (BH) | low | patch | Diff file deleted; tasks checked; statuses set to review. |
| Revoking at session start can break the on-screen `<img>` (BH, EC, VG) | false | rejected | Human override per AD-10; `<img>` is keyed by URL so it is not re-requested; browser behaviour logged as not exercised. |
| Frozen text contradicts the override (BH, EC) | false | rejected | Frozen block is not edited; the Spec Change Log supersedes the lines. |
| `ImagePreview` throws without a URL (BH, EC) | false | rejected | `PreviewPane` renders it only when `rendererFor` returns `image`. |
| Zero-byte image reaches the URL branch (EC) | false | rejected | `resolvePreviewKind` returns `metadata` for size 0; test added. |
| `.heic`/`.tiff`/corrupt show only alt text; `onError` (BH, EC) | low | rejected | Story 2.4 owns the failure card; accepted open-question default. |
| Transparent images vanish on dark themes (BH) | low | rejected | Cosmetic; needs a new backdrop token, out of scope. |
| SVG with only a `viewBox` has no intrinsic size; `.preview` height does not resolve `max-height: 100%` (BH, EC) | medium (unverified) | defer | Needs a browser; recorded in `deferred-work.md`. |
| Extension table gaps, malformed device type, `revokeObjectURL` throwing (EC) | low | rejected | Negligible; fixes add branches. |
| "Fills width" vs native-size sizing conflict (EC) | false | rejected | Large images fill the width, small stay native, as the AC states. |

## Design Notes

URL lifecycle (human override, see Spec Change Log): the session records the URL it creates. `open()` aborts the previous session and revokes its URL first, at the moment the Selection changes; `close()` does the same. The `<img>` on screen keeps its decoded bitmap while the previous content stays during loading. Create the URL after the abort check, synchronously before returning the result, from a typed slice `file.slice(0, file.size, imageMimeFor(...))` (read-only) so an SVG with an empty device type still renders. Creating a URL reads no bytes.

Sizing: `.preview` is the scroll container with a definite height, so `.image-preview` can take `calc(100% - var(--preview-header-height))`, making `max-height: 100%` on the `<img>` resolve. Verify in a browser; if it does not, use `min-height` plus `max-height: calc(100vh - header)`. Key `<img>` by `imageUrl` so a previous decode cannot paint under a new source. Epic 2 lessons: component tests are deferred (no DOM environment) and must be logged, not claimed verified; reuse the sticky header from 2.2; no new tokens.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (the real type check)
- `npm run lint` -- expected: exits 0, read-only grep gate included
- `npm test` -- expected: all pass
- `grep -rn "createObjectURL\|revokeObjectURL\|openedItems\|revokeItemUrls" src` -- expected: only `previewSession.ts` (and its test)
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome or Edge: select a large PNG, a 64px icon, a WebP, an animated GIF, a hostile SVG (script plus remote `href`; watch the Network tab), then click through several images quickly; check fit, no enlargement, gutter, Tab and keyboard scrolling, three themes, and that the pane never blanks. If not run, report it as not run.
- Commit when implemented: `feat(preview): preview images` with footer `Story: 2-3` above Co-Authored-By.
