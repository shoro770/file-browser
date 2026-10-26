---
title: 'Refresh the folder tree'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: 'b1d172768163c40687e9202872ec32d3bcf1972c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After files change on disk, the tree is stale: the store caches every listed folder until a new workspace is opened (AD-6), and there is no Refresh control.

**Approach:** Add a `refresh` intent to `services/tree` that re-lists the root and every expanded folder, reconciles by id with a pure `lib/` helper, and a toolbar Refresh button with busy state and announcements. Story 4.1 only: preview reload is 4.2, missing-selection and unreadable-root messages are 4.3.

## Boundaries & Constraints

**Always:** `services/tree` is the only writer; components reach it through `hooks/useTree`. Read only `name` and `kind` (no `getFile()`); never read collapsed or never-expanded folders. Ids come from `toId` only. Sort with `compareFileItems` (via `listChildren`). `showDotfiles` is unchanged. Inline-SVG glyph in `Glyph.tsx`. Never edit `scripts/check-readonly.mjs`, `src/architecture.test.ts` or other scanners. Commit (when later asked) as `feat(tree): refresh the folder tree` with footer `Story: 4-1`.

**Never:** No `useState` copy of tree data. No `disabled` on the button while busy (focus would drop). No `getFile()` for entries other than the Selection, and none at all in this story. No preview reload (4.2). No new status strings beyond "Refreshing...", "Refreshed." and the existing "Selection cleared". No growth of `Tree.tsx` logic; the existing tab-stop repair already covers vanished rows.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Added/removed | File added or removed in an expanded folder | Level replaced in `compareFileItems` order | N/A |
| Unchanged ids | Surviving ids | Same expansion; selected file stays selected | N/A |
| Gone folder | Expanded folder deleted or now a file | Its expansion, cache, unavailable mark and all descendants dropped; selection inside it cleared | N/A |
| Kind swap | Same id, file to folder or reverse | Treated as a different entry: old expansion and selection dropped | N/A |
| Expanded folder unreadable | `getDirectoryHandle` or `values()` throws | Folder marked unavailable, rest refreshed | Error swallowed |
| Root unreadable | Root listing throws | State untouched; outcome `failed` (message is 4.3) | Never throws |
| Re-entry | Refresh while one runs | Ignored, no extra reads | N/A |
| No folder | Nothing open | Button disabled; `refresh()` is a no-op | N/A |
| New workspace mid-refresh | `openWorkspace` completes first | Refresh result discarded (generation guard) | N/A |

</frozen-after-approval>

## Code Map

- `src/services/tree.ts` -- store; add `refresh()`, a module `refreshing` flag published as `snapshot.refreshing`, reuse `generation`, `handles`, `pending`, `publish`, `withMember`.
- `src/services/fs.ts` -- reuse `listChildren` and `openChildDirectory`; no change expected.
- `src/lib/tree.ts` / new `src/lib/reconcile.ts` -- pure reconcile helper (keep `parentId`, `toId`).
- `src/types.ts` -- add `refreshing` to `TreeSnapshot`, `RefreshOutcome`, `RefreshButtonProps`.
- `src/hooks/useTree.ts` -- expose `refresh`.
- `src/components/RefreshButton.tsx` (new), `src/components/Glyph.tsx` (Refresh glyph), `src/App.tsx` (button after `HiddenFilesToggle`, `announce`), `src/App.css` (disabled and busy styles using tokens).
- `src/components/Tree.tsx` -- no change; tab-stop repair lives here.
- `src/services/tree.test.ts`, `src/testHelpers.ts` -- fake-handle patterns to reuse.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/reconcile.ts` -- `reconcile(prev, fresh)`: given cached items, child ids, expanded, unavailable and selection plus freshly listed levels, return the new items and child ids and the pruned expanded, unavailable and selected values, dropping descendants of removed or kind-swapped ids; JSDoc `@param`/`@returns` -- pure, AD-7
- [x] `src/lib/reconcile.test.ts` -- added, removed, kind-swapped and unchanged ids, nested descendants, selection inside a removed folder
- [x] `src/types.ts` -- types above
- [x] `src/services/tree.ts` -- `refresh(): Promise<RefreshOutcome>`: no-op when no workspace or already refreshing; read root, then expanded folders level by level through re-opened handles; one `publish` at the end; replace `handles` for re-read folders; drop handles of pruned folders; discard on generation change; clear `refreshing` in `finally`
- [x] `src/services/tree.test.ts` -- read counts (collapsed folders untouched, no `getFile`), order, expansion and selection kept, kind swap, deleted folder, unreadable expanded folder, root failure leaves state, re-entry reads once, stale result after `openWorkspace`, dotfile flag unchanged, ids deterministic
- [x] `src/hooks/useTree.ts` -- return `refresh`
- [x] `src/components/Glyph.tsx`, `src/components/RefreshButton.tsx` -- button with constant label "Refresh", `aria-busy` while refreshing, `disabled` only when no folder
- [x] `src/components/RefreshButton.test.tsx` -- role `button` name "Refresh", disabled with no folder, `aria-busy="true"` and unchanged label while busy, click calls handler
- [x] `src/App.tsx` -- wire button; `handleRefresh` announces "Refreshing..." then "Refreshed."; `announce` clears the region then sets the text on the next animation frame; announces "Selection cleared" if the selection was removed; focus is left on the button
- [x] `src/App.refresh.test.tsx` -- with `services/fs` mocked: announcement order, focus stays on Refresh, a vanished tab-stop row leaves exactly one `tabindex=0` treeitem, no `getFile` on refresh, button state
- [x] `src/App.css` -- disabled: `text-muted`, keeps `border-strong`

**Acceptance Criteria:**
- Given no folder is open, when I view the toolbar, then Refresh is disabled and keeps its outline; once a folder opens it is enabled.
- Given expanded folders, when Refresh completes, then only the root and expanded levels were read, with `values()` only.
- Given the I/O matrix cases, when I run `npm test`, then each passes.
- Given Refresh is running, when activated again, then nothing extra is read and `aria-busy="true"` is set.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` shows only intended files.

