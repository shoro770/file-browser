---
title: 'Preview text files'
type: 'feature'
created: '2026-10-25'
status: 'in-review'
route: 'dispatch'
baseline_commit: 'f1b54ac758a30662e0913da444962f3142063738'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Files that resolve to the `text` kind (code, configs, logs, `Makefile`, `.env`) still show the Metadata Card, so a developer cannot read them without opening an IDE.

**Approach:** Add `TextPreview`, reached through the existing `PreviewPane` dispatcher. The leading 1 MB is read inside the preview session, so the 150 ms loading rule and latest-selection-wins already apply. Larger files get a pinned truncation banner.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components` (AD-1); `lib/` pure with JSDoc `@param`/`@returns` and Vitest tests; props typed in `src/types.ts`; role CSS variables only, no inline `style` attributes, no `fetch()`, no network, inline SVG only (banner info glyph). `TextPreview` lives in `src/components/preview/TextPreview.tsx` and consumes a `PreviewSource`, never a handle, and does not import `services/`. Only `previewSession` reads the `File`, and only `file.slice(0, limit)` is read (read-only). Content is inserted as text nodes, never HTML. Text uses `code-bg`, the `code` typography token, standard soft wrap and no horizontal scroll by default. Banner: "Showing the first 1 MB of {size}. The rest of the file isn't shown." with {size} from `formatSize`; `notice-bg`, `notice-text`, 1px `notice-border`, info glyph, not dismissible, static (not a live region), pinned above the content. Per-kind announcements: text announces only "Previewing {name}" (already in `App.handleSelect`); "{name}: no preview available" stays for card outcomes. The region stays `role="region"`, `aria-labelledby` the header `h2`, `tabindex="0"`, and keyboard-scrollable. Tab order unchanged. Colours come only from role variables; `text` on `code-bg` meets 4.5:1 in all three themes.

**Never:** Changes to `AGENTS.md`, `scripts/check-readonly.mjs`, `index.css` tokens, the Tree keyboard map or roving tabindex, `lib/{format,layout}.ts`. Content sniffing. Writing the user's files. Raw error text in the UI. Markdown or image rendering (Stories 3.1, 2.3). Committing in this planning pass.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Small text | `a.ts`, 20 KB | Monospaced text on `code-bg`, wrapped, no banner, no "no preview" announcement | N/A |
| Exactly 1 MB | 1,048,576 bytes | Full text, no banner | N/A |
| Over 1 MB | `big.log`, 4.2 MB | Leading 1 MB, banner "Showing the first 1 MB of 4.2 MB. …" above content | N/A |
| Cut inside a character | byte 1,048,576 splits a multibyte UTF-8 char | Partial trailing bytes dropped, no U+FFFD at the cut | N/A |
| Names | `Makefile`, `.env.local`, `README` / `makefile`, extensionless `foo` | Text / Metadata Card (case-sensitive) | N/A |
| Markup in text | file holds `<script>alert(1)</script>` | Shown literally, nothing runs | N/A |
| Invalid UTF-8 or NUL bytes | `.txt` with binary content | Decoded with replacement characters, still text | N/A |
| Zero-byte | `empty.txt` | Metadata Card "This file is empty." (unchanged) | N/A |
| Fast reselect | text A then B | A's read discarded; only B shown | Late A result dropped |
| Read throws | file removed mid-read | Metadata Card with the render-failure text | Typed `failed` outcome |

</frozen-after-approval>

## Open Questions

Non-interactive run: each default below is applied in the tasks. A human can overturn it before implementation.

- Story 2.1 resolved source-code and data extensions (`code` category plus `txt|text|log|csv|ini|toml|xml|conf|cfg`) to `text`, changing their tree glyph to the text glyph; its notes ask this story to confirm — options: keep (default; the epic wants code, configs and logs readable) / limit `text` to the name list and a short extension list (tree glyphs revert, but `.ts` would show a card).
- Binary-looking content in a text-kind file (NUL bytes) — options: render with replacement characters (default; no sniffing per AD-8) / fall back to the card (needs a content check the spec forbids).
- Where the 1 MB read happens — options: inside `previewSession` and carried on `PreviewSource` as `text` (default; reuses the 150 ms loading and latest-wins, keeps the read out of components) / inside `TextPreview` (needs its own loading and discard logic).
- Tab width and long unbroken lines — options: `tab-size: 4` and `overflow-wrap: anywhere` (default) / browser defaults.
- The 100 ms render target and the real-folder behaviour cannot be proven headlessly — options: run the manual check in Chrome or Edge (default) / report it as not run.

## Code Map

- `src/lib/preview.ts` -- `resolvePreviewKind` already returns `text` for the name list, `.env*`, plain-text and `code` extensions; do not change the order or tables. Add truncation helpers here or in a new `src/lib/text.ts`.
- `src/services/previewSession.ts` -- `createPreviewSessions(read)`; after `read(id)`, if `kind === 'text'` read `file.slice(0, MAX_TEXT_BYTES)` and set `source.text`; a throw becomes `failed`. Test file exists.
- `src/types.ts` -- `PreviewSource` (~line 214), `PreviewPaneProps`; add `TextContent`, `TextPreviewProps`.
- `src/components/PreviewPane.tsx` -- dispatcher currently renders `MetadataCard` for every kind and announces "no preview available" for every ready state; branch on `kind` and announce only for card kinds.
- `src/components/MetadataCard.tsx`, `PreviewHeader.tsx`, `Glyph.tsx` -- reuse the info-glyph shapes if present; add an info shape only if missing (inline SVG).
- `src/App.css` -- `.preview`, `.preview__body`, `.preview__loading` (~lines 142–200); add `.text-preview` and `.truncation-banner` with tokens (`--color-code-bg`, `--font-code`, `--color-notice-*`).
- `src/lib/format.ts` -- `formatSize` reused as is.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- add the component-test entry.

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts` -- add `TextContent` (`text`, `truncated`, `totalSize`), optional `text` on `PreviewSource`, `TextPreviewProps` -- AD-9
- [x] `src/lib/text.ts`, `src/lib/text.test.ts` -- `MAX_TEXT_BYTES` (1,048,576), `trimPartialUtf8(bytes)`, `truncationNotice(size)`; tests for exact limit, over limit, split two/three/four-byte characters, empty -- FR12, UX-DR14
- [x] `src/services/previewSession.ts`, `previewSession.test.ts` -- bounded text read for the `text` kind via fake reads; tests for truncation flag, latest-wins and read failure -- AD-10
- [x] `src/components/preview/TextPreview.tsx` -- `<pre>` with the text as a child text node, banner when `truncated`, no HTML insertion -- NFR6, UX-DR13, UX-DR14
- [x] `src/components/PreviewPane.tsx` -- dispatch `text` to `TextPreview`, keep the card for other kinds, announce "no preview available" only for card kinds -- UX-DR22
- [x] `src/App.css` -- text and banner styles, sticky header and banner inside the scrolling region, soft wrap, no inline styles -- UX-DR14, UX-DR29
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- log untested `TextPreview` banner, text-node rendering and announcement behaviour; no DOM test environment exists

