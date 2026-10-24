---
title: 'Expand and collapse folders'
type: 'feature'
created: '2026-10-25'
status: 'done'
baseline_commit: '4d89611cdcceaf645fc336a02566506218364fd3'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Folder rows in the tree are inert (`aria-expanded` is hard-coded `false`), so nothing below the top level can be reached.

**Approach:** Add a `toggle` intent to `services/tree` that lazily lists one folder level on first expand, caches it, and keeps expansion state. `Tree`/`TreeNode` render nested children in a `role="group"`, with chevron, indent, delayed Loading row and Empty-folder row.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components`; components never import `services/`. Only `services/fs` touches handles; child folders are reached via `getDirectoryHandle()` and listed with the existing `listChildren` (names and kinds only, no `getFile()`). Order with `compareFileItems`. A folder is read at most once per opened workspace; re-expand uses cache, no read, no loading UI. Expansion state of descendants survives collapse/re-expand; opening a new workspace discards everything. Click, Enter, Space or Right on a collapsed folder expands it; click, Enter or Space on an expanded folder collapses it. Enter/Space must not scroll the page. Folder rows keep `aria-expanded`, children sit in `role="group"`; all rows keep `aria-level`/`aria-setsize`/`aria-posinset` relative to their siblings; exactly one `treeitem` has `tabIndex=0` and `Tree` still owns it. Indent 16px per level, via class or CSS custom property (no inline `style`). Chevron (inline SVG, `aria-hidden`, `currentColor`) rotates 90° when expanded. Loading appears only if a read exceeds 150 ms: chevron becomes a spinner and a child row "Loading..." (`role="treeitem"`, `aria-disabled="true"`, no `aria-expanded`). Empty folder shows a muted "Empty folder" row (same roles). Under `prefers-reduced-motion` the spinner is static and the chevron rotates instantly. Role CSS variables only; no network, no new dependency. `lib/` functions pure with JSDoc `@param`/`@returns` and tests.

**Never:** Selection, folder-click selecting anything, Left/Up/Down/Home/End or other keyboard map (Story 1.5), unavailable marks or unreadable-folder row (1.6), dotfile hiding (1.7), Refresh. Writing anything or requesting `readwrite`. An icon library. Edits to `AGENTS.md`, `lib/files.ts`, `lib/format.ts`, `lib/pdf.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First expand, fast | Collapsed folder with entries, read < 150 ms | Immediate children, folders-first, `aria-expanded="true"`, no Loading row | N/A |
| First expand, slow | Read > 150 ms | At 150 ms spinner and "Loading..." row; replaced by children on completion | N/A |
| Re-expand | Previously expanded then collapsed | Cached children shown, no read, no loading | N/A |
| Nested state | Expand `a`, expand `a/b`, collapse `a`, expand `a` | `a/b` still expanded | N/A |
| Empty folder | Folder has no entries | One "Empty folder" placeholder child | N/A |
| Idle | Never-expanded or collapsed folders | No directory read | N/A |
| Double activation | Expand clicked again while read pending | Single read; no duplicate rows | N/A |
| Read fails | Folder listing throws | Folder stays collapsed, no message (1.6 owns unavailable) | Swallowed, no raw error |
| Replace | New workspace opened mid-read | Stale read result is discarded | N/A |

</frozen-after-approval>

## Code Map

