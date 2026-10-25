---
title: 'Unreadable entries stay contained'
type: 'feature'
created: '2026-10-25'
status: 'done'
route: 'dispatch'
baseline_commit: 'efecf1b63c5c61fffedecde044eb7912d7ce7de1'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A folder whose read throws silently snaps back to collapsed, so the user cannot tell it is unreadable and may retry it forever.

**Approach:** `services/tree` records a failed read in a new `unavailableIds` snapshot set instead of collapsing. `Tree` and `TreeNode` render an Unavailable row, and an expanded unavailable folder shows a "This folder can't be read." placeholder. `visibleRows` includes that placeholder so keyboard navigation reaches it.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components`; `lib/` pure with JSDoc `@param`/`@returns`; role CSS variables only; no inline `style`; inline SVG only. `toggle` never throws. A failed `openChildDirectory` or `listChildren` marks the folder unavailable, keeps it expanded, clears its loading state and timer, and caches the outcome: later toggles expand or collapse with no re-read. Unavailable row: label in `text`, then a warning glyph and a caption "Unavailable" in `danger-text`; the `treeitem` gets `aria-describedby` pointing at one shared visually hidden element reading "Unavailable, can't be read" (ids may contain spaces, so no per-row ids). The accessible name still begins with the label. Placeholder text is exactly "This folder can't be read." Placeholder rows stay `aria-disabled`, roving and never selectable. Unavailable folders keep chevron and `aria-expanded`; a files-only mark is rendered by the same `unavailable` prop. Contrast of `danger-text` on `surface`, `row-hover` and `row-selected` was checked at 5.04:1 or better in all three themes, so tokens do not change.

**Never:** An alert, live-region announcement or focus move when a row becomes unavailable. A retry or refresh (Epic 4). Raw error text or stack traces in the UI. Changes to `AGENTS.md`, theme tokens in `index.css`, `src/lib/{files,format,pdf}.ts`, or the keyboard map. Marking files unavailable: no file read exists yet, so Story 2.x does that. A DOM test environment (deferred). An icon library.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First expand fails | `getDirectoryHandle` or `values()` throws | Folder stays expanded, id in `unavailableIds`, no `childIds` entry, not loading | Swallowed in `services/tree` |
| Slow read then fails | Fails after 150 ms | `loadingIds` cleared, spinner gone | Same |
| Re-toggle unavailable folder | Collapsed or expanded unavailable folder | Toggles `expandedIds` only; no handle call | N/A |
| Expanded unavailable folder | Rows built | One placeholder row "This folder can't be read." | N/A |
| Keyboard at unavailable folder | Right on expanded one | Focus moves to its placeholder | N/A |
| Sibling after a failure | Another folder or file | Expands, collapses and selects normally | N/A |
| Open a new folder | `openWorkspace` | `unavailableIds` cleared | N/A |
| Status change | Row becomes unavailable | No alert; focus unchanged | N/A |

</frozen-after-approval>

## Code Map

- `src/types.ts` -- add `unavailableIds: ReadonlySet<string>` to `TreeSnapshot` and `TreeProps`; `unavailable: boolean` to `TreeNodeProps`; `descriptionId` is not a prop (shared constant).
- `src/services/tree.ts` -- `EMPTY` and `openWorkspace` set `unavailableIds: new Set()`; `toggle` branches: expanded -> collapse; `childIds[id]` or `unavailableIds.has(id)` -> expand with no read; failure -> `withMember(unavailableIds, id, true)`, stay expanded, clear loading. Reuse `withMember`.
- `src/services/tree.test.ts` -- replace the "failed read leaves collapsed" case; add the matrix rows it can decide (reuse `fakeFolder`).
- `src/lib/tree.ts` -- `visibleRows` gains `unavailableIds`: an expanded unavailable folder gets the placeholder (after the loading check). Update JSDoc.
- `src/lib/tree.test.ts` -- cover the placeholder for an unavailable expanded folder.
- `src/components/Tree.tsx` -- pass `unavailable` to `TreeNode`; render the placeholder "This folder can't be read."; render the shared hidden description (`.visually-hidden` in `index.css`); export its id from `TreeNode.tsx`.
- `src/components/TreeNode.tsx` -- suffix: warning glyph (new inline SVG in `Glyph.tsx`, exported `Warning`) plus "Unavailable"; `aria-describedby` when unavailable.
- `src/components/Glyph.tsx` -- add `Warning` inline SVG (aria-hidden).
- `src/App.tsx` -- destructure `unavailableIds` and pass it to `Tree`.
- `src/App.css` -- `.tree-row__suffix`: caption size, `danger-text`, no shrink, not dimmed.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts`, `src/services/tree.ts`, `src/services/tree.test.ts` -- store marks and caches failed folder reads; tests for every matrix row it decides -- FR10, AD-5, AD-6
- [x] `src/lib/tree.ts`, `src/lib/tree.test.ts` -- unavailable placeholder in `visibleRows` with a test -- UX-DR7
- [x] `src/components/{Glyph,TreeNode,Tree}.tsx`, `src/App.tsx`, `src/App.css` -- Unavailable row, description and placeholder -- UX-DR6, UX-DR7

