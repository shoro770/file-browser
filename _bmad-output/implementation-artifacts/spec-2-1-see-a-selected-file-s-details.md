---
title: "See a selected file's details"
type: 'feature'
created: '2026-10-25'
status: 'in-review'
route: 'dispatch'
baseline_commit: '3cbf3ac0e249f7bc547ac357d65d033ef093d42f'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Selecting a file changes nothing in the preview pane, so the user cannot tell what the file is, how big it is or when it changed, and two separate kind mappings (tree glyph, future card glyph) could disagree.

**Approach:** One pure `resolvePreviewKind` drives the tree glyph, the card glyph and the dispatcher. A selection-scoped `previewSession` reads `getFile()` for the Selection only. `PreviewPane` shows a Preview Header and, for every kind in this story, the Metadata Card. Text, markdown, pdf, docx and image renderers land in later stories.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components` (AD-1); components never import `services/`; `lib/` pure with JSDoc `@param`/`@returns` and Vitest tests; props typed in `src/types.ts`; inline SVG only; role CSS variables only, no inline `style` attributes (AD-12); no `fetch()`. `size`, `updatedAt` and type are read via `getFile()` for the Selection only (AD-6). Only `previewSession` would create object URLs (AD-10); this story creates none. Renderers get a `PreviewSource` (`{ file, signal }` plus metadata), never a handle. Latest selection wins: a stale result is discarded and the previous session is aborted first. Tree node ids stay path-derived (`deterministic-tree-ids`). Selection stays single-item.

Pane states: no folder → open-folder prompt only; folder open, no selection → prompt "Select a file to preview it." / "Folders open in the tree on the left."; both with a static label and not a tab stop. File selected → `role="region"`, `aria-labelledby` the header `h2`, `tabindex="0"`. Tab order toolbar, Tree, divider, Preview Pane.

Header (only while a file is selected): kind glyph, name as `h2` truncating with ellipsis, "Modified {when}" in `<time datetime>`, caption `text-muted`. Stamp: "Today at 11:04 AM", "Yesterday at 4:30 PM", "Oct 21, 2026 at 3:12 PM" (local time, 12-hour, en-US).

Metadata Card: centered, 420px, `surface-raised`, `border-strong` outline, `rounded.lg`; 48px kind glyph, `h2` name, definition list Size / Type / Last modified (labels caption `text-muted`, values monospace). Size uses `formatSize`. Type strings come from `EXPERIENCE.md` Content rules (known map, else "{EXT} file", extensionless → "File"). Explanations: "No preview is available for this type of file." (executables, archives, unknown, and every kind without a renderer yet); "This file is empty."; "Legacy .doc files can't be previewed. Only .docx is supported."

Loading: previous content stays until the new one is ready; "Loading preview..." after 150 ms. Status region: "Previewing {name}" on activation (already in `App.handleSelect`), "{name}: no preview available" once a card outcome is shown, never on arrow-key moves.

`resolvePreviewKind(name, mime)` uses extension, the exact case-sensitive text-name list (and any `.env*` name) and device-reported `File.type`; no content sniffing. `.doc`, zero-byte, unknown and extensionless-not-on-list → `metadata`. `isPdf` is expressed through it. The tree glyph and card glyph derive from it and the `EXPERIENCE.md` extension map, not a second mapping.

**Never:** Changes to `AGENTS.md`, `scripts/check-readonly.mjs`, `index.css` tokens, `lib/{format,layout}.ts`, the Tree keyboard map or roving tabindex. `getFile()` on non-selected entries. Handles or object URLs on `FileItem`/`PreviewSource`. Content sniffing. Raw error text in the UI. An icon library. Writing the user's files. Committing in this planning pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No folder | `rootName` null | Open-folder prompt only | N/A |
| Folder, no selection | `selectedId` null | Select-a-file prompt; region labelled, no tab stop | N/A |
| Kind: extension | `a.PDF`, `b.docx`, `c.md`, `d.png`, `e.txt` | `pdf`, `docx`, `markdown`, `image`, `text` | N/A |
| Kind: names | `Makefile`, `makefile`, `.env.local`, `README` | `text`, `metadata` (case-sensitive), `text`, `text` | N/A |
| Kind: MIME fallback | `data.xyz` with `text/plain`; `pic` with `image/png`; `x` with `application/pdf` | `text`, `image`, `pdf` | N/A |
| Kind: overrides | `old.doc`; any name with size 0 | `metadata` | N/A |
| Kind: unknown | `a.exe`, `blob.xyz` (no MIME), `LICENSEX` | `metadata` | N/A |
| Stamp | now 11:04 today; 4:30 PM yesterday; Oct 21 2026 | "Today at 11:04 AM"; "Yesterday at 4:30 PM"; "Oct 21, 2026 at 3:12 PM" | N/A |
| Stamp: midnight | 12:00 AM today; 11:59 PM yesterday | "Today at 12:00 AM"; "Yesterday at 11:59 PM" | N/A |
| Zero-byte file | size 0 | Card: "This file is empty.", Size "0 bytes", Last modified equals header stamp | N/A |
| Legacy `.doc` | `old.doc` | Card with the `.doc` explanation | N/A |
| Fast reselect | A then B before A's read ends | A's session aborted; only B shown | Late A result discarded |
| Slow read | read over 150 ms | Previous content stays; then "Loading preview..." | N/A |
| `getFile()` throws | file removed or unreadable | Card with render-failure text "This file couldn't be previewed. It may be damaged or in an unexpected format." | Typed outcome, never thrown into the UI |
| Selection hidden | dotfile selected, dotfiles hidden | Selection clears; prompt returns | N/A |

</frozen-after-approval>

## Open Questions

Non-interactive run: each default below is applied in the tasks. A human can overturn it before implementation.

- Zero-byte detection needs a size but the story fixes the signature as `resolvePreviewKind(name, mime)` — options: optional third argument `size?: number` (default; tree glyph calls it without size, so it never reads the disk) / a separate `isEmptyFile` check in the pane (keeps the signature exact but splits the rule, which AD-8 wants in one place).
- SVG: `svg` is in the `image` extension list in `files.ts` — options: resolve to `image` (default; Story 2.3 renders it only as `<img src="blob:...">`, never inline, per AD-11) / resolve to `metadata` (safest, but a visible regression from the tree's image glyph).
- Stamp "now" and time zone — options: inject `now: Date` and format in the viewer's local zone (default, keeps the function pure and testable) / UTC (stable tests, wrong for the user).
- The 150 ms "Loading preview..." and the "no preview available" announcement are both implemented now although every kind is a card — options: build both now (default; later stories add slow renderers without rework) / defer the loading text to Story 2.2.
- The spec is above the 1600-token guide — options: keep as one story (default; single user goal, cross-layer) / split the resolver and glyph unification into its own story.

## Code Map

- `src/lib/files.ts` -- `categorizeFile` extension lists; reuse the image list, do not duplicate.
- `src/lib/tree.ts` -- holds `TEXT_EXTENSIONS`, `DOCUMENT_EXTENSIONS`, `BINARY_EXTENSIONS`, `TEXT_NAMES`, `glyphForName`; move the name and extension tables into `lib/preview.ts` and make `glyphForName` derive from `resolvePreviewKind` plus the binary-extension map. Keep its signature, `tree.test.ts` must still pass.
- `src/lib/pdf.ts` -- `isPdf(item)`; reimplement through `resolvePreviewKind`. `countPdfPages` is dead per AD-3; leave it unless a test references it.
- `src/lib/format.ts` -- `formatSize` reused as is.
- `src/services/fs.ts` -- the only handle module; add `getFileFor(parent, name)`-style read helpers here (`getFileHandle`, `getFile`) only.
- `src/services/tree.ts` -- owns handles and `selectedId` (`select` at ~line 109); add a read intent that resolves a selected id to a `File` through `fs`, without exposing handles. Do not change expansion, dotfile or unavailable logic.
- `src/hooks/useTree.ts` -- model for the new `usePreview` hook (`useSyncExternalStore`).
- `src/components/Glyph.tsx` -- `GlyphKind` shapes; the card needs a 48px variant via a CSS class, not new SVGs.
- `src/App.tsx` -- `<main className="shell__preview">` branches (open prompt, empty, nothing to show, select prompt); replace the select-prompt branch with `PreviewPane`; keep `handleSelect` announcement.
- `src/App.css` -- `.shell__preview`, `.prompt*` styles exist; add header, card and region styles with tokens.
- `src/types.ts` -- add `PreviewKind`, `PreviewSource`, `PreviewMeta`, `PreviewState`, prop types.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- add the component-test entry the rules require.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts` -- export `PreviewKind` (`text|markdown|pdf|docx|image|metadata`), `PreviewSource` (`{ file, signal, meta }`), `PreviewMeta` (`name`, `size`, `updatedAt`, `kind`, `typeLabel`), `PreviewState`, `PreviewPaneProps`, `PreviewHeaderProps`, `MetadataCardProps` -- AD-8, AD-9
- [x] `src/lib/preview.ts`, `src/lib/preview.test.ts` -- `resolvePreviewKind(name, mime, size?)`, `typeLabel(name, mime)`, `cardExplanation(kind, name, size)`; tests for each kind, the name list (case, `.env*`), MIME fallbacks, zero-byte, `.doc`, unknown -- AD-8, FR17
- [x] `src/lib/datetime.ts`, `src/lib/datetime.test.ts` -- `formatModified(updatedAt, now)` and `toIsoDateTime`; tests for today, yesterday, older, midnight boundaries -- FR11
- [x] `src/lib/tree.ts`, `src/lib/pdf.ts` -- derive `glyphForName` and `isPdf` from the resolver; existing tests stay green -- AD-8, UX-DR18
- [x] `src/services/fs.ts`, `src/services/tree.ts` -- read-only `File` access for the selected id (`getFileHandle`, `getFile`), typed `unavailable` outcome -- AD-5, AD-6, AD-13
- [x] `src/services/previewSession.ts`, `src/services/previewSession.test.ts` -- open/abort/discard-stale sessions with an `AbortController`; test latest-wins with fake reads -- AD-10
- [x] `src/hooks/usePreview.ts` -- bridge selection to a session; expose `{ state, loading }` with the 150 ms delay -- AD-1
- [x] `src/components/PreviewPane.tsx`, `PreviewHeader.tsx`, `MetadataCard.tsx`, `src/App.tsx`, `src/App.css` -- dispatcher (every kind renders the card for now), region semantics, header, card, announcements, tab stop only while selected -- FR11, FR17, FR19, UX-DR11, UX-DR12, UX-DR17, UX-DR22
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- log untested `PreviewPane`/`MetadataCard`/`usePreview` behavior (region role, `aria-labelledby`, `tabindex`, announcements); no DOM test environment exists -- `component-tests.md`, `component-unit-tests.md`