- `src/types.ts` -- extend `TreeSnapshot` with `childIds` (id → ordered child ids), `expandedIds`, `loadingIds`; extend `TreeNodeProps`/`TreeProps` (children, expand handlers, per-id state); add `Placeholder` row kind if needed.
- `src/services/fs.ts` -- reuse `listChildren`; add `openChildDirectory(parent, name)` via `getDirectoryHandle()`. No other handle use.
- `src/services/tree.ts` -- add `toggle(id)`; store holds a handle per folder id, `childIds`, expanded set, 150 ms loading timer, stale-read guard keyed by workspace generation. `openWorkspace` resets all of it. Keep ids as the only keys.
- `src/hooks/useTree.ts` -- expose `toggle`.
- `src/lib/tree.ts` -- reuse `toId`, `glyphForName`; add pure `parentId(id)` and `nameOf(id)` helpers if needed for handle lookup.
- `src/components/TreeNode.tsx`, `Tree.tsx` -- recursive rows, `role="group"`, chevron, placeholder rows, Enter/Space/Right on folders, click; `Glyph.tsx` -- add chevron and spinner SVGs (not part of the seven kind glyphs).
- `src/App.tsx`, `src/App.css` -- wire snapshot to `Tree`; indent, chevron rotation, spinner, reduced-motion rules. Do not change focus-on-open or live-region logic.
- `src/lib/tree.test.ts`, `src/services/tree.test.ts` -- extend; the store test shows how to stub `fs`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/types.ts` -- add expansion, children and loading state and row props -- AD-4, AD-5
- [ ] `src/lib/tree.ts`, `src/lib/tree.test.ts` -- pure id-parts helpers with tests -- AD-2
- [ ] `src/services/fs.ts` -- `openChildDirectory` read-only -- AD-13
- [ ] `src/services/tree.ts`, `src/hooks/useTree.ts`, `src/services/tree.test.ts` -- `toggle`, cache, nested state, 150 ms loading, stale guard; tests cover every matrix row with a fake directory handle, including zero reads when idle and no `getFile()` calls -- AD-1, AD-5, AD-6
- [ ] `src/components/Tree.tsx`, `TreeNode.tsx`, `Glyph.tsx` -- nested rendering and activation keys -- AD-3
- [ ] `src/App.tsx`, `src/App.css` -- indent, chevron, spinner, reduced motion -- UX-DR4, 7, 27

**Acceptance Criteria:**
- Given an expanded folder, then its children are inside a `role="group"` and every level has correct `aria-level`, `aria-setsize`, `aria-posinset`.
- Given any tree state, then exactly one row has `tabIndex=0`.
- Given a folder of about 1,000 entries, when expanded, then children render in under 100 ms.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec, `sprint-status.yaml`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Indent width hardcoded `16px` instead of the `--size-tree-indent` token (EC) | low | patch | Token exists in `index.css`; `.tree-row__indent` now uses it. |
| Held Enter/Space auto-repeat toggles a folder repeatedly (EC) | low | patch | `TreeNode` ignores `event.repeat` after `preventDefault`. |
| No test runs `Tree`/`TreeNode` visible-set, tab stop, ARIA markup (VG, BH) | medium (unverified) | defer | No DOM test environment; same gap as the Story 1.2 entry. Recorded in `deferred-work.md`. |
| Left, Up/Down, Home/End, Right-to-child missing (BH) | false | rejected | Frozen Never assigns the keyboard map to Story 1.5. |
| Focus lost when a collapse unmounts the focused row (BH) | false | rejected | Collapse runs only from the folder row itself, which takes focus on click or key. |
| `aria-expanded="true"` with no group in the first 150 ms (BH, EC, VG) | low | rejected | Frozen matrix requires no Loading row under 150 ms; the fix adds state. |
| Failed read gives no feedback (BH, EC, VG) | false | rejected | Frozen matrix says swallowed; Story 1.6 owns unavailable. |
| Toggle ignored while first read is pending (EC, VG) | low | rejected | Matrix "Double activation" requires a single read; a queued collapse adds state. |
| Placeholder rows lack `aria-busy`/live announcement (BH, EC) | low | rejected | Roles are specified by UX-DR7; announcements are not required. |
| Generation bumps after the picker resolves (EC) | false | rejected | Toggles during the picker act on the workspace still on screen. |
| `childIds` id missing from `items` (EC) | false | rejected | `toggle` always writes items and childIds together. |
| ArrowRight on expanded folder not `preventDefault`ed (EC) | low | rejected | Right-to-child belongs to Story 1.5. |
| Click during pending read has no feedback; retry-after-failure untested; smaller notes (BH, EC, VG) | low | rejected | Cosmetic or covered by the above; fixes add branches. |

## Design Notes

The Loading row is not a cached child: it is derived from `loadingIds` at render time, so a finished read just swaps it for real rows. The stale guard is a workspace generation counter captured before the await and compared after it. A throwing read is swallowed here because Story 1.6 adds the typed `unavailable` outcome that replaces it.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0
- `npm run lint` -- expected: exits 0
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome: open a folder, expand nested folders, collapse and re-expand, confirm no re-read (DevTools), Loading row on a large folder, Enter/Space/Right on folder rows, reduced-motion behavior.