**Acceptance Criteria:**
- Given a folder whose read throws, when I expand it, then nothing is thrown into the UI and every other row stays interactive.
- Given an unavailable row, then it shows label, warning glyph and "Unavailable" in `danger-text`, and its accessible description is "Unavailable, can't be read".
- Given an unavailable folder, when I expand it, then "This folder can't be read." shows and no spinner persists.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec and `sprint-status.yaml`.

## Implementation Notes

`unavailableIds` lives in `TreeSnapshot`; `toggle` marks a failed folder, keeps it expanded and caches the outcome. `visibleRows` takes a sixth `unavailableIds` argument. The shared description element sits beside the `ul` (a `ul` may hold only `li` children), and the suffix is `aria-hidden` so the accessible name is the label alone and the description carries the status. Build, lint and 67 tests pass; the manual `chmod 000` browser check was not run.

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Unavailable row, placeholder and description have no running test; `Tree` and `visibleRows` precedence can drift (VG) | medium (unverified) | defer | No DOM test environment; recorded in `deferred-work.md`. |
| Three identical `visibleRows` branches could merge (BH) | low | rejected | Cosmetic; the separate branches mirror `Tree.renderRows`. |
| `unavailable` lacks an `isDirectory` guard (BH) | low | rejected | Spec makes the prop generic so Story 2.x can mark files. |
| Strings duplicated across `Tree` and `TreeNode` (BH) | low | rejected | The strings are fixed by the spec; no divergence named. |
| Missing keyboard and `aria-disabled` tests (BH) | medium (unverified) | defer | Same DOM-test gap as the first row. |
| No test that a stale failure is discarded (BH) | low | rejected | The `started !== generation` return precedes the failure branch (`services/tree.ts`). |
| Error reason discarded; failure is permanent until Refresh (BH) | false | rejected | Spec requires caching with no re-read and no raw error text. |
| Hidden description always rendered; fixed id; fragment layout (BH) | low | rejected | One Tree per app; `.visually-hidden` takes no layout space; `pageStep` reads the same parent. |
| `warning` class has no rule; suffix `flex: none` squeezes label (BH) | low | rejected | The label truncates on its own and the pane minimum is 220px. |
| Spec bookkeeping incomplete (BH) | false | rejected | Reviewed before the status update; now current. |
| `selectedId` rules for unavailable files undefined (BH) | low | rejected | No file can be unavailable until Story 2.x. |

## Design Notes

The store's typed outcome is the `unavailableIds` set: `toggle` keeps its `Promise<void>` signature, so no caller can see an exception. Listing reads names only, so at this stage only folders can fail; `unavailable` is generic so Story 2.x can mark files. Failure keeps the folder expanded so the placeholder explains why; the click that caused it is not undone.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0
- `npm run lint` -- expected: exits 0
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome with a folder containing one you cannot read (e.g. `chmod 000` on a subfolder): expand it, confirm the suffix, placeholder and no spinner; then expand, collapse and select elsewhere, and use the arrow keys onto the placeholder.
