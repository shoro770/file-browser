---
title: 'Open a folder and see its top level'
type: 'feature'
created: '2026-10-25'
status: 'done'
baseline_commit: 'ee1693d2abd2d0e42a0c910d871b17fe7df94bfb'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The shell has no way to open a folder. The old picker flow was removed in Story 1.1, `FileItem` still carries `url`/`children`/random ids, and there is no tree, store or test runner.

**Approach:** Add a read-only `services/fs` boundary, a `services/tree` store behind `hooks/useTree`, and `Tree`/`TreeNode` components. Choosing a folder lists only its top level, shows it sorted in the tree, names it in the toolbar and title, and announces it. Add Vitest for the pure id and ordering logic.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components`; components never import `services/`. `services/fs` alone references `FileSystem*Handle` and calls only `showDirectoryPicker({ mode: 'read' })` and `values()`; the root is listed in one pass reading `name` and `kind`, with no `getFile()`. `FileItem` is pure data: `id` (normalized relative path, `/`-separated, no leading or trailing slash, root `''`), `name`, `path` (`/` + id), `isDirectory`, optional `size`, `updatedAt`, `category`; no `url`/`children`. Order with `compareFileItems`. Exactly one `treeitem` has `tabIndex=0`; `Tree` owns roving tabindex. Tree rows use `role="treeitem"` with `aria-level`, `aria-setsize`, `aria-posinset`; files get `aria-selected`. Inline-SVG glyphs only (seven: folder, generic file, image, document, pdf, text, binary; `aria-hidden`, `currentColor`, 16px). Role CSS variables only, no inline `style`, no network, no new runtime dependency. `lib/` functions pure with JSDoc `@param`/`@returns`.

**Never:** Write, rename or delete anything; request `readwrite`. Expand/collapse, selection, keyboard map beyond roving tabindex, dotfile hiding or dimming (all shown, undimmed), unavailable marks, Loading/Empty-folder rows, divider, theme control, Refresh. Persisting folder or handles. An icon library. Edits to `AGENTS.md`, `lib/format.ts`, `lib/pdf.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No folder | Supported browser, nothing opened | Toolbar: Open folder button and empty name area. Preview pane: prompt only. Tree pane empty. | N/A |
| Open | Picker returns folder `proj` | One `values()` pass; sorted top-level rows; name in toolbar; title `proj - file-browser`; status "Opened proj"; focus on first row, nothing selected | N/A |
| Empty folder | Folder has no entries | Pane reads "This folder is empty." / "There are no files here to show."; focus on Open folder | N/A |
| Replace | A folder is open, user picks another | Old tree, expansion and selection discarded | N/A |
| Cancel | Picker rejects `AbortError` | State unchanged, no message, focus to Open folder | Swallowed |
| Denied | Picker rejects `NotAllowedError`/`SecurityError` | State kept; "Access to that folder wasn't granted. Choose a folder to try again." inline under the toolbar and in `role="alert"`; cleared on next action; focus to Open folder | Typed outcome, never raw error text |
| Ordering | `b.txt`, `Zeta/`, `a10`, `a2`, `alpha/` | `alpha/`, `Zeta/`, then `a2`, `a10`, `b.txt` | N/A |

</frozen-after-approval>

## Code Map

