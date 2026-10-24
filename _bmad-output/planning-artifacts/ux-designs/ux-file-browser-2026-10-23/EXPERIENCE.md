---
name: file-browser
status: final
created: 2026-10-23
updated: 2026-10-23
sources:
  - _bmad-output/planning-artifacts/prds/prd-file-browser-2026-10-23/prd.md
  - _bmad-output/planning-artifacts/briefs/brief-file-browser-2026-10-22/brief.md
  - _bmad-output/planning-artifacts/briefs/brief-file-browser-2026-10-22/addendum.md
  - AGENTS.md
---

# file-browser — Experience Spine

> Paired with `DESIGN.md`. Colors are written `{colors.light-<role>}` and mean the current theme's value of that role (see DESIGN.md token convention). Where a rule derives from the PRD it cites FR / NFR / UJ IDs. `[ASSUMPTION]` tags are carried from `.memlog.md` and the PRD. This spine and DESIGN.md win over any mock.

> **Conflict:** AGENTS.md's `role="listbox"` / `role="option"` rule conflicts with this spec's `role="tree"` / `role="treeitem"`; the owner must update AGENTS.md before implementation (Open Items 1).

## Foundation

Single-surface desktop web app for a maximized window (FR-24). Supported: current desktop Chrome and Edge, which provide the File System Access API (NFR-9). Everything runs client-side (contract: Privacy and Inertness of Previewed Content). Access to the Workspace Folder is read-only (FR-3); no control anywhere can write, rename or delete. Single selection (FR-7). No UI framework; vanilla CSS custom properties, inline-SVG icons, system fonts (DESIGN.md). No sort or filter controls: order is fixed folders-first, case-insensitive alphabetical (FR-4) `[ASSUMPTION]`. No search (PRD §5). No narrow-viewport or touch layout. Zoom and reflow: see DESIGN.md Layout & Spacing (200% supported; 400% is a documented exception, Open Items 8).

## Information Architecture

Surfaces, each reached by a journey:

| Surface | Reached from | Purpose | Needs served |
|---|---|---|---|
| Unsupported-browser screen | App load in a browser lacking folder access | Explain, dead end by design | NFR-9 |
| Open-folder prompt (Preview Pane, no folder) | App load, supported browser | Sole content before a folder is chosen | FR-1, FR-25 |
| Toolbar | Always present once supported | Open folder, hidden files, Refresh, theme | FR-1, FR-9, FR-20, FR-22 |
| Tree | After a folder is chosen | Navigate Entries, select a file | FR-4 to FR-8, FR-10 |
| Divider | Between panes | Resize panes | FR-24 |
| Preview Pane: empty / select-a-file prompt | Folder open, no Selection | Invite selection | FR-19 |
| Preview Pane: Preview | Select a previewable file | Text, Markdown, PDF, DOCX, image | FR-11 to FR-16 |
| Preview Pane: Metadata Card | Select an unpreviewable, empty or failing file | Never blank, never raw error | FR-17, FR-18 |

Layout: toolbar across the top, Tree left, Preview Pane right (preview gets the majority), divider between. No routes, dialogs, drawers or modals; the only system dialog is the browser's folder picker.

Surface closure: every PRD need has a surface and every surface lands in UJ-1 or UJ-2, except the unsupported-browser screen (NFR-9, no journey; Open Items 6); theme control serves UJ-2 step 3, hidden-files toggle UJ-2 step 2, Refresh UJ-1 step 4.

## Voice and Tone

Microcopy. Brand voice lives in DESIGN.md Brand & Style. Plain, calm, short sentences; say what happened and what the user can do; no exclamation marks, emoji, jargon or blame. Never show raw error text or exception names.

| Do | Don't |
|---|---|
| "Open a folder to start browsing." | "Welcome! Click here to get started!" |
| "Showing the first 1 MB of 4.2 MB." | "Warning: file truncated." |
| "No preview is available for this type of file." | "Error: unsupported MIME type." |

