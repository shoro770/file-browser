---
title: 'Hide and show dotfiles'
type: 'feature'
created: '2026-10-25'
status: 'done'
route: 'dispatch'
baseline_commit: '7653207c69d53dabbfce7c04d1013d1962852e72'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Dotfiles clutter the tree and nothing marks them as secondary, and the user cannot hide them or have that choice remembered.

**Approach:** The tree store holds a `showDotfiles` flag (default shown, restored from `services/prefs`). Dotfile rows dim at rest, and a toolbar "Hidden files" toggle filters them out of the already-cached children with no disk read.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components`; `lib/` pure with JSDoc `@param`/`@returns` and tests; role CSS variables only; no inline `style`; inline SVG only. A dotfile is an entry whose name begins with "."; descendants of a dotfile folder count as dotfiles, with no hardcoded names. Only `showDotfiles` is stored, in `localStorage` inside `try/catch`; storage failure falls back to shown with no error. Dimming is `opacity: 0.6` on the kind glyph and name label only, per element (never compounding), at rest only (full opacity on hover and when selected); never on the row background, chevron, Unavailable suffix or placeholder rows. Forced-colors resets opacity to 1. The toggle has the constant name "Hidden files", `aria-pressed="true"` meaning shown, an eye or eye-slash glyph plus a visible "Shown" / "Hidden" word (`aria-hidden`), `aria-describedby` text "Pressed: hidden files are shown.", and `row-selected` fill when pressed. It works with no folder open. Hiding never collapses a folder and never re-reads disk. `aria-setsize` and `aria-posinset` count visible siblings only. The tab stop is repaired on every toggle.

**Never:** Changes to `AGENTS.md`, theme tokens in `index.css`, `src/lib/{files,format,pdf}.ts`, or the keyboard map. Persisting a folder name, path or file content. A modal, popover or shadow. An icon library. A DOM test environment (deferred).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default | No stored value | Dotfiles shown and dimmed | N/A |
| Hide, non-dotfile selected | Selection `src/a.ts` | Dotfiles vanish, nothing collapses, selection kept | N/A |
| Hide, dotfile selected | Selection `.env` or `.git/config` | Selection clears; prompt returns; status "Selection cleared" | N/A |
| Hide, root only dotfiles | All root entries start with "." | Pane "Nothing to show." / "Hidden files are turned off."; no Tree | N/A |
| Hide, subfolder only dotfiles | Expanded folder, all children dotfiles | Child row "No visible files" (a truly empty folder still reads "Empty folder") | N/A |
| Hide with a hidden row focused | Focus on a removed row | Focus moves to the nearest visible previous row, else its parent | N/A |
| Hide with focus on the button | Toolbar button focused | Focus stays; roving tab stop repaired | N/A |
| Reload | Stored `true` or `false` | Restored; `readShowDotfiles` accepts only those two strings | Storage throws: default shown |
| Open a new folder | `openWorkspace` | Flag unchanged | N/A |

</frozen-after-approval>

## Code Map

- `src/types.ts` -- `TreeSnapshot.showDotfiles`; `TreeProps.showDotfiles`; `TreeNodeProps.dotfile`; new `HiddenFilesToggleProps` (`shown`, `onToggle`).
- `src/lib/tree.ts` -- add `isDotfileId(id)` (any `/` segment starts with ".") and `filterDotfiles(ids, items, showDotfiles)`; `visibleRows` gains a `showDotfiles` argument, filters children, and adds a placeholder when a non-empty list filters to nothing. Reuse the existing placeholder pattern. Update JSDoc.
- `src/lib/tree.test.ts` -- cover both helpers and the filtered, all-hidden and empty `visibleRows` cases.
- `src/services/prefs.ts` -- add `readShowDotfiles(): boolean` and `writeShowDotfiles(show)`, in `try/catch`, key `showDotfiles`. Mirror `readTheme`.
- `src/services/tree.ts` -- `EMPTY` reads the pref; `openWorkspace` keeps `snapshot.showDotfiles`; new `setShowDotfiles(show)`: no-op if unchanged, persists, and clears `selectedId` when hiding a dotfile selection. Never touches handles or `childIds`.
- `src/services/tree.test.ts` -- selection kept or cleared, no handle call, persistence, `openWorkspace` keeps the flag (reuse `fakeFolder`).
- `src/hooks/useTree.ts` -- expose `setShowDotfiles`.
- `src/components/Glyph.tsx` -- add `Eye` and `EyeSlash` inline SVGs (aria-hidden).
- `src/components/HiddenFilesToggle.tsx` -- new toggle button and its hidden description.
- `src/components/Tree.tsx` -- filter ids once per level (setsize/posinset and `renderRows`), "No visible files" placeholder, pass `dotfile`. In `survivingKey`, try the nearest still-visible previous row from a ref of the last rendered keys before the ancestor walk.
- `src/components/TreeNode.tsx` -- add `tree-row--dotfile` class when `dotfile`.
- `src/App.tsx` -- render the toggle; announce "Selection cleared"; show the "Nothing to show." pane; render `Tree` only with visible root ids.
- `src/App.css` -- dimming rules (glyph and label, not hover/selected), toggle pressed fill, `@media (forced-colors: active)` reset.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts`, `src/lib/tree.ts`, `src/lib/tree.test.ts` -- dotfile helpers and filtered `visibleRows` with tests -- FR9, UX-DR5, UX-DR7
- [x] `src/services/{prefs,tree}.ts`, `src/services/tree.test.ts`, `src/hooks/useTree.ts` -- stored flag and `setShowDotfiles` with tests -- FR9, NFR7, AD-6, AD-14
- [x] `src/components/{Glyph,HiddenFilesToggle,Tree,TreeNode}.tsx`, `src/App.tsx`, `src/App.css` -- toggle, dimming, placeholders, focus repair, announcement -- UX-DR19, UX-DR20, UX-DR22, UX-DR27

