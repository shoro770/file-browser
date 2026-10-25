---
title: 'Failed previews degrade gracefully'
type: 'feature'
created: '2026-10-26'
status: 'in-review'
route: 'dispatch'
baseline_commit: '4494f496650036ce42617db0968cbaf6aa454a9a'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A read failure already shows a name-only card, but a renderer that throws, an image the browser cannot decode (`.heic`, `.tiff`, corrupt) or a failed lazy chunk is not caught. Nothing stops a throw from blanking the pane, and an undecodable image shows only alt text.

**Approach:** Wrap the renderer in the `PreviewPane` dispatcher with an error boundary and give `ImagePreview` an error hook. Either one records a typed `renderFailed` outcome, and the pane then shows the Metadata Card with the render-failure explanation, using the metadata already read. No stack trace or raw error text is shown.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components` (AD-1); `lib/` pure with JSDoc `@param`/`@returns` and Vitest tests; props typed in `src/types.ts`; role CSS variables only, no inline `style`, no `fetch()`, no new icon library. Failures are typed outcomes, never exceptions into the UI, and error text is never rendered or logged to the page. The card name is an `h2`; the explanation is `ui-body` beneath the definition list (DESIGN.md). Failure announces "{name}: no preview available" once per failed selection. The region keeps `role="region"`, `aria-labelledby` the header `h2`, `tabindex="0"`, Tab order unchanged. Only `previewSession` calls `createObjectURL`/`revokeObjectURL`; a failed session's URL is revoked when the next session opens, and its late results are dropped. Selecting another file after a failure renders normally (the failure state is keyed to the source, so it cannot stick).

**Never:** Changes to `AGENTS.md`, `scripts/check-readonly.mjs`, `index.css` tokens, the Tree keyboard map or roving tabindex, the order or tables of `resolvePreviewKind`, `RENDER_FAILED_MESSAGE` wording. Content sniffing. Adding Markdown, DOCX or PDF renderers or `React.lazy` (Epic 3). Writing the user's files. Committing in this planning pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Renderer throws | `TextPreview` or `ImagePreview` throws while rendering | Boundary catches; header stays; Metadata Card with the failure text and Size, Type, Last modified; announces "{name}: no preview available" | `renderFailed`, no error text shown |
| Image cannot decode | `x.heic`, `<img>` fires `error` | Same card replaces the broken `<img>` | `renderFailed` |
| `getFile()` rejects | file removed or unreadable | Name-only card with failure text (existing `failed` state); announces | Typed `failed` |
| Lazy chunk fails | future `import()` rejects inside a `Suspense` | Same card (boundary sits outside any `Suspense`) | `renderFailed` |
| Select another file after failure | failed A, then B | B renders normally; A's URL revoked; A's late result dropped | N/A |
| Failure after supersede | A's `<img>` errors after B is selected | Ignored: the failure belongs to A's source key | N/A |

</frozen-after-approval>

## Open Questions

Non-interactive run: each default is applied in the tasks. A human can overturn it before implementation.

- Failure card with full metadata: keep the explanation order of the other cards (above the list) / move it beneath the list for every card (default; matches DESIGN.md and the AC, and slightly changes the Story 2.1 card layout).
- Should a failed image also keep the preview header? Default yes (header shows the name and stamp as for any ready file); alternative is a header-less card like the `failed` state.
- Unavailable *files*: Story 1.6 marks only folders unavailable (`unavailableIds` is used for folders), so unavailable-file selection reaches the pane as a `getFile()` rejection. Default: no new tree behavior; confirm this reading.
- Manual checks (Chrome or Edge: select a `.heic` and a corrupt `.png`, then click on to another file) cannot be proven headlessly — run them or report them not run.

## Code Map

- `src/components/PreviewPane.tsx` -- dispatcher (`rendererOf`, announcement effect). Add failure state keyed by `meta.name`+`imageUrl`/`id`; wrap the text/image branch in the boundary; render the card with `RENDER_FAILED_MESSAGE` when failed; include failure in the announcement effect (announce once, not on each render).
- `src/components/preview/PreviewBoundary.tsx` (new) -- class error boundary: `getDerivedStateFromError`, `componentDidCatch` calls `onFail()` only; renders `null` after catching; never reads or shows the error.
- `src/components/preview/ImagePreview.tsx` -- add `onError` prop wired to `<img onError>`. Remove the `throw` on a missing URL only if the boundary makes it redundant; leave it otherwise.
- `src/components/MetadataCard.tsx` -- add `failed?: boolean`; use `cardExplanation(name, size, failed)`; move the note beneath the `<dl>` per the default above. `meta === null` branch stays for read failures.
- `src/lib/preview.ts` -- `cardExplanation(name, size, failed = false)` returns `RENDER_FAILED_MESSAGE` first when `failed`. Do not touch `resolvePreviewKind`. Test in `preview.test.ts`.
- `src/types.ts` -- `ImagePreviewProps.onError?: () => void`; `MetadataCardProps.failed?: boolean`; export a `RenderFailure` key type only if needed.
- `src/App.css` -- adjust `.metadata-card__note` spacing for the new position (`App.css:303`); no new tokens.
- `src/services/previewSession.ts` -- no change expected; its tests already cover supersede and revoke. Add a test only if a gap is found.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- append the component-test entry.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/preview.ts` + `preview.test.ts` -- `failed` flag on `cardExplanation`; tests: failed wins over empty and `.doc`, default unchanged -- FR18
- [x] `src/types.ts` -- prop additions above -- AD-9
- [x] `src/components/preview/PreviewBoundary.tsx` -- boundary as described -- AD-9
- [x] `src/components/preview/ImagePreview.tsx` -- `onError` hook -- FR18
- [x] `src/components/MetadataCard.tsx` + `src/App.css` -- failed explanation, note beneath the list -- UX-DR17
- [x] `src/components/PreviewPane.tsx` -- boundary, failure state keyed per source, announcement -- UX-DR22, AD-10
- [x] `deferred-work.md` -- log untested `PreviewBoundary`, `ImagePreview` error path and `PreviewPane` failure branch (role `region`, `aria-labelledby`, `tabIndex`, announcement once); no DOM test environment exists, so none of it is exercised in a browser