Strings (canonical; `{x}` is a runtime value):

| Where | String |
|---|---|
| Open-folder prompt title / body / button | "Open a folder to start browsing." / "Files are read in this browser tab. Nothing is uploaded, and nothing is ever changed." / "Open folder" |
| Select-a-file prompt (FR-19) | "Select a file to preview it." / "Folders open in the tree on the left." |
| Empty folder (root) | "This folder is empty." / "There are no files here to show." |
| Empty root, dotfiles hidden, only dotfiles present | "Nothing to show." / "Hidden files are turned off." |
| Empty subfolder (child row) | "Empty folder" (muted) |
| Subfolder with only dotfiles, hidden | "No visible files" (muted) |
| Access denied (FR-2) | "Access to that folder wasn't granted. Choose a folder to try again." |
| Cancelled picker (FR-2) | none (silent) |
| Unavailable entry (FR-10) | Visible suffix "Unavailable"; row name stays "{name}"; accessible description "Unavailable, can't be read" (mechanics: Accessibility Floor) |
| Unavailable folder expanded | child row "This folder can't be read." |
| Tree loading (after 150 ms) | child row "Loading..." |
| Preview loading (after 150 ms) | "Loading preview..." |
| Preview Header stamp | "Modified Today at 11:04 AM" / "Modified Yesterday at 4:30 PM" / "Modified Oct 21, 2026 at 3:12 PM" (relative label for today per FR-11; yesterday and older formats are `[ASSUMPTION]`). Label wording: the header stamp reads "Modified {when}" and the Metadata Card row reads "Last modified"; the difference is intentional (sentence stamp vs label beside value), with identical date text in both, including for zero-byte files. |
| Truncation banner (FR-12) | "Showing the first 1 MB of {size}. The rest of the file isn't shown." |
| Blocked remote resource (FR-13) | "Remote image blocked" (alt text appended as caption when present) |
| Blocked remote link | Link text remains as plain, non-focusable text (no tab stop, no underline); not navigable (FR-13). In-document anchors (`#heading`) scroll within the Preview Pane. |
| Metadata Card, unsupported | "No preview is available for this type of file." |
| Metadata Card, zero bytes | "This file is empty." (Size reads "0 bytes"; the Modified stamp uses the normal format) `[ASSUMPTION]` |
| Metadata Card, legacy .doc | "Legacy .doc files can't be previewed. Only .docx is supported." |
| Metadata Card, render failure (FR-18) | "This file couldn't be previewed. It may be damaged or in an unexpected format." |
| Preview outcome announcements `[ASSUMPTION]` | Status-only strings are listed once, in the Accessibility Floor announcements table; "Loading preview..." is also the visible loading text |
| Selection missing after Refresh (FR-21) | "{name} was removed or can no longer be read, so the selection was cleared." |
| Hidden-files toggle | Name "Hidden files"; visible state word "Shown" / "Hidden"; accessible description "Pressed: hidden files are shown." (meaning and mechanics: Accessibility Floor) |
| Theme control | "Light", "Dark", "Warm Sand"; group label "Theme" |
| Divider | label "Resize file tree" |
| Unsupported browser title / body | "This browser can't open folders." / "file-browser needs folder access, which is available in current desktop Chrome and Edge. Open this page in one of those to continue." |

## Component Patterns

Behavioral. Visual specs live in DESIGN.md Components. Mocks: [two-pane](mockups/key-two-pane.html), [Metadata Card](mockups/key-metadata-card.html), [truncation banner](mockups/key-truncation.html); this spine wins on conflict. Spine-only (no mock): empty and no-folder states, unsupported-browser screen, unavailable-row and permission-denied messages, image, PDF and DOCX previews.