**Acceptance Criteria:**
- Given the I/O matrix, then `npm test` covers every row `lib/` can decide.
- Given a file is selected, then the pane is `role="region"` labelled by the header `h2` with `tabindex="0"`; given none, it has a static label and no tab stop.
- Given rapid reselection, then only the last file's details appear and earlier sessions are aborted.
- Given the DOM, then there is no inline `style` attribute, no `fetch` call and no `blob:` URL created.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec, `epic-2-context.md` and `sprint-status.yaml`.

## Implementation Notes

Implemented directly (no implementation subagent). Deviations from the Code Map: `PreviewMeta` carries `mime` but not `typeLabel`, and `cardExplanation(name, size)` takes no `kind`; the card computes both from `lib/preview`. `usePreview` returns `now` alongside `state` so `PreviewPane` stays pure. `readItemFile` is the store's only new read intent; failed reads become a `failed` preview outcome and do not mark the tree row unavailable (Story 4.3). The text kind covers the `code` category and `txt|text|log|csv|ini|toml|xml|conf|cfg` as well as the name list, so tree glyphs for source and data files change from the generic file glyph to the text glyph; this is a choice the spec did not settle and Story 2.2 should confirm. Build, lint and tests pass. The component layer (`PreviewPane`, `PreviewHeader`, `MetadataCard`, `usePreview`, the `App` wiring) was not exercised in a browser or in a DOM test; the manual check was not run.

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| `.env*` prefix beat a real extension, so `.envelope.pdf` was not a PDF and `isPdf` regressed (BH, EC, VG) | low | patch | Text-name check moved after the extension checks; tests added. |
| Tree glyphs for code and data files changed with no test (BH, EC, VG) | medium | patch | Rows added to `glyphForFile` and `glyphForName` tests; choice disclosed in Implementation Notes. |
| `readItemFile` untested (VG) | medium | patch | `fakeTree` gained `getFileHandle`; four store tests added. |
| "Loading preview..." live region mounted already filled (BH, EC) | medium | patch | The status element is always mounted; only its text changes. |
| Failed read announced as "no preview available" (BH) | false | rejected | EXPERIENCE.md lists failed files under that announcement. |
| Two `h2` with the file name (BH) | false | rejected | The spec requires an `h2` in the header and in the card. |
| Tab stop on the empty region before the first load (BH) | low | rejected | Spec: `tabindex="0"` while a file is selected. |
| Duplicated region wrapper in `App` and `PreviewPane` (BH) | low | rejected | Cosmetic; the two states differ on purpose. |
| Abort signal not tied to the read (BH) | low | rejected | `getFile()` cannot be aborted; the flag guards the result and renderers consume the signal later. |
| `Invalid Date` throws in `toISOString` (BH, EC) | false | rejected | `File.lastModified` is always a finite number. |
| "MD file" and "TS file" type labels (BH) | low | rejected | Spec and EXPERIENCE.md: other extensions read "{EXT} file". |
| Same-id retry after a failed read (EC) | low | rejected | Retry belongs to Refresh (Story 4.2); `select` ignores the same id by design. |
| Previous file shown while the next loads (EC) | false | rejected | Spec: previous content stays until the new one is ready. |
| Announcement may repeat (EC) | false | rejected | `onAnnounce` is a stable `setStatus`; the effect runs only when `state` changes. |
| Failed read does not mark the tree row unavailable (EC) | low | rejected | The tree-side outcome is Story 4.3; the typed `failed` outcome meets this story. |
| `PreviewMeta.typeLabel` and `cardExplanation(kind, …)` differ from the Code Map (EC) | low | rejected | Internal signatures; behavior and strings match the spec. |
| Extra labelled region around the open-folder prompt (EC) | false | rejected | Spec: the pane has a static label in these states. |
| `PreviewPane`, `usePreview`, `App` wiring untested (VG) | medium (unverified) | defer | No DOM test environment; recorded in `deferred-work.md`. |
| Announcement text not tied to `kind` (VG) | low | rejected | Correct while every kind is a card; Stories 2.2 and 2.3 change it. |

## Design Notes

`resolvePreviewKind` order: directory-free input; `size === 0` → `metadata`; `.doc` → `metadata`; exact text name or `.env*` → `text`; extension map (`md|markdown` → markdown, `txt` and friends → text, `pdf`, `docx`, image list); else MIME (`text/*` → text, `image/*` → image, `application/pdf` → pdf); else `metadata`. Glyph is the kind's glyph except the binary-extension map, which stays extension-driven per `EXPERIENCE.md`.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (the real type check; `npx tsc --noEmit` checks nothing)
- `npm run lint` -- expected: exits 0, read-only grep gate included
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome or Edge: select a `.pdf`, `.docx`, `.zip`, an unknown extension and a zero-byte file; check header, card, stamp, Tab order and the region labels; select quickly across files; confirm announcements with a screen reader. If not run, report it as not run.
- Commit when implemented: `feat(preview): show selected file details` with footer `Story: 2-1` above Co-Authored-By.
