---
title: 'Refresh the selected file''s preview'
type: 'feature'
created: '2026-10-26'
status: 'in-review'
baseline_commit: 'c96e12dd0ced6bd0a1933ffbeaa9403fa891efa1'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 4.1 refreshes the tree, but the open preview and its "Modified" stamp keep showing the old file, so a change made from the terminal is not visible and the user cannot tell the change landed.

**Approach:** When a Refresh completes with the Selection still present, the store bumps a `refreshCount` in its snapshot. `usePreview` takes it as a reload key and opens a new `previewSession` for the same id (AD-7, AD-10), which re-reads `size`, `updatedAt` and type through `getFile()` for the Selection only. The old content stays until the new session lands. "Refreshed." is announced when that session settles. Missing-selection and unreadable-folder messages are Story 4.3.

## Boundaries & Constraints

**Always:** Reload goes through `previewSession.open` only; no other code creates or revokes object URLs. `getFile()` only for the Selection (via `readItemFile`). Kind comes from `resolvePreviewKind` via the session. The previous content stays visible while reloading; "Loading preview..." appears after 150 ms. The `.preview` region is not remounted, so scroll position is kept. Renderers do not import `services/tree`. Never edit `scripts/check-readonly.mjs`, `src/architecture.test.ts`, `src/rendererLint.test.ts` or other scanners. Commit (when later asked) as `feat(preview): refresh the selected file's preview` with footer `Story: 4-2`, above the Co-Authored-By line.

**Never:** No preview reload on a plain re-select, dotfile toggle or folder toggle. No new `useState` copy of tree or preview data beyond what `usePreview` already holds. No `getFile()` for other entries. No new status strings beyond "Refreshing...", "Refreshed.", "Selection cleared" and the existing preview strings. No handling of a vanished selection under a collapsed folder beyond the existing failed-session card (Story 4.3). No change to the renderers, `PreviewBoundary` or `reconcile`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Changed file | Selected file edited, Refresh | New session; new content and "Modified {when}" for text, image, Markdown, DOCX, PDF and card | N/A |
| Unchanged file | No disk change | Equivalent preview and stamp; no blank, header kept | N/A |
| Slow reload | Takes over 150 ms | Old content stays; "Loading preview..." after 150 ms; "Refreshing..." then "Refreshed." once | N/A |
| Switch mid-reload | Select another file before the session lands | Earlier result discarded; only the latest selection shows; no "Refreshed." | Aborted session returns `null` |
| Kind change | Now empty, or new extension or type | `resolvePreviewKind` picks the renderer; zero bytes shows the card "This file is empty." | N/A |
| Reload fails | File exists, read or render rejects | Metadata Card with the render-failure text; pane responsive | Session returns `failed`; `PreviewBoundary` |
| Selection cleared by Refresh | 4.1 cleared it | No reload; "Selection cleared" as in 4.1 | N/A |
| Refresh failed or skipped | Root unreadable, re-entry, new workspace | No `refreshCount` bump, no reload | N/A |
| No selection | Refresh with nothing selected | "Refreshed."; no session opened | N/A |

</frozen-after-approval>

## Code Map

- `src/services/tree.ts` -- `refresh()` final `publish` (~l.236); add `refreshCount` to the initial snapshot and bump it only there. `readItemFile` (l.126) is the single read the session uses; unchanged.
- `src/types.ts` -- add `refreshCount: number` to `TreeSnapshot` (l.49); `PreviewPaneProps` unchanged.
- `src/hooks/usePreview.ts` -- add a `reloadKey` parameter to the effect deps; return `settledKey` (the key of the last result that landed). Keep: previous result stays, 150 ms timer, idle reset, `null` results ignored.
- `src/services/previewSession.ts` -- no change expected: `open` already aborts and revokes the previous session and discards late results.
- `src/App.tsx` -- pass `snapshot.refreshCount` to `usePreview`; `handleRefresh` (l.57) defers "Refreshed." while a reload is pending; `announce`/`say` reused. `PreviewPane`'s `onAnnounce={setStatus}` stays.
- `src/components/PreviewPane.tsx` -- no change expected: `sourceKey` remounts only when the id or object URL changes, so text keeps its node and `.preview` keeps its scroll.
- `src/App.refresh.test.tsx` -- fake-fs patterns and the `adoptedStyleSheets` stub to reuse. `src/services/previewSession.test.ts`, `src/services/tree.test.ts` -- fakes to reuse.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts` -- `refreshCount` on `TreeSnapshot` -- the reload key
- [x] `src/services/tree.ts` -- start at 0 (also reset by `openWorkspace`), `+1` in the successful `refresh()` publish only -- failed, skipped and stale refreshes must not reload
- [x] `src/services/tree.test.ts` -- count bumps once per successful refresh; not on failed, skipped (re-entry, stale after `openWorkspace`) or collapsed-only changes
- [x] `src/hooks/usePreview.ts` -- `usePreview(item, reloadKey)`; reload effect depends on `[id, name, reloadKey]`; return `settledKey` -- same id re-opens a session without clearing the old result
- [x] `src/hooks/usePreview.test.tsx` -- new; also closes the deferred 3.1 hook entry: old result kept while loading, idle reset, "Loading preview..." only after 150 ms, reload keeps the result until the new one lands, late result of a superseded id dropped, `settledKey` follows
- [x] `src/App.tsx` -- wire `refreshCount`; announce "Refreshed." once when `settledKey` reaches the refresh's count; announce at once if nothing is selected; drop the pending announcement if the selection changes -- UX-DR22
- [x] `src/App.refresh.test.tsx` -- mocked `services/fs`: changed text shows new content and new stamp; unchanged file leaves the header in place; `getFile` is called once for the Selection, never for others; announcements "Refreshing..." then "Refreshed." once; switch mid-reload discards the stale result; empty file shows "This file is empty."; rejected reload shows the render-failure card; `.preview` element identity kept
- [x] `src/services/previewSession.test.ts` -- same id opened twice revokes the first image URL and returns `null` for the first call if it was still pending

**Acceptance Criteria:**
- Given a changed selected file, when Refresh completes, then a new session for the same id shows the new content and "Modified {when}" for each kind, and the previous URL is revoked.
- Given the I/O matrix cases, when I run `npm test`, then each passes.
- Given a reload past 150 ms, when the old content is showing, then it stays and "Loading preview..." appears; "Refreshed." is announced after the new session lands.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` shows only the files listed above.

