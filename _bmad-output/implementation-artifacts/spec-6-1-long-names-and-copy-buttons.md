---
title: 'Keep file extensions visible in the tree and add copy buttons'
type: 'feature'
created: '2026-11-06'
status: 'in-review'
baseline_commit: 'a58a8913bc981e031b42f14cb2df4ae6d441a11c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A very long file name is cut at its end in the tree (`.tree-row__label` ellipsis), so the extension is lost and similar names look identical. The preview has no quick way to copy a file's name, path or content.

**Approach:** Truncate only the middle of a name so the extension always shows (full name stays in the tooltip). Add three small icon buttons to the sticky preview header: copy name, copy path, copy all content (text-like files only). Story 6.1 only; the file-type filter is 6.2.

## Boundaries & Constraints

**Always:** Inline-SVG icons in `Glyph.tsx` (no icon library). Clipboard access only in `src/services/` (impure); name splitting and path building are pure helpers in `src/lib/` with JSDoc `@param`/`@returns` and tests. Name stays one text run for search highlights (`ranges`) and screen readers. Buttons are real `<button type="button">` with `aria-label`, keyboard reachable, and announce "Copied name", "Copied path" or "Couldn't copy" through the existing `onAnnounce`. Full path = `rootName + '/' + toPath(id)`. Copy content reads `source.file.text()` in full, for the `text` and `markdown` kinds only, up to 10 MB; above that the button is disabled with a title saying so. Commit as `feat(tree): keep file extensions visible and add copy buttons` with footer `Story: 6-1`.

**Never:** No `fetch(`, `innerHTML`, `dangerouslySetInnerHTML` or inline `style`. Do not touch `scripts/check-readonly.mjs`, `src/architecture.test.ts` or other scanners. No change to roving tabindex, `role`/`aria-*` on tree items, or the preview header's `h2` name. No buttons on tree rows. No write access to files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Long name | `very-long-...-report.final.pdf` wider than the row | Stem truncated with `…`, `.pdf` visible; tooltip shows full name | N/A |
| Short name | Fits the row | Looks and reads exactly as today | N/A |
| No extension / dotfile | `Makefile`, `.env` | Whole name is the stem; `.env` is not split into empty stem | N/A |
| Search match | Highlight range spans the stem/extension boundary | `<mark>` still wraps the matched text on both sides | N/A |
| Copy name/path | File selected | Clipboard gets the name / `rootName/sub/file.txt`; status announced | Clipboard rejects: announce "Couldn't copy" |
| Copy content | Text file ≤ 10 MB (even if preview truncated at 1 MB) | Clipboard gets the entire file text | Read or clipboard fails: announce "Couldn't copy" |
| Not text-like | Image, PDF, Word, binary | Name and path buttons shown; no content button | N/A |
| Too large | Text file > 10 MB | Content button disabled, title explains | N/A |

</frozen-after-approval>

## Code Map

- `src/components/TreeNode.tsx` -- `highlighted()` renders the label; split it into stem and extension spans.
- `src/App.css` -- `.tree-row__label` (ellipsis, nowrap), `.preview-header*`; add stem/extension and button styles via classes.
- `src/components/PreviewHeader.tsx` -- gets the three buttons; `meta` has the name, `PreviewSource.file` has the `File`.
- `src/components/PreviewPane.tsx` -- renders `PreviewHeader`; needs `selectedId`, `rootName` and `onAnnounce` passed in from `src/App.tsx`.
- `src/components/Glyph.tsx` -- add copy icons here.
- `src/lib/tree.ts` -- `toPath(id)`, reuse; `src/lib/files.ts` -- extension helpers live here, reuse if one fits.
- `src/services/` -- new `clipboard.ts` (the only `navigator.clipboard` caller).
- `src/types.ts` -- add/extend props types (`PreviewHeaderProps`, `TreeNodeProps` if needed).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/files.ts` (or `tree.ts`) -- add `splitName(name)` and `fullPath(rootName, id)` pure helpers + tests -- keeps components free of logic
- [x] `src/services/clipboard.ts` -- `copyText(text): Promise<boolean>`, never throws + test -- single clipboard chokepoint
- [x] `src/components/TreeNode.tsx`, `src/App.css` -- stem/extension spans; stem shrinks with ellipsis, extension `flex: none` -- extension stays visible
- [x] `src/components/Glyph.tsx`, `PreviewHeader.tsx`, `PreviewPane.tsx`, `src/App.tsx`, `src/types.ts` -- three icon buttons wired with announcements -- copy actions
- [ ] component tests for header buttons and the tree label (extension visible, text unchanged) -- regression cover

**Acceptance Criteria:**
- Given a name longer than the row, when the tree renders, then the extension is visible and the tooltip shows the full name.
- Given a selected text file larger than 1 MB, when I press copy content, then the clipboard holds the whole file.
- Given the tree, when I check roles and tabindex, then they are unchanged and exactly one item has `tabIndex={0}`.

## Implementation Notes

- Components may not import `services/` (architecture test), so the clipboard is reached through new `src/hooks/useCopy.ts`; `PreviewHeader` uses the hook.
- Copy announcements clear the status region first (`onAnnounce('')`, then the text in the next frame) so copying twice in a row is read twice.
- A match that spans the stem/extension boundary now renders two adjacent `<mark>`s. `src/App.search.test.tsx` was changed to join all marks (`a.txt`) instead of reading the first one; the highlighted text is the same.
- `MAX_COPY_BYTES` (10 MB) lives in `src/lib/text.ts`. Directories are never split into stem/extension.
- Initial JS is 81.7 KB gzipped (budget 150 KB). Build, lint and 720 tests pass.

## Spec Change Log

## Review Triage Log

Reviewed inline by the build agent only (the owner chose no subagents), so the Blind, Edge Case and Verification Gap reviewers did not run.

| Finding | Verdict | Evidence |
|---|---|---|
| Header imported `services/clipboard` | fixed (patch) | `layer-and-markup-policy.md` forbids it; moved behind `useCopy` |
| Identical copy announcement not re-read | fixed (patch) | `App.tsx` passes raw `setStatus`; hook now clears first |
| Graph flags `highlighted` as untested | false | Function was replaced by `marked`/`nameParts`; covered in `TreeNode.test.tsx` |
| Graph flags `TreePlaceholder` as untested | low | Unchanged by this story; pre-existing gap |

## Verification

**Commands:**
- `npm run build` -- expected: passes
- `npm run lint` -- expected: passes (includes read-only grep gate)
- `npm test` -- expected: passes

**Manual checks (if no CLI):**
- In Chrome, open a folder with a very long name and with a >1 MB text file: extension visible, buttons copy the right text (not run headlessly).
