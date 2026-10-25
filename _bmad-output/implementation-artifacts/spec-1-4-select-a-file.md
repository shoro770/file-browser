---
title: 'Select a file'
type: 'feature'
created: '2026-10-25'
status: 'done'
baseline_commit: '506a024f5f10287e60f430d31725061951cf1e63'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** File rows are inert: `selectedId` exists in the store but nothing can set it, so the user cannot mark which file the preview pane is about.

**Approach:** Add a `select` intent to `services/tree` (single file id, the only writer). File rows select on click, Enter or Space; folder rows keep toggling and never touch the selection. The status region announces "Previewing {name}".

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components`; components never import `services/`. Selection is one id in `services/tree`, changed only via `select(id)`; it accepts only a loaded, non-directory id and ignores anything else. Selecting the already-selected file is a no-op (no publish, no re-announce). File rows carry `aria-selected` `true`/`false`; folder rows never carry it. Focus stays on the row (no focus call on select). Selected row keeps the existing `row-selected` fill and 3px `accent` `border-inline-start`; hover `row-hover`; focus ring 2px inset `focus-ring` (already in `App.css`; verify, change only if wrong). Enter/Space `preventDefault` and ignore `event.repeat`. The persistent `role="status"` region announces "Previewing {name}" when the selection changes to a file. Opening a new workspace clears the selection (existing) and the preview pane shows "Select a file to preview it." / "Folders open in the tree on the left." (existing). Tab stop priority stays: focused row, else selected row, else first. Role CSS variables only; no network, no new dependency; `Tree` still owns roving tabindex.

**Never:** Previews or any preview-pane change on selection (Epic 2); the pane keeps showing the prompt. "Selection cleared" announcement and clearing on hide or refresh (Story 1.7, Epic 4). Left/Up/Down/Home/End/type-ahead (Story 1.5). Dotfile hiding, unavailable marks, Refresh. Selecting folders or placeholder rows. Writing anything. An icon library. Edits to `AGENTS.md` or `src/lib/{files,format,pdf}.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Select a file | Click, Enter or Space on file row | That id is the only selection; `aria-selected="true"`, others `"false"`; focus stays; status "Previewing {name}" | N/A |
| Select a second file | File A selected, activate B | Only B selected; A `aria-selected="false"`; announce B | N/A |
| Re-select same file | Activate the selected file | No state change, no new announcement | N/A |
| Activate folder | File selected, activate a folder | Folder toggles; selection unchanged; folder has no `aria-selected`; no announcement | N/A |
| Select inside nested folder | File under an expanded folder | Selected as above; collapsing the parent keeps `selectedId` | N/A |
| Invalid id | `select` called with unknown id, a folder id or `null`-like input | Ignored, snapshot unchanged | Silent no-op |
| New workspace | File selected, open another folder | Selection `null`, prompt shown | N/A |

</frozen-after-approval>

## Code Map

- `src/services/tree.ts` -- add exported `select(id)`: guard `snapshot.items[id]` exists and `!isDirectory`, no-op if equal to `selectedId`, else `publish({ ...snapshot, selectedId: id })`. `openWorkspace` already resets `selectedId: null`.
- `src/hooks/useTree.ts` -- expose `select`; update the JSDoc `@returns`.
- `src/types.ts` -- `TreeProps`: add `onSelect: (id: string) => void`; `TreeNodeProps`: add `onSelect`.
- `src/components/Tree.tsx` -- pass `onSelect` to `TreeNode`. Selected tab-stop logic already exists.
- `src/components/TreeNode.tsx` -- click on a file row calls `onSelect(id)`; Enter/Space on a file calls `onSelect` (inside the existing `repeat` guard), folders keep `onToggle`. `aria-selected` already folder-excluded.
- `src/App.tsx` -- `handleSelect(id)`: skip if `id === selectedId`, call `select(id)`, `setStatus('Previewing ' + items[id].name)`; pass to `Tree`. Do not touch focus-on-open or the preview pane.
- `src/App.css` -- verify selected, hover and focus rules match UX-DR4; no change expected.
- `src/services/tree.test.ts` -- extend with `select` tests; the existing fake-folder harness stubs `fs`.