| Component | Use | Behavioral rules |
|---|---|---|
| Toolbar | Always | Controls: Open folder, Workspace Folder name, Hidden files, Refresh, theme. Refresh is disabled with no folder open. Hidden files and theme remain usable with no folder. No write controls (FR-3). |
| Open folder | Toolbar and prompt | Opens the browser's read-only picker (FR-1). Confirming a folder replaces the Tree and clears the Selection. Cancel changes nothing and says nothing; denial shows the access-denied message (FR-2). |
| Tree container | Tree | `role="tree"` with an accessible name ("File tree"); child folders' rows are wrapped in `role="group"` containers. Roving tabindex invariant (stated only here): the tree always has exactly one row with `tabIndex=0`, the rest `-1`; it is reassigned immediately on any rebuild (repair order: Focus management). Placeholder child rows ("Empty folder", "No visible files", "Loading...", "This folder can't be read.") are `role="treeitem"` with `aria-disabled="true"`, no `aria-expanded`, reachable with Up/Down so they are announced, and never selectable `[ASSUMPTION]`. |
| Tree row (folder) | Tree | `role="treeitem"`, `aria-expanded` true/false, `aria-level`, `aria-setsize`, `aria-posinset`; no `aria-selected` (folders are not selectable). Activation (click, Enter, Space) toggles expansion and keeps the current file Selection (FR-7) `[ASSUMPTION]`. First expand reads only that folder's children (FR-5); re-expand shows cached children with no visible reload `[ASSUMPTION]`; collapse keeps descendants' expansion until Refresh or a new folder (FR-6). The chevron is a visual of the same target, not a separate stop. Long names truncate with an ellipsis and expose the full name through `title`. |
| Tree row (file) | Tree | `role="treeitem"` (no `aria-expanded`), with `aria-level`, `aria-setsize`, `aria-posinset`, and `aria-selected="true"` on the selected file and `"false"` on every other file. Activation selects it as the only Selection (FR-7); previous deselects. Selecting never moves focus out of the Tree. |
| Dotfile row | Tree | Any Entry whose name begins with "." (files and folders), and no other; descendants of a dotfile folder are dotfiles too. Behavior is identical to any row. Visual rule: DESIGN.md Components `tree-row-dotfile` (canonical). |
| Hidden files toggle | Toolbar | Default shown (FR-9). A toggle button with a constant name and `aria-pressed` (meaning: Accessibility Floor). Toggling applies at once without collapsing folders or clearing a non-dotfile Selection. If the Selection is a dotfile (or inside a dotfile folder) when hiding, Selection clears and the Preview Pane returns to the select-a-file prompt, with no visible message but a "Selection cleared" announcement (Accessibility Floor). Roving tabindex is repaired on every toggle (see Focus management). Persisted (NFR-7). |
| Refresh | Toolbar | Re-reads Workspace Folder and Selection (FR-20); see Interaction Primitives. |
| Divider | Between panes | Draggable and keyboard-operable; see Interaction Primitives. Width is not persisted (NFR-7). |
| Preview Header | Top of Preview Pane | Shown only while a file is Selected (FR-11): name (an `h2`) and Last Modified Stamp (in `<time datetime>`). The stamp lives here, not in the toolbar (confirmed). |
| Truncation banner | Top of text preview | Appears when the file exceeds 1 MB; the preview shows the leading portion (FR-12). Pinned above the content (does not scroll away). Not dismissible. Markdown over 1 MB is treated the same `[ASSUMPTION]`. |
| Metadata Card | Preview Pane | Name (an `h2`), size, type, Last Modified (FR-17); Type strings and glyphs: Content rules below. Covers unsupported binaries, zero-byte files (labeled empty), legacy .doc, unknown types and render failures with a short explanation `[ASSUMPTION]`. Images are previewed, not carded. Type comes from extension and device-reported type only, no content inspection `[ASSUMPTION]`. |
| Text preview | Preview Pane | Monospace, standard soft wrap (no horizontal scroll by default). Recognized as plain text by extension, or by exact, case-sensitive file name from the list under this table. Other extensionless files get a Metadata Card. No content inspection (FR-17). The name list is an `[ASSUMPTION]` seed that the owner can extend. |
| Image preview | Preview Pane | Scaled to fit, aspect ratio kept; never enlarged beyond native size `[ASSUMPTION]` (FR-16). Alt text is the file name; this is deliberate, as no other text source exists. Animated formats (GIF, APNG, WebP) autoplay as authored; loops longer than 5 s are an open WCAG 2.2.2 item (Open Items). |
| PDF preview | Preview Pane | Continuous scroll; no page or zoom controls (FR-15). |
| Markdown / DOCX preview | Preview Pane | Inert, sanitized static output (FR-13, FR-14; contract: Privacy and Inertness). Markdown uses soft wrap. Link navigation rule `[ASSUMPTION]`: see Privacy and Inertness. Links are underlined; links that cannot act (blocked remote) render as plain text with no tab stop; `#anchor` links scroll within the pane; remote images become blocked placeholders. |
| Theme control | Toolbar | Three-way segmented radio group (FR-22). Applies immediately to every surface including rendered previews, without reload, and without clearing Selection or expansion. |
| Empty states | Preview Pane | Open-folder prompt is the sole content before a folder is chosen (FR-25); no sample or mock files ever. |

