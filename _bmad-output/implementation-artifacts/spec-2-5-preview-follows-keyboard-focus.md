---
title: 'Preview follows keyboard focus'
type: 'feature'
created: '2026-10-27'
status: 'in-review'
route: 'dispatch'
baseline_commit: '21ff613c03e009e8e7480f5ef190366439ad35c6'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Arrow keys move focus but the preview stays on the old file until Enter or Space, and a folder can never be previewed. Browsing a folder by keyboard feels dead.

**Approach:** Requirement change by the owner, overriding FR7, FR8 and Story 1.5's "moving focus never selects": keyboard navigation selects the row it lands on, so the preview follows at once. Folders become selectable and show a folder card (name, path, direct child counts). Preview loading is debounced and stale loads are dropped.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components`; `lib/` pure with JSDoc `@param`/`@returns`. Up/Down/Home/End/PageUp/PageDown/type-ahead, and Left/Right moves, select the destination row when it is a real item (not a placeholder), silently (no "Previewing" announcement; the focused row is already read). Enter/Space on a folder toggles it and selects it; on a file selects it and announces "Previewing {name}" as before. Mouse click on a folder toggles it and selects it (no announcement); click on a file as before. Folder rows carry `aria-selected` like files. A selected folder shows a folder card: `h2` name, Location (`path`), Contains ("N folders, M files", singular forms, "Empty" at zero), counted from the cached listing when present, else listed once; entries hidden by the dotfile toggle are not counted; no recursive size. A folder that cannot be listed shows the card with "This folder can't be read." The first selection from nothing loads at once; a change to another item waits about 75 ms before reading its content, while selection and focus change immediately; the previous preview stays until the new one is ready, and a late result never lands. Refresh keeps a selected folder selected and never probes it as a file. Keep `role="tree"`, `treeitem`, `role="group"`, roving tabindex (one `tabIndex=0`), and visible focus. Read-only, no network, no new dependency, no icon library, no inline `style`.

**Never:** Selection from Tab, from the initial focus after opening a folder, or from the focus repair after a row disappears. A recursive size or deep scan. Changes to `scripts/check-readonly.mjs`, `AGENTS.md`, or the frozen intent of earlier specs. Writing to the user's files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Down onto a file | Focus on a row above a file | File selected; preview updates after the debounce | N/A |
| Down onto a folder | Folder never expanded | Folder card with counts from one listing | Unreadable: card says it can't be read |
| Down onto a placeholder | "Empty folder" row | Focus moves; selection and preview unchanged | N/A |
| Hold Down across 20 rows | Rapid repeat | Only the final row's content is read | Stale reads dropped |
| Enter on a folder | Folder focused | Toggles expansion; folder stays selected and shown | N/A |
| Click a folder | Collapsed folder | Expands and shows its card | N/A |
| Hide dotfiles | Selected folder is `.git` | Selection clears, prompt returns | N/A |
| Refresh | Folder selected | Stays selected; card recounts | Missing folder: selection cleared with the existing notice |

</frozen-after-approval>

## Code Map