**Acceptance Criteria:**
- Given a folder with dotfiles and no stored value, then they show dimmed, and hovered or selected dotfile rows are at full opacity.
- Given the toggle, then it has the name, pressed state, description and "Shown"/"Hidden" word above, and works with no folder open.
- Given each matrix row, then the behavior matches; unit tests cover every row `lib/` and `services/` can decide.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec and `sprint-status.yaml`.

## Implementation Notes

Implemented directly (no subagent). `Tree` remembers the row order in state while the focused row is visible; the lookup of the nearest earlier visible row is the pure `previousVisibleKey` in `lib/tree.ts` (state, not a ref, because the lint rule forbids reading a ref in render). `visibleRows` takes `showDotfiles` as its seventh argument. Build, lint and 83 tests pass; the manual browser check was not run.

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Focus fallback to the nearest earlier visible row is untested (VG) | medium | patch | Logic extracted to `previousVisibleKey` with unit tests. |
| Placeholder label, "Selection cleared" and "Nothing to show." panes untested (VG) | medium (unverified) | defer | No DOM test environment; recorded in `deferred-work.md`. |
| Blank line before `handleKeyDown` removed (BH, VG) | low | patch | Restored. |
| Selection-clear rule duplicated in `App` and the store (BH) | low | rejected | Both use `isDotfileId`; no divergence named and the fix changes the store API. |
| `filterDotfiles` and `isDotfileId` differ (BH) | low | rejected | Documented: a hidden folder removes its subtree. |
| 0.6 opacity may fail contrast (BH) | false | rejected | UX review-log: dimming at rest passes AA in all themes; hover and selected reset to 1. |
| Per-render cost of `lastKeys` and filtering (BH) | low | rejected | Linear in visible rows; `filterDotfiles` returns the same list when shown. |
| Toggle name vs pressed meaning, static description (BH) | false | rejected | Prescribed by UX-DR20. |
| Pref read at module load; no cross-tab sync (BH, EC) | low | rejected | Spec requires restore on reload only. |
| Duplicated `Eye`/`EyeSlash` SVG markup (BH) | low | rejected | Same pattern as `Chevron`, `Spinner` and `Warning`. |
| Unnamespaced `showDotfiles` key; no build evidence (BH) | false | rejected | Key fixed by the story; build and lint pass. |
| No focus handoff when every root entry is hidden on open (EC) | low | rejected | The Open folder button was just activated and keeps focus; fix adds a store round trip. |
| `select()` accepts a hidden dotfile id (EC) | false | rejected | Hidden rows are not rendered, so no caller can reach it. |
| Stale `lastKeys` while the focused row stays hidden (EC) | false | rejected | Frozen on purpose so the tab stop stays stable until the row returns. |
| Duplicate `id` if two toggles render (EC) | low | rejected | One toggle per app; same call as the Story 1.6 description id. |
| Spec says ref, code uses state (EC) | low | rejected | Lint forbids ref reads in render; behavior is identical. |
| Dangling `else if` after a braced branch (VG) | low | rejected | Cosmetic. |

## Design Notes

The flag lives in the store so hiding clears a dotfile selection in the same publish. Filtering by the child's own name is enough, because a hidden folder removes its subtree; `isDotfileId` is only for selection and dimming, where descendants of a dotfile folder count too. Component behavior (focus move, placeholders, announcement) has no automated test until a DOM environment exists.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0
- `npm run lint` -- expected: exits 0
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome with a folder holding `.env`, `.git/` and normal files: toggle off and on, select `.env` then hide, hide with a dotfile row focused, reload to confirm persistence, and check an all-dotfile root and subfolder.