### Content rules

Metadata Card `Type` strings `[ASSUMPTION]` (from extension and device-reported type only, no content inspection): known map first, else a fallback.

| Extension / case | Type string |
|---|---|
| .doc | "Word document (legacy)" |
| .docx | "Word document" |
| .pdf | "PDF document" |
| .zip, .tar, .gz, .7z | "Archive" |
| .exe, .dll, .bin, .so, .dylib | "Binary file" |
| .mp3, .wav, .flac | "Audio file" |
| .mp4, .mov, .mkv | "Video file" |
| Other extension `.xyz` | "XYZ file" (extension upper-cased) |
| Extensionless, not on the text-name list | "File" |

Kind glyph per Preview kind `[ASSUMPTION]` (shapes in DESIGN.md Components): folder: folder; image: image; Markdown, plain text and recognized config names: text; .docx and .doc: document; .pdf: pdf; archive/binary/audio/video types above: binary; anything else: generic file. Glyphs are inline SVG and `aria-hidden`.

Text preview file names (exact, case-sensitive; an `[ASSUMPTION]` seed the owner can extend):

- `Makefile`
- `GNUmakefile`
- `Dockerfile`
- `Containerfile`
- `Procfile`
- `Gemfile`
- `Rakefile`
- `Brewfile`
- `Vagrantfile`
- `LICENSE`
- `LICENCE`
- `COPYING`
- `NOTICE`
- `AUTHORS`
- `CONTRIBUTORS`
- `CHANGELOG`
- `README`
- `CODEOWNERS`
- `.gitignore`
- `.gitattributes`
- `.gitmodules`
- `.editorconfig`
- `.npmrc`
- `.nvmrc`
- `.prettierrc`
- `.eslintrc`
- `.babelrc`
- `.dockerignore`
- any name beginning with `.env` (e.g. `.env`, `.env.local`)

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Unsupported browser | Whole window | Replace the app with the unsupported-browser screen; no toolbar or panes (NFR-9). |
| No folder open | Preview Pane, Tree empty | Open-folder prompt only (FR-25). Tree pane shows nothing. |
| Folder open, no Selection | Preview Pane | Select-a-file prompt (FR-19). |
| Loading, tree | Expanding row | Chevron swaps to a spinner glyph only if the read exceeds 150 ms `[ASSUMPTION]`, then a "Loading..." child; instant otherwise (NFR-2 target under 100 ms). |
| Loading, preview | Preview Pane | Previous content stays until ready; after 150 ms `[ASSUMPTION]` show "Loading preview..." (announcement: Accessibility Floor) (first PDF/DOCX use loads a lazy renderer, NFR-1). Latest selection wins; stale loads are discarded. |
| Empty folder | Tree (root: pane message; subfolder: child row) | See Voice and Tone strings. Dotfiles-only variants distinguish "empty" from "hidden". |
| Error, unreadable preview | Preview Pane | Metadata Card with short explanation, pane stays responsive (FR-18). Never a stack trace or blank pane. |
| Unavailable | Tree row | Row stays in the Tree, marked "Unavailable"; rest of the Tree keeps working (FR-10). Not an alert; no focus theft. Selecting an unavailable file shows a Metadata Card with the render-failure explanation (announcement: Accessibility Floor). |
| Truncated | Text preview | Banner plus leading 1 MB (FR-12). |
| Refresh | Toolbar, Tree, Preview | Button shows busy (`aria-busy`, label unchanged); on completion it is announced (Accessibility Floor). Expansion and Selection kept when the Entry survives `[ASSUMPTION]` (FR-20). Preview scroll position is preserved when the selected file path is unchanged. |
| Selection missing | Preview Pane | After Refresh, Selection cleared, prompt returns with a notice using the FR-21 string, as a status message above the prompt, until the next selection. |
| Permission denied | Open folder flow | Previous state retained; access-denied message shown once, inline under the toolbar, dismissed on next action (FR-2). Cancel is silent. |
| Cancel | Open folder flow | No change, no message, focus returns to the Open folder control (FR-2). |
| Blocked remote resource | Markdown / DOCX preview | Placeholder replaces the image; no request is made (FR-13; Privacy and Inertness). |
| Theme switch | Everywhere | Instant; Selection, expansion and scroll positions untouched (FR-22). |