**Acceptance Criteria:**
- Given a renderer throws or the image fires `error`, when the pane renders, then the Metadata Card shows "This file couldn't be previewed. It may be damaged or in an unexpected format." beneath the definition list, with the name as an `h2`, and no stack trace or error text appears.
- Given a failed preview, when I select another file, then it renders normally, the failed session's URL is revoked and a late result from it is discarded.
- Given `getFile()` rejects, then the name-only card with the failure text shows and "{name}: no preview available" is announced.
- Given the pane after any failure, then it is never blank, keeps `role="region"` with `aria-labelledby`/`tabindex="0"`, and stays keyboard-reachable.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec and `sprint-status.yaml`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Reselected failed text file stays on the card; id-only key never resets (BH, EC) | medium | patch | Pane state now holds the failed `PreviewSource` object; each session builds a new one, so reselecting retries. Key collision on `:` (EC) went away with it. |
| Failure announcement repeats / follows "Previewing {name}" (BH, EC) | low | rejected | `onAnnounce` is a stable `setStatus`; the effect runs per state or failure change. The two-message sequence is what the spec matrix asks for. |
| Duplicate `h2` on the card path (BH) | low | rejected | Pre-existing from Story 2.1 (header plus card); not caused by this change. |
| Boundary renders nothing if `onFail` no-ops; `failed` ignored on name-only card (EC) | false | rejected | `fail` always sets state for a ready source; the name-only card already shows the failure text. |
| React logs caught errors to the console (BH, EC) | low | rejected | React behaviour; nothing is shown on the page. |
| `ImagePreview` throw kept without a URL (BH, EC) | false | rejected | `rendererOf` only picks `image` with a URL, and the boundary covers it anyway. |
| No tests for boundary, `onError`, pane failure branch, card layout (VG) | medium (unverified) | defer | No DOM environment; logged in `deferred-work.md`. Not exercised in a browser. |
| Stray diff file, unchecked tasks, status mismatch (BH, EC, VG) | low | patch | Diff file deleted, tasks checked, sprint status set to `review`. |

## Design Notes

The failure state holds the failed `PreviewSource` object; every session builds a new one, so a new file, a new image URL or a reselect starts healthy, and a late `onError` from an old source cannot fail the new one. The boundary is keyed by `${id}:${imageUrl ?? ''}` so it remounts per file. Keep decision logic in `lib/` (`cardExplanation`) and the components thin, per `component-tests.md`. Component tests are deferred (no DOM environment, `component-unit-tests.md`): log them, and report the behavior as not exercised in a browser.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (the real type check)
- `npm run lint` -- expected: exits 0, read-only grep gate included
- `npm test` -- expected: all pass
- `grep -rn "createObjectURL\|revokeObjectURL" src` -- expected: only `previewSession.ts` and its test
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome or Edge: select a `.heic`, a corrupt `.png` and an unreadable file, confirm the card and the announcement, then select a normal file and a text file; check Tab and three themes. If not run, report it as not run.
- Commit when implemented: `feat(preview): degrade failed previews gracefully` with footer `Story: 2-4` above Co-Authored-By.