- `src/types.ts` -- `FileItem` (drop `url`/`children`, make `size`/`updatedAt`/`category` optional); remove `FileRowProps`, `PdfPreviewProps`; add `TreeProps`, `TreeNodeProps`, tree snapshot and open-outcome types.
- `src/lib/files.ts` -- reuse `compareFileItems`, `categorizeFile` unchanged; add no logic here.
- `src/lib/tree.ts` (new) -- pure `toId(parentId, name)`, `toPath(id)`, `glyphForName(name, isDirectory)` per EXPERIENCE.md kind-glyph rule.
- `src/services/directory.ts` -- replace with `src/services/fs.ts` (new): `isFolderPickerSupported`, `pickDirectory`, `listChildren`; delete `directory.ts`, `revokeItemUrls` and eager PDF URLs.
- `src/services/tree.ts` (new) -- store with `subscribe`, `getSnapshot` (immutable), `openWorkspace`; holds handle, items by id, root ids, selection `null`.
- `src/hooks/useTree.ts` (new) -- `useSyncExternalStore` over the store; exposes snapshot and `openWorkspace`.
- `src/components/Tree.tsx`, `TreeNode.tsx`, `Glyph.tsx` (new) -- `role="tree"` named "File tree"; rows; the seven SVGs. Delete `FileRow.tsx` and `PdfPreview.tsx` (needs `url`; orphaned).
- `src/components/OpenFolderPrompt.tsx` (new) -- prompt copy and primary button.
- `src/App.tsx`, `src/App.css`, `src/main.tsx` -- toolbar, panes, live region, alert, document title; `main.tsx` imports support check from `services/fs`.
- `package.json`, `scripts/check-readonly.mjs` (new) -- `test` script, Vitest devDependency; `lint` becomes `oxlint && node scripts/check-readonly.mjs`, failing on `createWritable|removeEntry|\.move\(|readwrite|FileSystemWritableFileStream` under `src/`, and on `FileSystem(Directory|File)?Handle` outside `src/services/fs.ts`.
- `src/lib/files.test.ts`, `src/lib/tree.test.ts` (new) -- ordering and id tests.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts` -- reshape `FileItem`, remove obsolete props types, add tree types -- AD-4
- [x] `src/lib/tree.ts`, `src/lib/files.test.ts`, `src/lib/tree.test.ts`, `package.json` -- pure id/glyph helpers, Vitest, matrix ordering and id cases (repeat reads give identical ids) -- AD-2, AD-4
- [x] `src/services/fs.ts`, delete `src/services/directory.ts` -- read-only picker and one-pass `values()` listing; cancel and denial as typed outcomes -- AD-13
- [x] `src/services/tree.ts`, `src/hooks/useTree.ts` -- store and hook; opening replaces all state -- AD-1, AD-5
- [x] `src/components/*` -- `Tree`, `TreeNode`, `Glyph`, `OpenFolderPrompt`; delete `FileRow`, `PdfPreview` -- AD-3
- [x] `src/App.tsx`, `src/App.css`, `src/main.tsx` -- toolbar, status/alert regions, focus handling, title -- UX-DR3, 22–24
- [x] `scripts/check-readonly.mjs`, `package.json` -- grep gate wired into `lint` -- AD-13

**Acceptance Criteria:**
- Given no folder, when the app loads, then no sample file appears and `MOCK_FILES` is gone.
- Given a folder of about 1,000 entries, when it is chosen, then rows appear in under 300 ms.
- Given a forbidden identifier is added to `src/`, when `npm run lint` runs, then it fails.
- Given the tree, then exactly one row has `tabIndex=0`, Tab leaves the tree in one stop, and the live region persists across renders.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec, `epic-1-context.md` and `sprint-status.yaml`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Folder rows lack `aria-expanded` (BH, EC) | medium | patch | AGENTS.md requires it; `TreeNode.tsx` now sets `aria-expanded={false}` on folders. |
| Empty `role="tree"` with no tab stop (BH, EC) | low | patch | `Tree` is now rendered only when there are rows (`App.tsx`). |
| Repeat open of same folder not announced; stale status after cancel (BH, EC) | low | patch | `handleOpen` clears status before the picker opens. |
| No test that the read-only gate fails on a violation (VG) | medium | patch | Added `scripts/check-readonly.test.ts` running the gate against temp fixtures. |
| No component tests for tabindex, focus, alert, live region (VG, BH) | medium (unverified) | defer | Needs a DOM test environment (new devDependency); recorded in `deferred-work.md`. |
| Concurrent/overlapping opens finish out of order (BH, EC) | low | rejected | The picker is modal and a ~1,000-entry listing takes under 300 ms; a guard adds state for an unlikely case. |
| Any listing or picker failure reported as "denied" (BH, EC, VG) | false | rejected | Frozen matrix says anything else becomes the denied message, never raw text. |
| Empty handle name (drive root) gives blank title (EC) | low | rejected | Rare; fix adds a fallback branch. |
| `.env` prefix matches `.environment` (BH, EC) | false | rejected | EXPERIENCE.md/epics define the text rule as any `.env*` name. |
| Gate is line-based, misses `create: true`, cwd-sensitive (BH, EC) | low | rejected | The identifier list is fixed by AD-13; `npm run lint` always runs from the repo root. |
| `lib/pdf.ts`, `format.ts` orphaned (BH, EC) | false | rejected | Frozen Never forbids editing them; later stories reuse them. |
| `FileRow` removal drops activation (EC) | false | rejected | Selection and keyboard are Stories 1.4 and 1.5; frozen Never excludes them. |
| Every row re-renders on focus change; `title` doubles name; toolbar roles; engines field (BH) | low | rejected | No measured harm at current scale. |
| `handleName`/`WorkspaceHandle` exported from `fs.ts`; `package-lock.json` not named in spec (EC, BH) | low | rejected | Neither references a handle type outside `fs.ts`; the lockfile changes only because Vitest was added. |

## Design Notes

Dotfiles are listed and undimmed here because the toggle and 60% dimming are Story 1.7. The store holds only the root level now, but its shape (items by id, ids per parent) is what Story 1.3 extends, so keep ids as the only keys. The denied and cancel branches are told apart by `DOMException.name`; anything else becomes the denied message, never raw text.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0
- `npm run lint` -- expected: exits 0, gate passes
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome: open a folder, confirm order, toolbar name, title, focus on first row, cancel and empty-folder paths, and no network requests.
