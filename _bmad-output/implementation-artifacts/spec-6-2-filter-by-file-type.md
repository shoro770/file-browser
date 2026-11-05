---
title: 'Filter the file tree by file type'
type: 'feature'
created: '2026-11-06'
status: 'in-review'
baseline_commit: '5fe895aea66fde51268e2b7b5c7fcc9efa600654'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** In a folder with many kinds of files there is no way to see only one kind, such as every `.html` or `.pdf`.

**Approach:** Add a "File type" dropdown to the toolbar, next to Hidden files. It lists "All files" plus the extensions found among the files loaded so far, one choice at a time. While one is chosen the tree shows only matching files, always keeps every folder, and ignores the filter during filename search. Story 6.2 only.

## Boundaries & Constraints

**Always:** Filtering is client-side and pure: new helpers in `src/lib/` (JSDoc `@param`/`@returns`, tests) and no extra reads of the disk. The extension is the lower-case text after the last dot (`splitName`); files with no extension or dotfiles like `.env` have none and show only under "All files". Folders are never hidden by the filter. Selection stays single-item; a selected file hidden by the filter stays selected and its preview stays. Keep `role="tree"`, `treeitem`, `group`, `aria-selected`, `aria-expanded`, `aria-level`, and make `aria-setsize`/`aria-posinset` count only the visible siblings. Exactly one `tabIndex={0}`; keyboard map unchanged. A native `<select>` with a visible label "File type". Choosing a value announces "Showing only .html files" or "Showing all files". A new folder resets the filter to "All files". `App.tsx` stays at or under 220 lines. Commit as `feat(tree): filter the tree by file type` with footer `Story: 6-2`.

**Never:** No change to search results or `useSearch`. No `fetch(`, `innerHTML`, inline `style` or icon library. No write access. Do not edit `scripts/check-readonly.mjs` or `src/architecture.test.ts`. No persistence of the choice. No multi-select, no category groups.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Choose type | Loaded `a.html`, `b.pdf`, folder `docs`; pick `html` | Tree shows `docs` and `a.html`; `b.pdf` hidden; set size counts 2 | N/A |
| Case | `A.HTML` and `b.html` | Both match `html`; option appears once | N/A |
| Folder with no match | Expanded `docs` holds only `.pdf` | Placeholder row "No matching files" | N/A |
| Empty folder | Expanded empty folder under a filter | Placeholder "Empty folder" (unchanged) | N/A |
| No extension | `Makefile`, `.env` | Hidden under any type; shown under "All files" | N/A |
| Options grow | Expanding a folder loads `.md` files | `md` appears in the list; current choice kept | N/A |
| Choice disappears | Chosen type no longer in loaded files after Refresh | Option stays so the select stays valid; tree shows no files of that type | N/A |
| Selected hidden | Selected `b.pdf`, pick `html` | Preview stays; focus and single tab stop repair to a visible row | N/A |
| With search | Search active while a type is chosen | Results unfiltered; type applies again when search is cleared | N/A |
| New folder | Open another folder | Filter back to "All files" | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/files.ts` -- has `splitName`; add `extensionOf`, `fileExtensions(items)` here.
- `src/lib/tree.ts` -- `filterDotfiles` (keep), `visibleRows`; add `filterSiblings(ids, items, showDotfiles, extension)` and an `extension` parameter on `visibleRows`.
- `src/components/Tree.tsx` -- calls `filterDotfiles` at the sibling lists and the "No visible files" placeholder; use `filterSiblings`, add the optional `fileType` prop (also used by `SearchPanel`'s Tree, which leaves it unset). Do not add logic beyond that.
- `src/App.tsx` -- 215 lines now (cap 220); holds `visibleRootIds`, toolbar, `handleOpen`, `announce`.
- `src/components/HiddenFilesToggle.tsx`, `ThemeSwitch.tsx` -- pattern for a toolbar control; new `FileTypeFilter.tsx` follows it.
- `src/types.ts` -- `TreeProps`, add `FileTypeFilterProps`.
- `src/App.css` -- `.button`, toolbar styles; style the select with a class.
- `src/App.search.test.tsx` -- fake File System helpers to reuse for an App-level filter test.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/files.ts`, `src/lib/tree.ts` + tests -- `extensionOf`, `fileExtensions`, `filterSiblings`, extended `visibleRows` -- pure, covers the matrix
- [x] `src/components/Tree.tsx`, `src/types.ts` -- use `filterSiblings`, optional `fileType`, "No matching files" placeholder -- the tree honors the filter
- [x] `src/components/FileTypeFilter.tsx`, `src/App.css` -- labelled select, announcement -- the control
- [x] `src/App.tsx` -- hold the choice, reset on open, pass to toolbar and `Tree`, stay at or under 220 lines
- [x] tests -- component test for the select (role, options, announcement) and an App-level test (filter, set size, single tab stop, reset on new folder, search unaffected)

**Acceptance Criteria:**
- Given a folder with `.html`, `.pdf` and subfolders, when I pick `html`, then only `.html` files and all folders show.
- Given a filter is on, when I inspect the tree, then `aria-setsize`/`aria-posinset` match the visible siblings and exactly one treeitem has `tabIndex={0}`.
- Given a filter is on and I type in search, then results are not filtered by type.

## Implementation Notes

- New pure helpers: `extensionOf`, `fileExtensions` (`src/lib/files.ts`), `filterSiblings` and the extra `extension` parameter of `visibleRows` (`src/lib/tree.ts`). `filterDotfiles` is unchanged and still used inside `filterSiblings`.
- `Tree.tsx` only swapped `filterDotfiles` for `filterSiblings`, added the optional `fileType` prop and the "No matching files" label. `SearchPanel`'s own Tree leaves it unset, so search is unfiltered.
- `FileTypeFilter.tsx` is a labelled native `<select>`; the chosen extension stays listed even if it vanishes from the loaded files.
- `App.tsx` is exactly 220 lines, at the cap. The next feature there must extract code first.
- In tests, a file row's name is split across two spans (stem and extension), so `getByText('c.pdf')` finds nothing; query the treeitem by role instead.
- Build, lint and 738 tests pass.

## Spec Change Log

## Review Triage Log

Reviewed inline by the build agent only (the owner chose no subagents), so the Blind, Edge Case and Verification Gap reviewers did not run.

| Finding | Verdict | Evidence |
|---|---|---|
| Matrix row "selected hidden" had no test | fixed (patch) | Added an App-level test: selection kept, one tab stop |
| `App.tsx` at the 220-line cap | low | Allowed by `architecture.test.ts`; noted so the next change extracts first |
| Filter state is a `useState` in `App.tsx`, not in a hook | low | Smallest change within the cap; revisit if the toolbar gets more controls |

## Design Notes

Per-sibling filtering mirrors `filterDotfiles`, so lazily loaded folders need no crawl: a folder's files are filtered when it is listed.

## Verification

**Commands:**
- `npm run build` -- expected: passes
- `npm run lint` -- expected: passes
- `npm test` -- expected: passes

**Manual checks (if no CLI):**
- In Chrome, open a mixed folder: the dropdown lists the extensions, filtering hides other files, keyboard arrows skip hidden rows (not run headlessly).