## Interaction Primitives

**Tree keyboard map** (`role="tree"`; single tab stop; roving tabindex; focus and selection are separate, FR-8):

| Key | Action |
|---|---|
| Up / Down | Move focus to previous / next visible row |
| Right | Collapsed folder: expand. Expanded folder: move to first child (an empty expanded folder moves to its placeholder row). File or placeholder row: nothing |
| Left | Expanded folder: collapse. Otherwise: move to parent folder. Root-level row with no parent: nothing |
| Enter / Space | File: select. Folder: toggle expansion (FR-7 `[ASSUMPTION]`) |
| Home / End | First / last visible row |
| PageUp / PageDown | Move focus up / down by one visible page of rows (clamped to first / last) |
| Printable character | Type-ahead (required): jump to the next visible row whose name starts with the typed characters; characters typed within 500 ms accumulate |
| Tab / Shift+Tab | Leave the Tree (next: divider, then Preview Pane; previous: toolbar) |

Type-ahead and PageUp/PageDown are required because UJ-2 involves thousands of files and they are the main non-pointer way to reach a file in a long list. No multi-select in v1. A mouse click on a row focuses and activates it.

**Divider.** Focusable separator in the tab order between Tree and Preview. Left / Right resize by 16 px; Shift+Left / Shift+Right by 64 px; Home / End jump to minimum / maximum width; Enter or double-click resets to default. Pointer drag and keyboard resizing are both clamped: Tree no narrower than `{spacing.tree-width-min}` (220 px) and no wider than `{spacing.tree-width-max}` or 40% of the window width, whichever is smaller, Preview Pane never narrower than `{spacing.preview-min}` (320 px). The minimums win over the cap in narrow windows. Exposes `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow/min/max` as pixel widths, `aria-valuetext` (e.g. "280 pixels"), `aria-controls` pointing at the Tree pane, and `aria-label` "Resize file tree". `aria-valuemax` is recomputed on every window resize and is never less than `aria-valuemin` (when the minimums win, max equals min, so the range stays valid). The hit area is 12 px wide, overlaying the pane edge without covering the tree scrollbar. The grip is visible at rest. Each pane scrolls independently (FR-24).

**Tab order.** Toolbar controls (Open folder, Hidden files, Refresh, theme group) in visual order, then the Tree, then the divider, then the Preview Pane scroll container so the preview is keyboard-scrollable and reachable (FR-8, NFR-8). The container is `role="region"` with `aria-labeledby` the Preview Header file name, and `tabindex="0"` only while a file is Selected (or its content scrolls). In the prompt and empty states it has a static label and is not a tab stop. The theme control is one tab stop; arrow keys move between and select its three segments.