## Implementation Notes

- `usePreview` returns `settledKey`; `App` announces "Refreshed." once when it reaches `refreshCount`, and resets its announced count when it starts waiting (the store resets `refreshCount` per folder).
- The Chrome/Edge check was NOT run: kept scroll position, image and PDF flash or revoked-URL blanking, PDF viewer reload, and the 1,000-entry feel. jsdom with fake handles proves DOM shape only (logged in `deferred-work.md`).
- Verified: `npm run build`, `npm run lint`, `npm test` (418 tests) all pass.

## Spec Change Log

## Review Triage Log

| Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|
| `announcedCount` not reset after `openWorkspace` zeroes `refreshCount`; a later refresh at the old count never announces (blind, edge) | medium | patch | Reset the count when a wait starts; added a reopen-then-refresh App test. |
| "Refreshed." deferral, switch mid-reload and the failed-reload announcement are unpinned (gap) | medium | patch (test only) | Added App tests: announced only after the gated reload lands, stale result and announcement dropped on another selection, failed reload still reaches "Refreshed.". |
| `getAllByRole('status')[0]` hides which region is read (blind, gap) | low | patch | Query narrowed to the app's `.visually-hidden` region. |
| Old blob URL revoked while old image or PDF is still shown (edge) | maybe-false | defer | Existing AD-10 behavior (`end()` revokes at once); needs a browser; logged in `deferred-work.md`. |
| No `.catch` on `openPreview` (blind, edge) | false | rejected | `previewSession.open` never throws; every failure becomes a `failed` state. |
| Reload never settles when `open` returns `null` (blind, edge) | false | rejected | `null` means a newer session replaced it, and that one sets the key; a selection change drops the wait. |
| `eslint-disable` comment; `selectedIdRef` lags a commit; idle reset keeps `key`; missing image-URL and fast-reload tests (blind, edge) | low | rejected | No reachable harm shown; lint passes; fixes add branches or duplicate existing hook and session tests. |
| `review-diff-4-2.tmp`, `sprint-status.yaml` outside the file list (edge) | false | rejected | The temp file was deleted; `sprint-status.yaml` is the required story-status change. |

## Design Notes

A snapshot counter keeps `services/tree` the only writer and avoids the preview hook reaching into the store (renderers and hooks use snapshots, AD-5). The hook, not the store, owns reload: AD-10 puts sessions in `previewSession`, started from `usePreview`.

Decisions made by default (user would not notice or can veto in review):
- "Refreshed." waits for the preview session to settle (so it means the pane is current); a superseded selection drops it, because "Previewing {name}" already spoke.
- A card file's own "{name}: no preview available" may speak just before "Refreshed."; the effect order makes "Refreshed." the last one heard.
- An image or PDF gets a new blob URL, so its element is replaced even when unchanged. Equivalent, but a flash is possible; judged in the browser check, not suppressed by skipping the session (the AC requires a new session).

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (type check; `npx tsc --noEmit` checks nothing)
- `npm run lint` -- expected: exits 0, includes the read-only gate
- `npm test` -- expected: all pass
- `git status` -- expected: only the files listed above

**Manual checks (if no CLI):**
- NOT RUN until done in Chrome or Edge: edit open text, Markdown, DOCX, image and PDF files from a terminal, press Refresh, and confirm new content and stamp, kept scroll position, no flash on an unchanged image or PDF, and the PDF viewer reload. jsdom cannot show layout, scroll or the viewer.