## Tasks & Acceptance

**Execution:**
- [x] `src/services/tree.ts`, `src/hooks/useTree.ts` -- `select` intent and hook exposure -- AD-5, FR7
- [x] `src/types.ts`, `src/components/Tree.tsx`, `src/components/TreeNode.tsx` -- `onSelect` prop; click, Enter, Space select files, folders unchanged -- UX-DR8, UX-DR24
- [x] `src/App.tsx` -- `handleSelect` with "Previewing {name}" announcement -- UX-DR22
- [x] `src/App.css` -- confirm selected, hover and focus styling; edit only if it deviates -- UX-DR4
- [x] `src/services/tree.test.ts` -- cover every matrix row except the DOM-only ones: select, replace, same-id no-op (listener not called), folder id ignored, unknown id ignored, survives parent collapse, cleared by a new workspace, no `getFile()` call -- AD-5

**Acceptance Criteria:**
- Given an open tree, when a file is activated by click, Enter or Space, then exactly one file row has `aria-selected="true"` and focus stays on that row.
- Given a selected file, when a folder is activated, then it toggles, the selection is unchanged and the folder row has no `aria-selected`.
- Given any tree state, then exactly one `treeitem` has `tabIndex=0`.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec and `sprint-status.yaml`.

## Implementation Notes

`select` is synchronous and lives next to `toggle` in `services/tree.ts`. `TreeNode` routes click, Enter and Space through one `activate()` (toggle for folders, select for files). `App.css` already matched UX-DR4 (3px `border-inline-start` accent on `.is-selected`, `row-hover`, 2px inset focus ring), so it was not edited. Review found no patchable defects.

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| `onClick={activate}` fires for placeholder rows (BH) | false | rejected | Placeholders render through `TreePlaceholder`, which has no click handler or `activate`. |
| `handleSelect` announces or throws when `select` ignores the id, or `items[id]` is undefined (BH, EC, VG) | low | rejected | `TreeNode` only passes ids of rows rendered from the same snapshot, so it is unreachable today; a guard adds a branch. |
| `id === selectedId` check duplicated in `App` and the store (BH) | low | rejected | Harmless duplicate; the store guard is the authority and the `App` one only skips a redundant `setStatus`. |
| Stale "Previewing X" after a new workspace opens (BH, EC) | false | rejected | `handleOpen` calls `setStatus('')` and then sets "Opened {name}". |
| Same file name in two folders gives an identical status string, so no re-announcement (EC) | low | rejected | Real but narrow; the focused row is announced by the screen reader anyway. Fixes need a token or a changed string, and the string is frozen. |
| `__proto__` / `constructor` ids on the plain `items` record (BH, EC) | low | rejected | `select` only receives ids of rendered rows; a file literally named `__proto__` is a pre-existing `items` problem in `openWorkspace`/`toggle`, which write the same record. |
| `select(null as unknown as string)` is type-unsafe (BH) | false | rejected | The cast deliberately exercises the matrix's "null-like input" row; the store ignores it. |
| Sprint status vs spec status disagree; empty Implementation Notes (BH) | false | rejected | Sprint status moves to `review` in step 5; the notes are filled in now. |
| Missing edge-case tests: select before any workspace, id in a collapsed parent (BH) | low | rejected | Both reduce to the covered `items[id]` guard and the survives-collapse test. |
| No test for `activate` routing, `event.repeat` and the "Previewing" announcement (BH, VG) | medium (unverified) | defer | No DOM test environment; extends the existing component-test entries. Recorded in `deferred-work.md`. |

## Design Notes

The announcement lives in `App` (which already owns the status string) rather than the store, so `services/` stays free of UI text. `select` is synchronous and idempotent, which is why the same-file case needs no extra state. Component behavior (aria attributes, focus staying put) stays covered only by manual checks until a DOM test environment exists (see `deferred-work.md`).

## Verification

**Commands:**
- `npm run build` -- expected: exits 0
- `npm run lint` -- expected: exits 0
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome: open a folder, click, Enter and Space a file (selected bar, focus stays, status text "Previewing …" in the DOM), select a second file, activate a folder while a file is selected, open another folder and confirm the prompt returns.