**Focus management.**
- After a folder is chosen: focus moves to the first Tree row (not auto-selected). For an empty folder there is no row, so focus moves to the Open folder button in the toolbar, because the in-pane prompt button unmounts. Announcement: Accessibility Floor.
- Cancel or denied folder prompt: focus returns to the Open folder control.
- Selecting a file keeps focus on the row; the preview never steals focus.
- Roving-tabindex repair (any rebuild: hide dotfiles, Refresh, new folder). Restore the invariant from Component Patterns immediately, never deferred to the next Tree focus. Priority: the current tab-stop row if it survives; else its nearest surviving ancestor or previous visible row; else the selected row; else the first visible row. If no row exists (empty tree), the tree has no tab stop and the placeholder or pane message is reached instead. When Tab enters the tree from outside it lands on the last-focused row, else the selected row, else the first.
- Hiding dotfiles while a hidden row is focused: focus moves to the nearest visible previous row, else the parent. When focus is on the toolbar button (the usual case), focus stays there and the tab stop is repaired as above.
- Refresh: focus stays on the Refresh button; the tab stop is repaired immediately if its row vanished.
- Visible focus ring `{colors.light-focus-ring}`, 2 px, on every focusable element in every theme (FR-8).

**Refresh behavior (FR-20, FR-21).** Re-reads the root level and every expanded folder, plus the Selection. New and removed Entries appear or disappear in expanded folders; expansion state and Selection are kept when their Entry still exists `[ASSUMPTION]`; collapsed, never-expanded folders are not read. The Preview and the Last Modified Stamp reload for the Selected file; if the file path is unchanged, the preview keeps its scroll position. If the Selection is gone or unreadable, it is cleared with the FR-21 notice. If the Workspace Folder itself can't be read, the Tree is kept and the access-denied message is shown (see Open Items). Refresh is manual only; there is no polling (PRD §5).

**Pointer.** Click row activates; drag divider resizes; no right-click menus, no drag-and-drop of files (read-only, FR-3).

**Banned:** any write, rename, delete or upload affordance; auto-refresh; modals and popovers; outbound links that navigate away; hover-only affordances (every action is visible or keyboard-reachable).

## Accessibility Floor

Behavioral. Visual contrast is verified in DESIGN.md Colors (AA in all three themes; dotfile dimming: DESIGN.md Components `tree-row-dotfile`). Forced-colors behavior is specified in DESIGN.md Components.

