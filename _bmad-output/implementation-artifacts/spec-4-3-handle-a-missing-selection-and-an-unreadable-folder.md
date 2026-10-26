---
title: 'Handle a missing selection and an unreadable folder'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: '0ca9307261d6a7553d71ff2f9eec59907ac1e93e'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After Refresh, a Selection that was deleted, is unreadable, or sits under a deleted or collapsed folder is cleared silently ("Selection cleared") or not at all, and an unreadable Workspace Folder gives no message. The user can mistake a stale or blank pane for current content.

**Approach:** `refresh()` verifies a surviving Selection with one `getFile()` before it publishes; if that fails the Selection is cleared in the same publish and the outcome carries the cleared name. `App` shows "{name} was removed or can no longer be read, so the selection was cleared." as a notice above the prompt (mirrored to the polite status region) until the next selection. A failed root read reuses the existing inline `role="alert"` message and clears nothing.

## Boundaries & Constraints

**Always:** `services/tree` stays the only writer; `reconcile` stays pure and unchanged. `getFile()` only for the Selection (via the store's `readFile`). Ids, kind-change and same-id-replaced rules from 4.1 and 4.2 apply (same id and kind means the Selection is kept and 4.2 reloads it). The notice is one `useState` string in `App` (UI notice, not store data). Strings are exact: the notice above; "Access to that folder wasn't granted. Choose a folder to try again." (reuse `DENIED_MESSAGE`); "This folder can't be read." and "Unavailable" already exist. Tab stop is repaired at once and focus stays on Refresh (4.1 behavior; keep). Commit (when later asked) as `feat(refresh): handle a missing selection and an unreadable folder` with footer `Story: 4-3`, above the Co-Authored-By line. Run `npm run build`, `npm run lint`, `npm test` first.

**Never:** No edits to `scripts/check-readonly.mjs`, `src/architecture.test.ts`, `src/rendererLint.test.ts` or other scanners. Components and `App.tsx` do not import `services/`. No new `getFile()` for other entries; no listing of collapsed folders. No network, no icon library. No notice for the Hidden files "Selection cleared" path (unchanged). No new announcement strings beyond the two above and the existing ones.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Selection deleted | Selected file gone from a listed folder | Selection clears; pane shows "Select a file to preview it."; notice above it with the exact string; same string in the status region; notice stays until next selection | N/A |
| Selection unreadable | Listed, but `getFile()` rejects | Same clear-and-explain; the row stays in the tree | Probe failure = cleared |
| Parent removed | Selection's ancestor folder deleted | Ancestor row disappears, Selection clears, same notice | `reconcile` drops it |
| Under collapsed folder | Selection under a collapsed ancestor, file deleted | Probe through the cached parent handle fails; same notice (closes deferred 4.1 entry) | Missing handle = cleared |
| Expanded folder unreadable | Expanded folder fails to list | Folder marked "Unavailable" with "This folder can't be read." child; rest of tree works | 4.1 behavior; pinned by test |
| Root unreadable | Root listing rejects | Tree, Selection and preview kept; `role="alert"` with the access message under the toolbar; cleared by next action; Open folder still works | Outcome `failed`; nothing cleared |
| Same path replaced | New file, same id and kind | Selection kept; preview reloads (4.2) | N/A |
| Next selection | Notice showing, user selects a file | Notice disappears | N/A |
| Focus on vanished row | Row removed | Focus stays on Refresh; one tab stop | N/A |

</frozen-after-approval>

## Open Questions

Defaults applied so the spec can proceed; veto in review.

- Probe cost: the probe adds a second `getFile()` for the Selection beside 4.2's reload — options: probe (clean atomic clear, covers collapsed ancestors; 4.2's "once" test becomes "Selection only") / let the 4.2 reload report `failed` and clear then (no extra read, but cannot tell a read failure from a render failure, and the tree shows the dead row for a moment). Default: probe.
- Notice lifetime: kept across Open folder? Default: cleared on a new workspace and on selecting a file; a failed or later Refresh leaves it until then.
- A selection under a deleted-and-recreated collapsed folder (stale handle) is cleared with the notice; acceptable, noted in deferred work.

## Code Map