**Acceptance Criteria:**
- Given a `text` file up to 1 MB, when selected, then it appears wrapped in monospace on `code-bg` with no horizontal scroll and no banner.
- Given a file over 1 MB, when selected, then only the leading 1 MB was read (`slice`), and the banner stays visible while the text scrolls.
- Given the pane, then there is no `dangerouslySetInnerHTML`, no inline `style`, no `fetch`, and the region is still labelled by the header `h2` with `tabindex="0"`.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec, `sprint-status.yaml`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| `min-height: 100%` on `.text-preview__content` did not resolve against an auto-height parent (EC) | low | patch | `.text-preview` is now a flex column with `min-height: calc(100% - header)`; the content flexes. |
| Announce and render used different predicates for a text kind without `text` (BH, EC) | low | patch | The announcement now fires when `kind !== 'text' \|\| !source.text`. |
| Superseded session still read 1 MB; kind resolved twice (EC) | low | patch | Abort check before the text read; `kind` computed once. |
| No text-path latest-wins test (EC) | medium | patch | Test added in `previewSession.test.ts`. |
| `trimPartialUtf8` malformed-input test missing (BH) | low | patch | Stray-continuation test added. |
| `PreviewPane`/`TextPreview` untested (VG) | medium (unverified) | defer | No DOM test environment; entry added to `deferred-work.md`. |
| Fixed 3rem header height clips or misaligns the banner (BH, EC) | false | rejected | The name is `nowrap` with ellipsis and the height is in rem, so it scales with font size and never wraps. |
| Banner hard-codes "1 MB"; barely-over-1 MB reads "1.0 MB" (BH, EC) | low | rejected | The spec fixes the sentence; the fix would add parameters for a rare size. |
| `TextPreview` throws without `text` (BH, EC) | false | rejected | `PreviewPane` renders it only when `source.text` is set. |
| Truncation flag disagrees if the file changes mid-read (EC) | false | rejected | A `File` is a snapshot; a changed file fails the read and becomes the `failed` outcome. |
| Binary or UTF-16 content shows replacement characters (BH, EC) | false | rejected | Accepted open-question default; no sniffing (AD-8). |
| Banner without a role (BH) | false | rejected | The spec requires a static, non-live banner. |
| Sprint status mismatch (BH) | false | rejected | Moved to `review` by this run. |
| Read cannot be cancelled (BH) | low | rejected | `Blob.arrayBuffer` has no abort; the aborted flag discards the result. |
| 4.5:1 contrast and the 100 ms render not measured (EC, BH) | maybe-false | defer | Tokens predate this story; browser check not run, recorded in `deferred-work.md`. |

## Design Notes

Keyboard scrolling works only if the focused element scrolls, so make `.preview` the scroll container with the header and banner `position: sticky` at the top, rather than scrolling a child. Verify in a browser; a child scroller would need a second tab stop, which breaks the tab order. `trimPartialUtf8` drops at most 3 trailing bytes that begin an incomplete sequence; decode the rest with a non-fatal `TextDecoder`.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0 (the real type check)
- `npm run lint` -- expected: exits 0, read-only grep gate included
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome or Edge: select a small `.ts`, a `Makefile`, `.env.local`, a 4 MB log and a file with `<script>` text; check wrap, banner pinned while scrolling, Tab and arrow/PageDown scrolling of the pane, ~1 MB render under 100 ms, three themes. If not run, report it as not run.
- Commit when implemented: `feat(preview): preview text files` with footer `Story: 2-2` above Co-Authored-By.