- WCAG 2.1 AA target (FR-22, NFR-8). Everything is operable by keyboard alone (FR-8).
- Tree semantics are an owner decision: `tree` / `treeitem` replaces the listbox/option pattern. ARIA attributes and what each row exposes (name, kind, expanded, selected, "unavailable"; FR-8, FR-10) are specified in Component Patterns. Dotfile dimming is visual only and not announced. **Follow-up:** AGENTS.md currently mandates `role="listbox"` / `role="option"` on FileRow and must be updated by the owner before implementation (Open Items 1); UX does not edit it.
- Selection is never color-only: accent bar plus `aria-selected`. Unavailable is text plus glyph plus accessible name. Active theme segment is `aria-checked`.
- Theme control is `role="radiogroup"` labeled "Theme" (the checked radio is the single, roving tab stop). Do not use `role="toolbar"` on the header unless arrow-key navigation is also added.
- Hidden-files toggle (meaning defined here once): a button with the constant accessible name "Hidden files". `aria-pressed="true"` means hidden files are shown (the default); `false` means they are not shown. The meaning is stated through `aria-describedby` text "Pressed: hidden files are shown." The visual state word "Shown" / "Hidden" is `aria-hidden`, so the name never changes.
- Unavailable entries: the reason ("Unavailable, can't be read") is exposed through `aria-describedby`; the visible label begins the name (WCAG 2.5.3).
- Page structure `[ASSUMPTION]`: `<html lang="en">`; document title "file-browser" plus the Workspace Folder name once open; `<header>` for the toolbar; the Tree as a labeled `nav`-like region (the `role="tree"` named "File tree"); `<main>` for the Preview Pane; a visually hidden `h1` "file-browser"; Preview Header and Metadata Card file names are `h2`; empty-state and unsupported-browser titles are `h1`/`h2` respectively (the unsupported-browser screen is a single `<main>` with an `h1`).
- Live regions: one persistent, visually hidden polite `role="status"` carries all announcements, listed once here:

  | Event | String | Politeness |
  |---|---|---|
  | Folder chosen | "Opened {name}" | polite |
  | File activated (click, Enter, Space) `[ASSUMPTION]` | "Previewing {name}" | polite |
  | Unsupported, empty or failed file `[ASSUMPTION]` (the card explanation is the visible text; includes selecting an unavailable file) | "{name}: no preview available" | polite |
  | Loading preview appears `[ASSUMPTION]` | "Loading preview..." | polite |
  | Hiding dotfiles clears the Selection `[ASSUMPTION]` | "Selection cleared" | polite |
  | Refresh in flight | "Refreshing..." | polite |
  | Refresh done | "Refreshed." | polite |
  | Selection missing after Refresh (FR-21) | "{name} was removed or can no longer be read, so the selection was cleared." | polite |
  | Access denied | "Access to that folder wasn't granted. Choose a folder to try again." | polite; after a user action also mirrored with `role="alert"` (assertive) `[ASSUMPTION]` |

  Visible notices (the access-denied message under the toolbar, the selection-missing notice above the prompt) are ordinary visible elements; their text is mirrored into the status region, so one region serves several visual spots. To re-announce an identical string, clear the region, then set the text on the next frame. Announce previews on activation or on failure, never on each arrow-key move. The truncation banner is static, not live.
- Preview content: Markdown/DOCX render real headings, lists and tables; images carry the file name as alt text; blocked placeholders have an accessible name "Remote image blocked"; PDF is reachable by keyboard (focusable container; its text and structure are whatever the renderer exposes).
- `prefers-reduced-motion` removes all transitions and animations (static spinner, instant chevron, no smooth scroll). Zoom and reflow follow DESIGN.md Layout & Spacing (200% supported; 400% is a documented exception, Open Items 8). Row and toolbar heights are minimums in `rem`, so larger text and text-spacing overrides do not clip.
- All glyphs are `aria-hidden`; every control has a text label.

## Persistence of Preferences

Only two preferences are stored on the device: **Theme** (FR-23) and **dotfile visibility** (FR-9). Nothing else is stored: not file contents, not the last Workspace Folder (PRD §6.2), not the Selection, expansion, divider width or scroll position (NFR-7). On start: apply the stored Theme, else Light or Dark per `prefers-color-scheme` (never Warm Sand by default); apply stored dotfile visibility, else shown. If storage is unavailable the app works with defaults, silently. Preferences never include anything derived from file names or contents.

## Privacy and Inertness of Previewed Content

The product's trust promise (NFR-5, NFR-6, SM-3, SM-C1). Previewed content is data, never behavior:

- No backend and no telemetry. No network request for any reason, including images, links, fonts, SVG references and PDF/DOCX resources. Remote references become inert placeholders or plain text.
- Markdown and DOCX output is sanitized, static markup; no scripts, handlers or embeds.
- Images render through an image element only; SVG is never inlined, so its scripts and external references do not run or load (FR-16). Object URLs are released when the Selection changes.
- Links in rendered documents do not navigate the app away (FR-13 `[ASSUMPTION]`).
- Speed never justifies weakening any of the above (SM-C1).

## Key Flows

### UJ-1. Shneor verifies what Claude just made

Covers: FR-1, FR-4, FR-5, FR-7, FR-9, FR-13, FR-14, FR-16, FR-19, FR-20, FR-21, FR-25, SM-1, FR-10.