- `src/services/tree.ts` -- `refresh()` (~l.208): after `reconcile`, probe `next.selectedId` via the parent handle (`gathered.opened` then `handles`) with `readFile`; recheck `generation` after the await; set `selectedId` to `null` and `selectionCleared` true on failure; capture the pre-refresh item name for `clearedName`. `readFile` is already imported.
- `src/types.ts` -- `RefreshOutcome` `refreshed` gains `clearedName: string | null`.
- `src/App.tsx` -- `handleRefresh` (l.76): cleared → `setNotice(msg)` and `say(msg)`; `failed` → `setDenied(true)` instead of `announce('')`; dismiss `denied` at the start of refresh, select, toggle and dotfile toggle; `handleSelect` and `handleOpen` clear the notice. Prompt branch (l.181) renders the notice above `.prompt`.
- `src/App.css` -- a notice style reusing `--color-notice-*` tokens (see `.truncation-banner`, l.270); no inline `style`.
- `src/App.refresh.test.tsx` -- fake-fs patterns and `adoptedStyleSheets` stub; update the 4.1 test expecting "Selection cleared" (l.154) to the new string. `src/services/tree.test.ts` -- store fakes.
- Do not change: `src/lib/reconcile.ts`, `previewSession`, `usePreview`, renderers, `Tree`.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts` -- add `clearedName` to the `refreshed` outcome -- App needs the name
- [x] `src/services/tree.ts` -- probe the surviving Selection before publish; clear in the same publish; stale-generation safe -- FR21, AD-7
- [x] `src/services/tree.test.ts` -- deleted, unreadable, parent removed, collapsed-ancestor deleted, same-id kept, root failed leaves state untouched, stale refresh after `openWorkspace` ignored, one probe `getFile` only for the Selection
- [x] `src/App.tsx` -- notice state, status mirror, denied reuse, dismissal on next action -- UX-DR22, UX-DR23
- [x] `src/App.css` -- notice style from existing tokens
- [x] `src/App.refresh.test.tsx` -- one test per matrix row (exact strings, `role="alert"` and status mirror, notice gone after select, Unavailable folder with placeholder, focus on Refresh, single `tabIndex=0`, Open folder still enabled); adjust 4.2 getFile-count assertions
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- add the unrun Chrome/Edge check (real deletion, permission revoked, stale handle, focus) per `.claude/rules/component-tests.md`
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- 4-3 to `ready-for-dev` now (done only after an independent check)

**Acceptance Criteria:**
- Given the I/O matrix cases, when I run `npm test`, then each passes.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` shows only the files listed here.
- Given a cleared Selection, when the status region is read, then it holds the same string as the notice.

## Implementation Notes

- `refresh()` probes the surviving Selection with one `readFile`, then re-runs `reconcile` against the live snapshot so a selection made during the probe is kept. The notice renders for every non-selected pane except the Open-folder prompt (the review found it missing from "This folder is empty." and "Nothing to show.").
- 4.2's "reload rejects shows a card" test now fails the render (`slice` throws) because a rejected `getFile` is a cleared Selection under 4.3; slow-reload tests let the probe's read pass first.
- The Chrome/Edge check was NOT run (real deletion, revoked permission, focus, screen reader); logged in `deferred-work.md`, with the stale-handle question.
- Verified: `npm run build`, `npm run lint`, `npm test` pass.

## Spec Change Log

## Review Triage Log

| Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|
| Notice missing from the empty-folder and "Nothing to show." panes (blind, edge) | medium | patch | Moved the notice above the pane branches; added an empty-folder test. |
| Selection change during the probe is untested (gap) | medium | patch (test only) | Added a store test: `select('b')` while the probe is held; kept. |
| Open folder, folder toggle and Hidden files toggle dismissals unpinned (gap) | medium | patch (test only) | Added App tests for all three. |
| Root failure reuses the access message (blind) | false | rejected | The spec mandates that exact string. |
| Probe treats any error as removed (blind) | false | rejected | "Removed or can no longer be read" is the spec's meaning. |
| `clearedName` can name another file; stale probed id (blind, edge) | false | rejected | The re-reconcile uses the live snapshot, so the cleared file is the named one. |
| Probe on a failed-parent stale handle; directory Selection (edge) | false | rejected | `reconcile` already dropped a Selection under a failed folder; `select()` refuses folders. |
| Stale announcement or alert after another action (edge) | low | rejected | Refresh is the only writer of that state and the fix adds guards. |
| Duplicate `notice` helper, fragile store leak, JSDoc width, spec task wording (blind) | low | rejected / patch | Removed the duplicate helper; the rest is cosmetic or frozen. |
| Double `getFile()`, stale handle for recreated folder (edge) | maybe-false | defer | Accepted defaults; logged in `deferred-work.md`. |

## Design Notes

Probing inside `refresh()` before `publish` keeps the clear atomic with the tree update, so the row and preview never disagree, and keeps `services/tree` the single writer. `usePreview` cannot do it because its `failed` state also covers render failure.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (`npx tsc --noEmit` checks nothing)
- `npm run lint` -- expected: exits 0, includes the read-only gate
- `npm test` -- expected: all pass
- `git status` -- expected: only the files listed above

**Manual checks (if no CLI):**
- NOT RUN until done in Chrome or Edge: delete the open file, its parent, and an expanded folder from a terminal, revoke folder permission, press Refresh, and confirm messages, focus on Refresh and tab stop. jsdom with fake handles proves DOM shape only.
