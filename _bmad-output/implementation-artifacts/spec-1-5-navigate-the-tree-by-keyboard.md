---
title: 'Navigate the tree by keyboard'
type: 'feature'
created: '2026-10-25'
status: 'done'
route: 'dispatch'
baseline_commit: '51aa69f578216ed0fdfde230dfc47d4e6b1a0eb7'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Only Enter, Space and Right-to-expand work from the keyboard. There is no way to move between rows, collapse, jump or type-ahead, and a collapse that hides the focused row drops the tab stop to the first row.

**Approach:** `Tree` alone owns the full keyboard map and roving tabindex over a flat list of visible rows (placeholder rows included), built by a pure `lib/tree` helper. Type-ahead matching and page-step maths are pure `lib/tree` helpers with unit tests.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components`; `lib/` pure with JSDoc `@param`/`@returns`. One `onKeyDown` on the `role="tree"` element, acting on the row that is the event target; `TreeNode` keeps click only; its Enter/Space handling moves to `Tree`. Exactly one `treeitem` (placeholders included) has `tabIndex=0`; priority: focused row, else nearest visible ancestor of the last focused row, else selected row, else first row. Keys: Up/Down (clamped, no wrap), Right (collapsed folder expands; expanded folder moves to first child, or its placeholder when empty or loading; file or placeholder nothing), Left (expanded folder collapses; otherwise move to parent; root-level row nothing), Enter/Space (file selects, folder toggles, placeholder nothing; `preventDefault`, ignore `event.repeat`), Home/End, PageUp/PageDown (move by `floor(clientHeight / 28)` rows, minimum 1, clamped), type-ahead. Handled keys call `preventDefault`; unhandled keys, and any key with Ctrl, Meta or Alt held, pass through. Tab is never handled. Type-ahead: printable single characters, case-insensitive prefix match on item names (placeholders never match), characters within 500 ms accumulate; search starts at the row after the focused one when the query is one character, else at the focused row, and wraps; no match leaves focus unchanged. Moving focus never selects. Role CSS variables only; no network, no new dependency, no inline `style`.

**Never:** Selection changes from navigation keys. The divider and tab order beyond the tree (Story 1.8). Dotfile, unavailable or refresh behavior. Changes to `services/`, `hooks/`, `App.tsx` focus-on-open, `AGENTS.md`, `src/lib/{files,format,pdf}.ts`. A DOM test environment (already deferred). An icon library.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Down at last row | Last visible row focused | Focus stays | N/A |
| Right on expanded empty folder | Folder shows "Empty folder" | Focus moves to the placeholder row | N/A |
| Left on collapsed child | Child of an expanded folder | Focus moves to the parent | N/A |
| Left at top level | Collapsed root-level row | Nothing | N/A |
| Space on a file | File row focused | File selected, page does not scroll | N/A |
| Type "re", then "p" within 500 ms | Query becomes "rep" | Focus jumps to next row starting "rep" | N/A |
| Type after 500 ms pause | Prior query stale | Query restarts with the new character | N/A |
| Type with no match | No row starts with the query | Focus unchanged | Silent no-op |
| Collapse with focus below | Focus on a descendant, parent collapsed by mouse | Tab stop falls to the visible ancestor | N/A |
| Home or End | Any row focused | First or last visible row | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/tree.ts` -- add pure `visibleRows(items, rootIds, childIds, expandedIds, loadingIds)` returning `VisibleRow[]` (`key`: item id or `placeholder:{folderId}`, `itemId | null`, `parentKey | null`, `isDirectory`, `expanded`, `name`), mirroring the placeholder rules in `Tree.renderRows`; `findTypeAhead(rows, fromIndex, query)` returning an index or `-1`; `pageStep(clientHeight, rowHeight)`. Reuse `parentId`.
- `src/lib/tree.test.ts` -- cover the three helpers.
- `src/types.ts` -- add `VisibleRow`; `TreeNodeProps.onFocusRow` stays; remove nothing else. Placeholders get a `rowKey` prop in `TreePlaceholderProps`, plus `tabIndex` and `onFocusRow`.
- `src/components/Tree.tsx` -- own `onKeyDown`, `focusedKey` state (was `focusedId`), type-ahead buffer ref, ancestor-aware tab stop, focus-by-key via `data-key`. Keep `focusToken` effect and `renderRows`.
- `src/components/TreeNode.tsx` -- drop `handleKeyDown`; add `data-key`; `TreePlaceholder` becomes a roving row (`data-key`, `tabIndex`, focus report, stays `aria-disabled`, never activates).
- `src/App.css` -- verify the focus ring covers placeholder rows (`.tree-item:focus-visible > .tree-row`); change only if not.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/tree.ts`, `src/lib/tree.test.ts`, `src/types.ts` -- `visibleRows`, `findTypeAhead`, `pageStep` and `VisibleRow` with tests for every matrix row they can decide -- UX-DR9
- [x] `src/components/TreeNode.tsx` -- remove per-row keyboard handling; roving placeholders -- AD-3
- [x] `src/components/Tree.tsx` -- full keyboard map, ancestor tab-stop repair, type-ahead -- FR8, UX-DR8, UX-DR9
- [x] `src/App.css` -- confirm placeholder focus ring; edit only if wrong -- UX-DR4

**Acceptance Criteria:**
- Given an open tree, then exactly one `treeitem` has `tabIndex=0` and Tab from outside lands on it.
- Given focus in the tree, when any navigation key is pressed, then `aria-selected` is unchanged and the tree remains a single Tab stop.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec and `sprint-status.yaml`.

## Implementation Notes

`Tree` owns one `onKeyDown` over `visibleRows`; `TreeNode` keeps click only. Placeholder rows are roving rows keyed `placeholderKey(folderId)` (prefix `/placeholder:`, which no normalized id can start with). Page size reads the scrolling `.shell__tree` parent, not the list. `App.css` already covered placeholder focus rings, so it was not edited. Review added a focus-restore effect for when the focused row unmounts (e.g. a "Loading..." placeholder replaced by children).

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Focus drops to body when the focused row unmounts, e.g. loading placeholder replaced by children (BH, EC) | medium | patch | Only tabIndex was repaired; fixed with an effect that refocuses the tab stop. |
| Placeholder key `placeholder:x` collides with a real id; prefix duplicated in lib and Tree (BH, EC, VG) | low | patch | Colons are legal in file names; `placeholderKey` with a `/`-prefixed key removes the collision and the duplicate constant. |
| `visibleRows` throws on an id missing from `items` (BH, EC) | low | rejected | The store only publishes ids it has loaded, and `renderRows` already dereferences the same way. |
| `survivingKey` untested; no keyboard component tests (BH, VG) | medium (unverified) | defer | No DOM test environment; recorded in `deferred-work.md`. |
| Repeated letter ("rr") does not cycle (BH, EC) | low | rejected | The spec defines 500 ms accumulation; a paused repeat does cycle. |
| Unmatched printable keys call `preventDefault`; Space mid-query selects; AltGr, IME and astral characters (BH, EC) | low | rejected | Spec says Space selects and the tree has no text default; the fixes add branches for rare input. |
| `ROW_HEIGHT` duplicates CSS; page size assumes the parent scrolls (BH, EC) | low | rejected | Verified `.shell__tree` is the direct scrolling parent in `App.tsx` and `App.css`. |
| Activation rule duplicated in `TreeNode.activate` and `Tree` (BH) | low | rejected | Click and key paths are two inputs to one tiny rule; no named divergence. |
| `focusToken` focuses the first row, not the tab stop (VG) | false | rejected | Spec and epic require focus on the first row after opening. |
| Right on an expanded folder with no rows yet does nothing (EC) | low | rejected | Only occurs in the first 150 ms before the placeholder exists; no-op is the correct reading. |
| `typeAhead.time` starts at 0 (EC) | false | rejected | An empty query plus a character gives the same result either way. |

## Design Notes

Navigation works on `visibleRows` indexes rather than DOM queries, so placeholders, Left-to-parent and Right-to-first-child are plain array lookups. Component behavior stays on manual checks until a DOM test environment exists (see `deferred-work.md`). Type-ahead's one-character case starts after the focused row so repeating a letter cycles through matches.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0
- `npm run lint` -- expected: exits 0
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome: Tab into the tree, then Up/Down, Right/Left on folders (including an empty one), Home/End, PageUp/PageDown, type-ahead, Space (no page scroll), and confirm selection never moves from navigation alone.