Protagonist: Shneor, a full-stack engineer, mid-session with Claude Code in the terminal. Claude has just drafted an architecture spec (Markdown), an exported summary (Word) and a mockup image. file-browser is open in Chrome with nothing loaded.

1. He sees the open-folder prompt ("Open a folder to start browsing."), activates Open folder and picks the project root. The Tree appears at once; the Preview Pane says "Select a file to preview it."
2. He expands subfolders with Right or a click. Dotfile folders are visible at 0.6 opacity at rest; expansion is instant.
3. He selects the Markdown spec, then the Word summary, then the mockup image. Each preview appears immediately and is formatted; the image fits the pane.
4. He returns to the terminal, asks Claude to revise the spec, comes back, selects the spec and presses Refresh.
5. **Climax:** the preview reloads with the revised text and the Preview Header now reads, for example, "Modified Today at 11:04 AM". He knows the change landed.
6. He is done in under 30 s without launching an IDE.

Edge: Claude deleted or broke the file. On Refresh the Selection clears and the prompt shows "{name} was removed or can no longer be read, so the selection was cleared." instead of a stale or blank preview (FR-21). Failure: a folder can't be read; it is marked "Unavailable" and the rest of the Tree keeps working (FR-10).

### UJ-2. The evaluator probes the edges

Covers: FR-4, FR-9, FR-13, FR-17, FR-22, NFR-2, NFR-4, NFR-5, NFR-6, SM-3, NFR-9.

Protagonist: the course instructor, assessing whether the product handles hard cases and meets the performance and UX bar, with a large repository (thousands of files) ready in Chrome.

1. Opens the large repository root; the Tree appears and stays responsive.
2. Toggles Hidden files off and on; dotfiles disappear and return (dimmed at 0.6 at rest) while expansion and Selection are untouched.
3. Cycles Light, Dark and Warm Sand with the theme control; every surface stays legible and consistent.
4. Selects an unsupported binary and a zero-byte file; each shows a Metadata Card, the latter saying "This file is empty."
5. Opens a Markdown file containing a remote image; a "Remote image blocked" placeholder appears and no network request is made.
6. **Climax:** step 5, with nothing leaving the machine, plus step 4's graceful fallbacks. The evaluator concludes the product is robust, private and polished.

Failure: they open the app in Firefox; the unsupported-browser screen explains why and where to go (NFR-9).

## Open Items

Genuinely open:

1. **AGENTS.md update** by the owner before implementation (owner confirmed 2026-10-25 they will update it to `tree`/`treeitem` before execution begins) (see the Conflict callout at the top and the Follow-up in Accessibility Floor).
2. **Refresh failure.** No FR for the Workspace Folder itself becoming unreadable or its permission being revoked mid-session; this spec keeps the Tree and reuses the access-denied message.
3. **Date formats.** Only the "Today at" label is specified (FR-11); "Yesterday" and absolute formats are assumed.
4. **Loading-indicator delay.** The 150 ms threshold is assumed; the PRD sets only latency targets.
5. **Markdown over 1 MB.** Unspecified in the PRD; treated like text (leading 1 MB plus banner) `[ASSUMPTION]`.
6. **Unsupported-browser screen** is a surface with no PRD journey; it is justified by NFR-9 only.
7. **Product name** remains the working title "file-browser" (PRD §9).
8. **400% reflow (A-5). Resolved 2026-10-25:** owner accepted the scoped exception for v1 (WCAG 1.4.10 not met at 400%; desktop, maximized window). Stated in DESIGN.md Layout & Spacing.
9. **Animated images (A-17). Resolved 2026-10-25:** owner chose to document a scoped v1 exception. Animated GIF/APNG/WebP autoplay as the browser renders them and can fail WCAG 2.2.2 when over 5 s; no pause control in v1. Reduced-motion handling for the app's own UI is unaffected.

Resolved items and the review audit trail: `review-log.md`.