## Implementation Notes

- Open-question defaults accepted by the orchestrator: interim "Selection cleared" announcement, skip in-flight folders, level-by-level reads with siblings in parallel. The Open Questions section was removed once they were accepted.
- When Refresh clears the selection it announces "Selection cleared" instead of "Refreshed." (one announcement; Story 4.3 replaces it with the FR21 sentence). A failed root read clears "Refreshing..." and says nothing else; the message is Story 4.3.
- Collapsed folders keep their cached level and handle (AD-7: not read). `src/App.refresh.test.tsx` stubs `adoptedStyleSheets` and `CSSStyleSheet` because jsdom lacks them. `say()` in `App.tsx` replaces direct `setStatus` calls so a pending `announce` frame can't overwrite a newer status.
- `reconcile` skips the subtree scans for removed files, so emptying a 1,000-file folder is one delete per file.
- Verified: `npm run build`, `npm run lint`, `npm test` (403 tests). NOT RUN in a browser: the 1,000-entry responsiveness check, keyboard activation of Refresh, and the disabled and busy styles in three themes (logged in `deferred-work.md`). jsdom with fake handles proves DOM shape only.

## Spec Change Log

## Review Triage Log

| Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|
| Failed refresh is silent, no App test (blind, gap) | low | patch (test only) | Message is Story 4.3; added an App test that the busy state ends and nothing false is announced. |
| `refreshing` stuck if anything throws, no `finally` (edge) | medium | patch | Added `try`/`finally` in `refresh()`. |
| Pending `announce` frame overwrites a newer status (edge) | low | patch | Added `say()` that cancels the frame. |
| No test for `pending` skip (gap) | medium | patch | Added a service test with a gated `toggle`. |
| Re-announce clear-then-set untested (blind) | low | patch | Added a test holding frames to see the cleared region. |
| `drop` is O(n·m) for many removals (blind) | low | patch | Files now skip the scans; added a 1,000-file test. |
| Selection inside a failed folder untested; unused `prev` in test helper (blind) | low | patch | Added the case; removed the helper field. |
| Stale handle of a collapsed, re-created folder (edge, blind) | maybe-false | defer | Needs a real folder; logged in `deferred-work.md`. |
| Selection under a collapsed folder never checked (edge) | maybe-false | defer | Expected to close in 4.2 and 4.3; logged. |
| Preview does not reload after Refresh (blind) | false | rejected | Story 4.2 by design; the spec says no preview reload. |
| No visible busy indicator; announcement wording; hung folder timeout; rAF in a hidden tab; descendants lost when a parent fails; orphan write by a late toggle; skipped leaves "Refreshing..." (blind, edge, gap) | low | rejected | Spec-given strings and AC; no reachable harm shown, and each fix adds branches. |

## Design Notes

`reconcile` keeps the store thin and testable: the store gathers fresh levels (impure), `reconcile` decides what survives (pure). Ids stay stable because only `toId` builds them, so kind-swap is detected by comparing `isDirectory` for the same id.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (type check; `npx tsc --noEmit` checks nothing)
- `npm run lint` -- expected: exits 0, includes the read-only gate
- `npm test` -- expected: all pass
- `git status` -- expected: only the files listed above

**Manual checks (if no CLI):**
- NOT RUN until done in Chrome or Edge: open a folder of about 1,000 entries, expand it, add and remove files from a terminal, press Refresh, and confirm it stays responsive (NFR2, NFR4) and keyboard Enter/Space on Refresh keeps focus on the button. jsdom proves DOM shape only.