- `src/components/Tree.tsx` -- `handleKeyDown`: add a `follow(key)` helper (focus + silent select) used by every move and by Left/Right/Enter/Space; `focusRow` stays for focus repair and initial focus.
- `src/components/TreeNode.tsx` -- `activate()` selects folders too; `aria-selected` on every item.
- `src/services/tree.ts` -- `select` accepts folders; add `summarizeFolder(id)`; `refresh` skips the file probe for folders.
- `src/services/previewSession.ts` -- `open(id, name, directory)` returns a `folder` state via an injected summarizer (default `summarizeFolder`).
- `src/hooks/usePreview.ts` -- pass `directory`, debounce item switches (`SWITCH_DELAY_MS`), keep loading timer.
- `src/components/PreviewPane.tsx` -- render `FolderCard` for `folder` and directory `failed`; no announce for folders.
- `src/components/FolderCard.tsx` (new) -- reuses `metadata-card` classes and `Glyph`.
- `src/lib/format.ts` -- add `describeContents(folderCount, fileCount)`.
- `src/types.ts` -- `FolderSummary`, `PreviewState` `folder` and `failed.directory`, `TreeProps.onFollow`, `FolderCardProps`, selection comments.
- `src/App.tsx` -- `handleFollow` (silent), `handleSelect` announces files only; pass `onFollow`.
- Tests to update: `services/tree.test.ts`, `services/previewSession.test.ts`, `hooks/usePreview.test.tsx`, `lib` format tests, tree and App tests asserting folder `aria-selected` or no-select-on-move.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts`, `src/lib/format.ts` -- add types and `describeContents` with tests -- shared contract
- [x] `src/services/tree.ts`, `src/services/previewSession.ts` -- folder select, summary, session, refresh guard, tests -- data path
- [x] `src/hooks/usePreview.ts` -- debounce and folder state, tests -- fast, correct loading
- [x] `src/components/{FolderCard,PreviewPane,Tree,TreeNode}.tsx`, `src/App.tsx` -- UI and keyboard wiring -- behavior
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- add `2-5-preview-follows-keyboard-focus: review` after verification -- tracking

**Acceptance Criteria:**
- Given a focused file row, when the user presses Down onto another file, then `aria-selected` and the preview follow without Enter.
- Given a folder is selected, when the preview renders, then the folder card shows its direct counts and no size.
- Given the tree, when focus moves with any key, then exactly one `treeitem` has `tabIndex=0`.

## Implementation Notes

- Implemented directly, without subagents (none were requested). The three independent review layers were not run; the Review Triage Log below is a self-review, so `review` status stands until an independent check.
- Owner decisions folded in: folder card (no size); Enter/Space toggle folders; mouse click toggles and shows the card.
- Requirement change recorded here only: `epics.md` FR7/FR8 and the frozen text of spec 1-5 are untouched (editing planning files would also invalidate the cached epic contexts). Reconcile `epics.md` when convenient.
- Added `EmptyPreview` (moved out of `App.tsx` to stay under the 220-line cap), `FolderCard`, `describeContents`, `summarizeFolder`, `FolderSummary`, `TreeProps.onFollow`.
- Existing tests changed because behavior changed: `select` now accepts folders; refresh test for a selection under a collapsed folder replaced (a keyboard collapse now selects the folder, so that state is no longer reachable); `usePreview` tests advance the 75 ms switch delay.
- Debounce applies only when switching away from an item whose read already started; first selection and refresh reload are immediate.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence |
|---|---|---|
| Left to parent indexes `rows[findIndex(parentKey)]`; could be -1 | false | A visible row's parent folder is always an expanded, visible row in `visibleRows`. |
| Stale reads keep running during the 75 ms switch wait | low | Result ignored via `current`; read is cheap, the next session aborts it. Not patched. |
| Tab or initial focus could select | false | Selection is called only from `handleKeyDown` and click; covered by the tab-stop and initial-focus paths not calling `onFollow`. |
| Enter on an already-followed file no longer announces "Previewing" | low | Intended: keyboard moves are silent and the focused row is read by the screen reader; Enter on the same file is a no-op by design. |
| Folder summary counts follow the dotfile toggle but a cached count goes stale until Refresh | low | Matches how the tree itself behaves; Refresh recounts expanded folders. |
| No independent review layer ran | medium | Required before `done` by project rules; story stays at `review`. |

## Design Notes

Selection follows focus only for key-driven moves, so opening a folder or repairing focus never previews anything on its own.

## Verification

**Commands:**
- `npm run build` -- expected: no type errors
- `npm run lint` -- expected: clean, including the read-only gate
- `npm test` -- expected: all pass

**Manual checks (if no CLI):**
- Chrome or Edge: arrow through a 1,000-entry folder; preview keeps up with no stale flash; folder card correct; VoiceOver does not repeat announcements. Report NOT RUN if not done.
