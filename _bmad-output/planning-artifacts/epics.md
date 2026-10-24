---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-file-browser-2026-10-23/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-file-browser-2026-10-23/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-file-browser-2026-10-23/EXPERIENCE.md
---

# file-browser - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for file-browser, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: When the user activates the open-folder control, the system prompts the user to choose a folder and, on confirmation, makes it the Workspace Folder. The root level is shown in the Tree; choosing a new folder replaces the previous Tree and clears the Selection.
FR2: If the user cancels the folder prompt or denies access, the system remains in its previous state and shows a brief message only when access was denied.
FR3: The system requests and uses read-only access to the Workspace Folder and never creates, modifies, renames or deletes any Entry. No interface control can write to disk.
FR4: When a Workspace Folder is chosen, the system displays its immediate children in the Tree without reading deeper. Folders sort before files; names sort alphabetically, case-insensitive. Each Entry shows an icon or glyph distinguishing folder from file kind.
FR5: When the user expands a folder, the system reads and displays only that folder's immediate children. Collapsed and never-expanded folders cause no read. Re-expanding shows contents without a visible reload.
FR6: When the user collapses an expanded folder, the system hides its descendants and retains their expansion state until Refresh or a new Workspace Folder is chosen.
FR7: When the user selects a file Entry, it becomes the only Selection and its Preview or Metadata Card is shown. Selecting a second file deselects the first. Selecting a folder toggles its expansion and does not replace the current Selection.
FR8: The user can move through the Tree, expand and collapse folders, and select files using only the keyboard; each Entry's role, name, expansion state and selected state is exposed to assistive technology. Arrow keys move focus; Enter or Space selects; a visible focus indicator exists in every Theme; the Preview Pane content is keyboard-reachable.
FR9: A control shows or hides Dotfiles; shown Dotfiles render at 60% opacity. Dotfiles are visible by default. Toggling takes effect immediately without collapsing folders or clearing a non-dotfile Selection; if the Selection is a hidden Dotfile, the Selection clears and the Preview Pane returns to its empty state. The choice persists across sessions.
FR10: If an Entry or folder cannot be read, the rest of the Tree stays usable and that Entry is marked unavailable.
FR11: While a file is the Selection, its name and Last Modified Stamp are shown in the Preview Header. The stamp includes date and time and uses a relative day label for today (e.g. "Today at 11:04 AM").
FR12: A plain-text Selection is displayed as readable monospaced text. Files up to 1 MB display in under 100 ms. Files over 1 MB display a leading portion with a visible truncation notice.
FR13: A Markdown Selection is displayed as formatted rich text (headings, lists, tables, code, links, images) with no executable content. Remote images and resources are not fetched; a placeholder marks a blocked remote resource. Links do not navigate the app away.
FR14: A Word (.docx) Selection displays its text and basic formatting. A typical document (under 5 MB) displays in under 1 s. Output contains no executable content and no remote resource is fetched. Legacy .doc files show a Metadata Card.
FR15: A PDF Selection displays its pages in the Preview Pane as a continuously scrollable sequence. Page navigation and custom zoom controls are out of scope.
FR16: A PNG, JPEG, SVG or WebP Selection is displayed scaled to fit the Preview Pane, preserving aspect ratio. Scripts embedded in an SVG do not run and its external references are not fetched. Images smaller than the pane are not enlarged.
FR17: When the Selection has no Preview, is empty (zero bytes) or cannot be rendered, a Metadata Card shows name, size, type and Last Modified. Executables, archives and unknown formats show a Metadata Card; a zero-byte file indicates it is empty. File type comes from extension and device-reported type only, with no content inspection.
FR18: If a Preview fails to render (e.g. a corrupt document), the system shows a Metadata Card with a short explanation and remains responsive.
FR19: While no Selection exists, the Preview Pane shows an inviting prompt to select a file (or to open a folder if none is open).
FR20: When the user activates Refresh, the system re-reads the Workspace Folder and the Selection from disk and updates the Tree, the Preview and the Last Modified Stamp. Expanded folders stay expanded and the Selection is kept when its Entry still exists; new and removed Entries appear or disappear in expanded folders.
FR21: If the Selection no longer exists or is unreadable after Refresh, the system clears the Selection and tells the user why.
FR22: Light, Dark and Warm Sand Themes are provided with a control to switch among them. Switching applies immediately to every surface (Tree, Preview Pane, rendered Previews) without reload and without clearing Selection or expansion state. Text and interactive elements meet WCAG 2.1 AA contrast in each Theme.
FR23: At start, the system applies the user's last chosen Theme or, if none, Light or Dark according to the device's appearance setting. The choice persists across sessions.
FR24: The Tree is on the left and the Preview Pane on the right, with the Preview Pane receiving the majority of the width. The divider between panes is resizable and each pane scrolls independently.
FR25: The system never shows sample or mock files. Before a folder is chosen it shows an open-folder prompt only.

### NonFunctional Requirements

NFR1: Initial load transfers under 150 KB of gzipped script; heavy renderers (PDF, Word) load only on first use.
NFR2: Opening a folder of about 1,000 Entries shows the Tree in under 300 ms; expanding a folder of similar size takes under 100 ms.
NFR3: Preview timing targets are those stated in FR12 (text under 100 ms) and FR14 (docx under 1 s).
NFR4: The interface stays responsive with thousands of Entries in total and up to about 2,000 Entries in any single folder. Single folders of 10,000+ Entries are not a v1 target.
NFR5: The system makes no network requests to external services and transmits no file content or metadata off the device.
NFR6: All rendered content is inert; no script from a previewed file executes.
NFR7: The system does not persist file contents; only preferences (Theme, dotfile visibility) are stored on the device.
NFR8: All controls and Previews are keyboard-operable and expose appropriate roles and states to assistive technology; contrast per FR22.
NFR9: Supported on current desktop Chrome and Edge. In an unsupported browser the app explains that it cannot open folders there.

### Additional Requirements

Brownfield baseline (no starter template): Epic 1 Story 1 builds directly on the existing React + Vite + TypeScript repo.

- AD-1: One-way layering `types ← lib ← services ← hooks ← components`. `src/lib/` is pure (no React, DOM, browser APIs); components never import `services/` and go through new `src/hooks/`.
- AD-2: Ratify and keep existing code: the `lib/ · services/ · components/` split, `categorizeFile`, `compareFileItems` (the single ordering rule), `formatSize`, `formatPath`, `isPdf`, the read-only picker call, `isFolderPickerSupported`, explicitly typed props in `types.ts`.
- AD-3: Retire `FileRow`; replace with `TreeNode` rendered by a `Tree` container (`role="tree"`, `role="treeitem"`, `role="group"`). `Tree` alone owns the roving tabindex and keyboard map. Narrow `PdfPreview` (keep `<object type="application/pdf">`, drop its `fetch()` and `countPdfPages`). Delete `MOCK_FILES` and the `selected && isPdf` branch in `App.tsx`. Prerequisite handoff: `AGENTS.md` must be amended from `listbox`/`option` to tree semantics before the first tree story is built (owner action; approved as an explicit prerequisite on that story).
- AD-4: `FileItem` is serializable pure data (`id`, `name`, `path`, `isDirectory`, optional `size`, `updatedAt`, `category`); remove `url` and `children`. `id` is the normalized relative path (`/`-separated, no leading/trailing slash, root = `''`); `path` is `/`+id. Ids are stable across reads (replaces `crypto.randomUUID()`).
- AD-5: `services/tree` is the only holder of handles, children cache, expansion set, selection id and unavailable marks, and the only writer (intent functions `openWorkspace`, `toggle`, `select`, `refresh`). React reads via `hooks/` with `useSyncExternalStore` and immutable snapshots. Replacing the Workspace Folder discards all state.
- AD-6: Listing is lazy and one level, names and kinds only (`handle.values()`); `size`/`updatedAt`/type from `getFile()` only for the Selection. A folder is read at most once until Refresh. Dotfile visibility is a view filter over cached children and never re-reads. A throwing read marks the entry unavailable.
- AD-7: `refresh()` re-reads root and every expanded folder, keeps expansion and Selection for surviving ids, clears and surfaces the FR21 message if the Selection is gone; collapsed folders are not read.
- AD-8: `resolvePreviewKind(name, mime) → PreviewKind` (`text | markdown | pdf | docx | image | metadata`) is one pure function in `lib/preview.ts`; extension, exact-name text list and device-reported `File.type`; no content sniffing; zero-byte and `.doc` resolve to `metadata`; `isPdf` is expressed through it.
- AD-9: One `PreviewPane` dispatcher maps kind to renderer; `markdown`, `docx`, `pdf` load via `React.lazy`/dynamic `import()`. Renderer contract: `PreviewSource` (`{ file: File, signal: AbortSignal }` plus metadata); renderers never receive handles or import `services/tree`. A throwing renderer shows the Metadata Card with the FR18 explanation.
- AD-10: `services/previewSession` owns one `AbortController`, the `File` read and every object URL per selection (and per Refresh of the selection); a new session aborts the previous, revokes its URLs and discards late results (latest selection wins). Only it calls `createObjectURL`/`revokeObjectURL`; replaces `App`'s `openedItems` ref and `revokeItemUrls`.
- AD-11: Every HTML-producing renderer (Markdown, DOCX) passes output through `services/sanitize` (allowlist; strips scripts, handlers, `style` attributes, off-page `src`/`href`; remote images become the "Remote image blocked" placeholder; `#anchor` links stay in-page; other links become plain text). Images render only as `<img src="blob:…">`; SVG is never inlined; no `<iframe srcdoc>`.
- AD-12: Meta CSP in `index.html` (shape: `default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; object-src blob:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'`), exact string finalized and tested against the production build. Consequences: no renderer calls `fetch()`; no inline `style` attributes (CSS classes and custom properties only). The zero-outbound-requests claim is proven by the hostile-Markdown test against `vite build` + `vite preview`, not the dev server.
- AD-13: `services/fs` is the only module referencing `FileSystem*Handle`; whitelist `showDirectoryPicker({ mode: 'read' })`, `values()`, `getDirectoryHandle()`, `getFileHandle()`, `getFile()`, `queryPermission`/`requestPermission` with `{ mode: 'read' }`. `createWritable`, `removeEntry`, `move`, `readwrite`, `FileSystemWritableFileStream` are forbidden, enforced by a grep gate in the lint step.
- AD-14: `services/prefs` persists exactly `theme` and `showDotfiles` in `localStorage`, every access in `try/catch`. Themes are CSS custom-property sets selected by `data-theme` on `<html>`; components consume tokens only. Workspace Folder, handles, paths and divider width are never persisted.
- AD-15: Initial JS under 150 KB gzipped; any dependency over about 15 KB gzipped is imported only through dynamic `import()` from a renderer; budget checked against `vite build` output in each story that adds a dependency; never recovered by dropping keyboard or screen-reader support.
- Conventions: components `PascalCase.tsx`; hooks `useThing.ts` in `hooks/`; one renderer per `components/preview/<Kind>Preview.tsx`; shared and prop types (`PreviewKind`, `PreviewSource`) in `src/types.ts`; UX strings from `EXPERIENCE.md` Voice and Tone, never raw error text; errors are typed outcomes (`unavailable`, `renderFailed`), not thrown into the UI.
- Verification: `npm run build` and `npm run lint` pass before any commit; `lib/` functions get Vitest unit tests (runner added by the first story that needs it); `lib/` functions carry JSDoc `@param`/`@returns`; no icon library (inline SVG only); read-only and no-backend policies from `AGENTS.md`.
- Dependencies deliberately unpinned (Markdown parser, DOCX converter, sanitizer): the story adding each renderer selects and verifies versions and measures bundle impact.
- Deferred and out of v1: virtualized tree, live change detection, remembering the last Workspace Folder, divider persistence.

### UX Design Requirements

UX-DR1: Implement the design tokens as CSS custom properties: three theme blocks `:root[data-theme="light|dark|sand"]` defining the same 18 color roles (`--color-bg`, `surface`, `surface-raised`, `row-hover`, `row-selected`, `border`, `border-strong`, `text`, `text-muted`, `accent`, `on-accent`, `focus-ring`, `notice-bg/-text/-border`, `danger-text`, `code-bg`, `placeholder-bg`), plus `:root` typography (`--font-<name>-*`), radius (`--radius-*`) and spacing (`--space-*`, `--size-*`) variables; set `color-scheme` per theme; no component CSS branches on theme.
UX-DR2: Typography uses system font stacks only (no web fonts); sizes authored in `rem`; `tabular-nums` for sizes and dates; Markdown/DOCX headings scale from heading-lg (h1) to ui-body bold (h5–h6); prose capped at 760px and left-aligned.
UX-DR3: Toolbar (min-height 2.75rem, `surface-raised`, bottom hairline): Open folder button, Workspace Folder name (truncating), spacer, Hidden files toggle, Refresh, theme control. Wraps rather than clips at 200% zoom. Refresh disabled with no folder; Hidden files and theme usable with no folder.
UX-DR4: Tree row visuals: 28px min-height (rem), 16px indent per level, chevron (folders only, rotates 90° when expanded), kind glyph, label; hover `row-hover`; selected `row-selected` plus a 3px `accent` `border-inline-start` bar; 2px inset focus ring; long names truncate with ellipsis and full-name `title`.
UX-DR5: Dotfile dimming: `opacity: 0.6` on the kind glyph and name label only, at rest only (1.0 on hover/selected), per element (not compounding through nesting); never on row background, the Unavailable suffix and warning glyph, or placeholder child rows. Scope is any name starting with "." and nothing else; no hardcoded names.
UX-DR6: Unavailable-entry row: warning glyph plus "Unavailable" suffix in caption/`danger-text` (label stays `text`); accessible description "Unavailable, can't be read" via `aria-describedby`; unavailable folder expanded shows child row "This folder can't be read."
UX-DR7: Tree placeholder child rows ("Empty folder", "No visible files", "Loading...", "This folder can't be read.") are `role="treeitem"` with `aria-disabled="true"`, no `aria-expanded`, reachable with Up/Down, never selectable. "Loading..." and the spinner glyph appear only after 150 ms.
UX-DR8: Tree ARIA: `role="tree"` named "File tree"; folder rows `aria-expanded`, `aria-level`, `aria-setsize`, `aria-posinset` and no `aria-selected`; file rows `aria-selected` true/false plus level/setsize/posinset; roving tabindex invariant of exactly one `tabIndex=0` row, repaired immediately on any rebuild by the specified priority order (current row, nearest surviving ancestor or previous row, selected row, first row).
UX-DR9: Tree keyboard map: Up/Down; Right (expand, or move to first child, or placeholder row); Left (collapse, or move to parent); Enter/Space (select file, toggle folder); Home/End; PageUp/PageDown by visible page; type-ahead (characters accumulate within 500 ms); Tab leaves the Tree. Click focuses and activates. Selecting never moves focus out of the Tree.
UX-DR10: Divider: focusable `role="separator"` with `aria-orientation="vertical"`, `aria-valuenow/min/max` in pixels, `aria-valuetext`, `aria-controls` the Tree pane, label "Resize file tree"; 12px hit area overlaying the pane edge without covering the tree scrollbar; grip (3×32px, `border-strong`) visible at rest; hover/drag turn `accent`; keys Left/Right 16px, Shift 64px, Home/End to min/max, Enter or double-click resets to 280px; clamped to min 220px, max 480px or 40% of window (min wins), preview never under 320px; `aria-valuemax` recomputed on window resize and never below min. Width not persisted.
UX-DR11: Preview Header (shown only while a file is selected): kind glyph, file name as `h2` (truncating) and "Modified {when}" in a `<time datetime>` element in caption/`text-muted`; formats "Today at 11:04 AM", "Yesterday at 4:30 PM", "Oct 21, 2026 at 3:12 PM".
UX-DR12: Preview Pane region: `role="region"` with `aria-labelledby` the header file name; `tabindex="0"` only while a file is selected or its content scrolls; static label and no tab stop in prompt/empty states. Tab order: toolbar, Tree, divider, Preview Pane. 24px side gutter; media fills pane width. Preview scroll position is preserved on Refresh when the path is unchanged.
UX-DR13: Text preview: monospace on `code-bg`, standard soft wrap, recognized by extension or by the exact case-sensitive name list (Makefile, Dockerfile, LICENSE, README, `.gitignore`, `.editorconfig`, any `.env*`, and the rest of the EXPERIENCE.md seed list); other extensionless files get a Metadata Card.
UX-DR14: Truncation banner: pinned above text (and Markdown) content over 1 MB, not dismissible, `notice-*` colors, info glyph, 1px `notice-border`, string "Showing the first 1 MB of {size}. The rest of the file isn't shown."; static, not a live region.
UX-DR15: Markdown/DOCX rendering: real headings, lists and tables; every link underlined (1px `accent`, offset 2px) in all themes; blocked remote links render as plain non-focusable text; `#anchor` links scroll within the pane; blocked remote images become the placeholder (`placeholder-bg`, 1px dashed `border-strong`, image-off glyph, min 120×48px, "Remote image blocked" plus alt-text caption, accessible name "Remote image blocked").
UX-DR16: Image preview: `<img>` scaled to fit, aspect ratio kept, never enlarged past native size, alt text is the file name; animated images autoplay (documented WCAG 2.2.2 exception). PDF preview: continuous scroll in a focusable container, no page or zoom controls.
UX-DR17: Metadata Card: centered, 420px, `surface-raised`, `border-strong` outline, `rounded.lg`; 48px kind glyph, file name `h2` in heading-md, definition list (Size, Type, Last modified; labels caption/`text-muted`, values monospace), optional explanation line. Type strings per the EXPERIENCE.md map (Word document, PDF document, Archive, Binary file, Audio file, Video file, "XYZ file", "File"). Explanation strings: "No preview is available for this type of file.", "This file is empty." (Size "0 bytes"), "Legacy .doc files can't be previewed. Only .docx is supported.", "This file couldn't be previewed. It may be damaged or in an unexpected format."
UX-DR18: File-kind glyph set of seven inline SVGs (folder, generic file, image, document, pdf, text, binary), 16px in rows/header and 48px in the card, `currentColor`, 1.5px stroke, `aria-hidden`, distinguished by shape not color, with the kind-per-extension mapping from EXPERIENCE.md; plus blocked-resource, warning, info, eye/eye-slash, sun, moon, dune, check and spinner glyphs. No icon library.
UX-DR19: Empty states (centered column: 48px outline glyph, heading-lg title, ui-body secondary, optional primary button): open-folder prompt ("Open a folder to start browsing." / "Files are read in this browser tab. Nothing is uploaded, and nothing is ever changed." / "Open folder"); select-a-file prompt; empty root folder ("This folder is empty."); empty root with dotfiles hidden ("Nothing to show." / "Hidden files are turned off."); child rows "Empty folder" and "No visible files".
UX-DR20: Hidden files toggle: button with constant accessible name "Hidden files", `aria-pressed` true = shown (default), description "Pressed: hidden files are shown." via `aria-describedby`, eye/eye-slash glyph plus visible state word "Shown"/"Hidden" (`aria-hidden`), pressed state also fills `row-selected`; roving-tabindex repair on every toggle; hiding while a hidden row is focused moves focus to the nearest visible previous row or the parent.
UX-DR21: Theme control: `role="radiogroup"` labeled "Theme", three joined segments (Light, Dark, Warm Sand) as one tab stop with arrow-key selection; active segment `accent` fill with `on-accent` text, check glyph and `aria-checked`; fixed segment width sized for the longest label; sun/moon/dune glyphs. Default theme from `prefers-color-scheme` (Light or Dark, never Warm Sand).
UX-DR22: Persistent visually hidden polite `role="status"` live region carrying all announcements per the EXPERIENCE.md table (Opened {name}; Previewing {name}; {name}: no preview available; Loading preview...; Selection cleared; Refreshing...; Refreshed.; FR21 selection-missing string; access-denied string also mirrored in `role="alert"`); re-announce identical strings by clearing then setting on the next frame; announce previews on activation, never on arrow moves.
UX-DR23: Notices: access-denied message shown once inline under the toolbar, dismissed on next action ("Access to that folder wasn't granted. Choose a folder to try again."), cancel is silent; selection-missing notice shown as a status message above the select-a-file prompt until the next selection.
UX-DR24: Focus management: after a folder is chosen focus moves to the first Tree row (not auto-selected), or to the Open folder button for an empty folder; cancel/denied returns focus to Open folder; Refresh keeps focus on the Refresh button (`aria-busy` while running, label unchanged); previews never steal focus; 2px `focus-ring` outline with 1px offset on every focusable element in every theme.
UX-DR25: Unsupported-browser screen replaces the whole app (no toolbar or panes): `bg` background, 480px column, `h1` "This browser can't open folders." and body "file-browser needs folder access, which is available in current desktop Chrome and Edge. Open this page in one of those to continue.", within a single `<main>`.
UX-DR26: Page structure: `<html lang="en">`; document title "file-browser" plus the Workspace Folder name once open; `<header>` toolbar; `<main>` for the Preview Pane; visually hidden `h1` "file-browser"; Preview Header and Metadata Card names are `h2`.
UX-DR27: Motion and forced colors: only 120ms color/opacity transitions; `prefers-reduced-motion` removes all transitions and animations (static spinner, instant chevron, no smooth scroll); `@media (forced-colors: active)` maps to system colors (selected bar as a real `border-inline-start` plus 1px `Highlight` outline, active theme segment 2px `Highlight` border plus check, `CanvasText` divider/banner/placeholder borders, `GrayText` disabled, dotfile opacity reset to 1).
UX-DR28: Layout: two independently scrolling panes under a full-width toolbar; default tree width 280px; layout holds at 200% zoom with no page-level horizontal scroll (toolbar wraps, folder name truncates first); 400% reflow is a documented, accepted exception.
UX-DR29: Contrast: every text/background and UI pair in the DESIGN.md verification table meets WCAG 2.1 AA in all three themes; re-verify whenever a token changes (thin margins: Sand dotfile rest 4.55, Dark `notice-border`/`notice-bg` 3.06, Dark `text-muted`/`row-selected` 4.61).
UX-DR30: No shadows, gradients, blur, modals or popovers; no write, rename, delete or upload affordances; no auto-refresh; no outbound links that navigate away; no hover-only affordances.

### FR Coverage Map

FR1: Epic 1 - Choose a Workspace Folder
FR2: Epic 1 - Cancelled or denied access
FR3: Epic 1 - Read-only access
FR4: Epic 1 - Root level shown immediately, sorted
FR5: Epic 1 - Lazy folder expansion
FR6: Epic 1 - Collapse retains expansion state
FR7: Epic 1 - Single selection
FR8: Epic 1 - Keyboard operation and ARIA tree semantics
FR9: Epic 1 - Dotfile toggle, 60% dimming, persisted
FR10: Epic 1 - Unreadable entries marked unavailable
FR11: Epic 2 - Preview Header and Last Modified Stamp
FR12: Epic 2 - Text preview and 1 MB truncation
FR13: Epic 3 - Markdown preview, inert
FR14: Epic 3 - Word (.docx) preview
FR15: Epic 3 - PDF preview
FR16: Epic 2 - Image preview
FR17: Epic 2 - Metadata Card fallback
FR18: Epic 2 - Render failure handling
FR19: Epic 1 and Epic 2 - Select-a-file prompt (introduced in Story 1.4; pane region semantics in Story 2.1)
FR20: Epic 4 - Manual Refresh
FR21: Epic 4 - Selection missing after Refresh
FR22: Epic 5 - Three Themes and switch control
FR23: Epic 5 - Default and remembered Theme
FR24: Epic 1 - Two-pane layout and resizable divider
FR25: Epic 1 - No mock content, open-folder prompt

## Epic List

### Epic 1: Open a folder and navigate it
You pick a local folder, see it in a fast, lazy, keyboard-accessible tree beside a resizable pane, and can hide dotfiles. Includes the brownfield rework (layering and `hooks/`, path-based `FileItem` ids, tree store, `Tree`/`TreeNode` replacing `FileRow`, mock removal, design tokens, unsupported-browser screen), the AGENTS.md tree-semantics prerequisite and the Vitest runner.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR24, FR25

### Epic 2: Preview text, images and fallbacks
You select a file and immediately see text, an image or a Metadata Card, with a Preview Header and Last Modified stamp; the pane is never blank. Includes the kind resolver, dispatcher, preview session and empty/prompt states.
**FRs covered:** FR11, FR12, FR16, FR17, FR18, FR19

### Epic 3: Read Markdown, Word and PDF safely
You preview formatted Markdown, .docx and PDF, and previewed content cannot run scripts or make network requests. Includes the sanitizer, meta CSP, lazy-loaded renderers, bundle-budget checks, narrowed `PdfPreview` and the hostile-Markdown zero-request proof.
**FRs covered:** FR13, FR14, FR15

### Epic 4: Refresh to see what changed
You press Refresh after an agent edits files and the tree, preview and timestamp update, keeping expansion and selection; a removed file clears with a clear message.
**FRs covered:** FR20, FR21

### Epic 5: Choose a theme and meet the quality bar
You switch among Light, Dark and Warm Sand and the choice is remembered. Includes the final accessibility and contrast audit, forced colors, reduced motion and the SM-1 to SM-4 verification walkthroughs.
**FRs covered:** FR22, FR23

## Epic 1: Open a folder and navigate it

You pick a local folder, see it in a fast, lazy, keyboard-accessible tree beside a resizable pane, and can hide dotfiles. Covers the brownfield rework: layering and `hooks/`, path-based `FileItem` ids, the tree store, `Tree`/`TreeNode` replacing `FileRow`, mock removal and design tokens.

### Story 1.1: App shell, design tokens and unsupported-browser screen

As a developer opening file-browser,
I want a calm, correctly structured two-pane window, or a clear explanation if my browser can't open folders,
So that I know immediately whether the app works for me and trust its look from the first frame.

**Acceptance Criteria:**

**Given** the app loads in a browser that supports folder access (`isFolderPickerSupported`)
**When** the first frame renders
**Then** a full-width `<header>` toolbar region sits above two panes: a left tree pane and a right `<main>` preview pane (FR24, UX-DR26, UX-DR28)
**And** each pane scrolls independently and the preview pane receives the majority of the width at the default tree width of 280px
**And** the page has `<html lang="en">`, the document title "file-browser" and a visually hidden `h1` "file-browser" (UX-DR26)

**Given** the stylesheet is loaded
**When** I inspect `:root`
**Then** three blocks `:root[data-theme="light"]`, `[data-theme="dark"]` and `[data-theme="sand"]` each define the same 18 `--color-*` roles with the exact hex values from `DESIGN.md`, plus `color-scheme` per theme (UX-DR1)
**And** `--font-<name>-*`, `--radius-*`, `--space-*` and `--size-*` variables are defined at `:root` (UX-DR1)
**And** component CSS references only role variables, never hex values and never theme-specific selectors (AD-14)

**Given** no stored theme preference exists
**When** the app starts
**Then** `data-theme` on `<html>` is set to `light` or `dark` from `prefers-color-scheme` and is never `sand` by default (FR23, UX-DR21)
**And** if `localStorage` is unavailable or throws, the app still renders with that default and shows no error (AD-14)

**Given** the stylesheet uses system font stacks
**When** the page loads
**Then** no web font, CDN stylesheet or other network request is made (UX-DR2, NFR5)
**And** font sizes are authored in `rem`, and sizes and dates use `font-variant-numeric: tabular-nums` (UX-DR2)

**Given** the app is loaded in a browser without `showDirectoryPicker`
**When** the first frame renders
**Then** the toolbar and panes are replaced by a single `<main>` with an `h1` "This browser can't open folders." and the body text from `EXPERIENCE.md`, in a 480px column on `bg` (NFR9, UX-DR25)
**And** no actions or controls are shown on that screen

**Given** any component CSS in the app shell
**When** reviewed
**Then** there are no shadows, gradients, blur, modals or popovers, and transitions are limited to 120 ms colour or opacity (UX-DR30, UX-DR27)
**And** `prefers-reduced-motion: reduce` removes all transitions and animations (UX-DR27)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, and `git status` shows only files in the stated scope

### Story 1.2: Open a folder and see its top level

As a developer,
I want to open a local folder read-only and see its top level in a tree,
So that I can start browsing my project without any risk to my files.

**Prerequisite (owner action, blocks this story):** `AGENTS.md` is amended from `role="listbox"`/`role="option"` to the tree semantics (`role="tree"`, `role="treeitem"`, `role="group"`) before this story starts (AD-3 handoff).

**Acceptance Criteria:**

**Given** the app is in a supported browser with no folder open
**When** I look at the preview pane
**Then** I see only the open-folder prompt: title "Open a folder to start browsing.", body "Files are read in this browser tab. Nothing is uploaded, and nothing is ever changed." and an "Open folder" primary button (FR25, UX-DR19)
**And** no sample or mock file appears anywhere, `MOCK_FILES` is deleted, and the tree pane is empty

**Given** the toolbar
**When** I look at it
**Then** it contains the Open folder button (inline-SVG glyph, `border-strong` outline) and the Workspace Folder name area, and no control that does not yet work (UX-DR3)

**Given** I activate Open folder
**When** the picker opens
**Then** it is called with `showDirectoryPicker({ mode: 'read' })` and no write permission is requested (FR3, AD-2, AD-13)
**And** `services/fs` is the only module that references `FileSystem*Handle`, and a grep gate in the lint step fails the build on `createWritable`, `removeEntry`, `move`, `readwrite` or `FileSystemWritableFileStream` (AD-13)

**Given** I confirm a folder
**When** access is granted
**Then** the root level is read in exactly one `handle.values()` pass recording only `name` and `kind`, with no `getFile()` call (FR1, FR4, AD-6)
**And** the Tree shows the immediate children sorted folders first, then case-insensitive natural order via `compareFileItems` (FR4, AD-2)
**And** the Workspace Folder name appears in the toolbar and in the document title
**And** a folder of about 1,000 entries appears in under 300 ms (NFR2)

**Given** a Workspace Folder is already open
**When** I choose a different folder
**Then** the previous Tree, expansion state and Selection are discarded entirely (FR1, AD-5)

**Given** I cancel the picker
**When** it closes
**Then** the previous state is unchanged, no message is shown and focus returns to the Open folder control (FR2, UX-DR24)

**Given** I deny access
**When** the picker rejects with a permission error
**Then** the previous state is retained and the message "Access to that folder wasn't granted. Choose a folder to try again." appears inline under the toolbar, mirrored to a `role="alert"`, and is dismissed on my next action (FR2, UX-DR23)

**Given** the folder has been opened
**When** the tree renders
**Then** it is a `Tree` container with `role="tree"` named "File tree", whose rows are `TreeNode` components with `role="treeitem"`, `aria-level`, `aria-setsize` and `aria-posinset` (AD-3, UX-DR8)
**And** `FileRow.tsx` is deleted and `Tree` is the only owner of roving tabindex, with exactly one row at `tabIndex=0` (AD-3)
**And** focus moves to the first Tree row without selecting it; if the folder is empty, focus moves to the Open folder button and the pane reads "This folder is empty." / "There are no files here to show." (UX-DR24, UX-DR19)

**Given** each row
**When** it renders
**Then** it shows a chevron (folders only), a kind glyph and a label, where the glyph comes from the seven-glyph inline-SVG set (folder, generic file, image, document, pdf, text, binary) mapped by extension per `EXPERIENCE.md`; glyphs are `aria-hidden`, `currentColor` and 16px, and no icon library is installed (UX-DR18)

**Given** the architecture layering
**When** the code is reviewed
**Then** `FileItem` is pure data with `id`, `name`, `path`, `isDirectory` and optional `size`, `updatedAt`, `category`; `url` and `children` are removed and `id` is the normalized relative path (`/`-separated, no leading or trailing slash, root `''`), identical across repeated reads (AD-4)
**And** `services/tree` holds all handles and state and exposes `openWorkspace`, and `hooks/useTree` exposes it through `useSyncExternalStore`; components never import `services/` (AD-1, AD-5)
**And** `App`'s `openedItems` ref and eager `createObjectURL` for PDFs are removed from the list-time path (AD-6, AD-10)

**Given** a folder is chosen
**When** the choice completes
**Then** a persistent visually hidden `role="status"` region announces "Opened {name}" (UX-DR22)

**Given** this story adds pure `lib/` logic
**When** I run the tests
**Then** Vitest is installed and configured with an `npm test` script, and unit tests cover id normalization and `compareFileItems` ordering, with JSDoc `@param`/`@returns` on every `lib/` function (AD-2, AD-4, conventions)
**And** `npm run build` and `npm run lint` pass and `git status` shows only intended files

### Story 1.3: Expand and collapse folders

As a developer inspecting a workspace,
I want to expand a folder and see only its immediate children,
So that big repositories stay fast and I only load what I look at.

**Acceptance Criteria:**

**Given** a Workspace Folder is open and a folder row is collapsed
**When** I click it, or press Enter, Space or Right on it
**Then** only that folder's immediate children are read and shown, sorted folders-first and case-insensitive via `compareFileItems` (FR5, FR4, AD-6)
**And** no `getFile()` is called for any child at list time
**And** the row exposes `aria-expanded="true"`, its children sit in a `role="group"`, and its chevron rotates 90° (UX-DR4, UX-DR8)
**And** children are indented 16px per level (UX-DR4)

**Given** collapsed or never-expanded folders
**When** the tree is idle
**Then** their contents are never read (FR5)

**Given** a folder was expanded and then collapsed
**When** I expand it again
**Then** the cached children show with no disk read and no loading indicator (FR5, AD-6)

**Given** a folder with expanded subfolders is collapsed and re-expanded
**When** it reopens
**Then** the subfolders keep their previous expansion state until a new Workspace Folder is chosen (FR6, AD-5)

**Given** a folder read takes longer than 150 ms
**When** the read is still pending
**Then** the chevron swaps to a spinner and a "Loading..." child row appears (`role="treeitem"`, `aria-disabled="true"`); reads under 150 ms show neither (UX-DR7)
**And** under `prefers-reduced-motion` the spinner is a static glyph and the chevron rotates instantly (UX-DR27)

**Given** an expanded folder has no children
**When** it opens
**Then** a muted "Empty folder" placeholder row is shown (UX-DR7, UX-DR19)
**And** placeholder rows have no `aria-expanded`, are never selectable and are reachable with Up/Down once keyboard navigation exists

**Given** a folder of about 1,000 entries
**When** I expand it
**Then** the children render in under 100 ms (NFR2)
**And** a workspace with thousands of entries in total and up to about 2,000 in one folder stays responsive (NFR4)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, `lib/` additions have unit tests and `git status` shows only intended files

### Story 1.4: Select a file

As a developer,
I want to select a file and see clearly which one is selected,
So that I always know what the preview pane is about.

**Acceptance Criteria:**

**Given** the tree is open
**When** I click a file row, or press Enter or Space on it
**Then** it becomes the only Selection, held as a single id in `services/tree` and changed only via the `select` intent (FR7, AD-5)
**And** its `aria-selected="true"` and every other file row has `aria-selected="false"` (UX-DR8)
**And** focus stays on the row (UX-DR24)

**Given** a file is selected
**When** I select a second file
**Then** the first is deselected and only the second is selected (FR7)

**Given** a selected row
**When** it renders
**Then** it has the `row-selected` fill and a 3px `accent` bar implemented as `border-inline-start`, so selection is never colour-only (UX-DR4)
**And** hovered rows use `row-hover` and the focus ring is 2px, inset, in `focus-ring` (UX-DR4, UX-DR24)

**Given** a file is selected
**When** I activate a folder row
**Then** the folder toggles and the file Selection is unchanged (FR7, AD-5)
**And** folder rows never carry `aria-selected` (UX-DR8)

**Given** a file is activated
**When** the selection changes
**Then** the status region announces "Previewing {name}" (UX-DR22)

**Given** a folder is open and no file is selected
**When** I look at the preview pane
**Then** it shows the prompt "Select a file to preview it." with the secondary line "Folders open in the tree on the left." (FR19, UX-DR19)
**And** the prompt is introduced here so that clearing a Selection (Story 1.7, Epic 4) always has a state to return to; before any folder is open the pane still shows only the open-folder prompt (FR25)

**Given** previews are not built yet
**When** a file is selected
**Then** the preview pane keeps showing the prompt and nothing breaks; the Selection state is available to the preview work in Epic 2 through `useTree`

**Given** a different Workspace Folder is chosen
**When** it opens
**Then** the Selection is cleared (FR1, AD-5)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 1.5: Navigate the tree by keyboard

As a keyboard or screen-reader user,
I want to move through, expand and select entries using only the keyboard,
So that I can use the whole tree without a mouse.

**Acceptance Criteria:**

**Given** the tree has rows
**When** I inspect tab stops
**Then** exactly one row has `tabIndex=0` and all others `-1`, owned solely by the `Tree` container (AD-3, UX-DR8)
**And** when Tab enters the tree from outside it lands on the last-focused row, else the selected row, else the first (UX-DR8)

**Given** focus is in the tree
**When** I press Up or Down
**Then** focus moves to the previous or next visible row, including placeholder rows (FR8, UX-DR9)

**Given** focus is on a collapsed folder
**When** I press Right
**Then** it expands; if already expanded, focus moves to its first child, or to its placeholder row when empty (UX-DR9)
**And** Right on a file or placeholder does nothing

**Given** focus is on an expanded folder
**When** I press Left
**Then** it collapses; otherwise focus moves to the parent folder, and on a root-level row with no parent nothing happens (UX-DR9)

**Given** focus is on a file or folder
**When** I press Enter or Space
**Then** a file is selected and a folder toggles, and the page does not scroll on Space (FR7, FR8)

**Given** focus is in the tree
**When** I press Home, End, PageUp or PageDown
**Then** focus jumps to the first or last visible row, or moves by one visible page of rows, clamped at the ends (UX-DR9)

**Given** focus is in the tree
**When** I type printable characters
**Then** focus jumps to the next visible row whose name starts with the typed characters, and characters typed within 500 ms accumulate (UX-DR9)

**Given** the tab order
**When** I press Tab and Shift+Tab
**Then** order is toolbar controls, then the Tree, then the divider (once present), then the Preview Pane; Tab leaves the tree rather than moving between rows (UX-DR9, UX-DR12)

**Given** the tree is rebuilt by a new folder, expansion changes or any future rebuild
**When** the previously focused row no longer exists
**Then** the tab stop is repaired immediately by priority: the current row if it survives, else its nearest surviving ancestor or previous visible row, else the selected row, else the first row; with no rows there is no tab stop (UX-DR8)

**Given** every focusable element
**When** it receives focus in any theme
**Then** a visible 2px `focus-ring` outline appears (FR8, UX-DR24)
**And** each row exposes role, name, `aria-expanded` and `aria-selected` to assistive technology (FR8, NFR8)

**Given** this story adds pure `lib/` logic (for example type-ahead matching or next-row calculation)
**When** I run the tests
**Then** it has unit tests and JSDoc, and `npm run build` and `npm run lint` pass

### Story 1.6: Unreadable entries stay contained

As a developer,
I want an unreadable file or folder to be marked and the rest of the tree to keep working,
So that one permissions problem never blocks me from browsing the rest of the project.

**Acceptance Criteria:**

**Given** reading an entry or a folder's children throws
**When** the error is caught in `services/tree`
**Then** that entry is marked "unavailable" in the store as a typed outcome and the error is not thrown into the UI (FR10, AD-5, AD-6)
**And** every other row remains interactive

**Given** an unavailable row
**When** it renders
**Then** the label stays in `text`, followed by a warning glyph and an "Unavailable" suffix in caption `danger-text` (UX-DR6)
**And** the row's accessible description reads "Unavailable, can't be read" via `aria-describedby`, and the visible label begins the accessible name (UX-DR6)
**And** the suffix and glyph meet 4.5:1 on `surface`, `row-hover` and `row-selected` in every theme

**Given** an unavailable folder
**When** I expand it
**Then** a placeholder child row "This folder can't be read." is shown and the chevron does not spin indefinitely (UX-DR6, UX-DR7)

**Given** an unavailable row
**When** the status changes
**Then** no alert is raised and focus is not moved (UX-DR6)

**Given** a read failure occurs
**When** I continue to expand, collapse and select other entries
**Then** the tree behaves normally (FR10)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 1.7: Hide and show dotfiles

As a developer,
I want dotfiles visible but visually quiet, and a toggle to hide them,
So that I can see my project's real structure or focus on the files that matter.

**Acceptance Criteria:**

**Given** a folder containing dotfiles and no stored preference
**When** the tree renders
**Then** dotfiles are shown by default, and dim to `opacity: 0.6` on the kind glyph and name label only, at rest only (FR9, UX-DR5)
**And** a dotfile is any entry whose name begins with "." (file or folder), with no hardcoded names such as `node_modules`
**And** the row background, the "Unavailable" suffix and glyph, and placeholder rows are never dimmed; hovered and selected dotfile rows are at full opacity; opacity is per element and does not compound through nested folders (UX-DR5)

**Given** the toolbar
**When** it renders
**Then** a "Hidden files" toggle button is present with a constant accessible name, `aria-pressed="true"` meaning shown, an eye or eye-slash glyph and a visible "Shown" / "Hidden" word marked `aria-hidden` (UX-DR20)
**And** `aria-describedby` text reads "Pressed: hidden files are shown." and the pressed state also fills `row-selected` (UX-DR20)
**And** the control is usable even when no folder is open

**Given** I toggle the control
**When** hiding is turned on
**Then** dotfiles disappear from the already-cached children immediately, with no disk re-read, and no folder collapses (FR9, AD-6)
**And** a non-dotfile Selection is kept

**Given** the Selection is a dotfile, or inside a dotfile folder
**When** I hide dotfiles
**Then** the Selection clears, the preview pane returns to its prompt, and the status region announces "Selection cleared" with no visible message (FR9, UX-DR20, UX-DR22)

**Given** dotfiles are hidden
**When** a root has only dotfiles, or an expanded folder has only dotfiles
**Then** the pane shows "Nothing to show." / "Hidden files are turned off." for the root and the child row reads "No visible files" for a subfolder (UX-DR19, UX-DR7)

**Given** the toggle changes
**When** a focused row disappears
**Then** focus moves to the nearest visible previous row, else the parent; when focus was on the toolbar button it stays there, and the roving tab stop is repaired (UX-DR20, UX-DR8)

**Given** I change the toggle
**When** I reload the app
**Then** `services/prefs` has persisted exactly `showDotfiles` in `localStorage` inside `try/catch`, and the app restores it; if storage is unavailable it works with the default shown and no error (FR9, NFR7, AD-14)
**And** no folder name, path or file content is ever written to storage (NFR7, AD-14)

**Given** forced-colors mode
**When** dotfile rows render
**Then** opacity is reset to 1 (UX-DR27)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, `lib/` additions have unit tests, and `git status` shows only intended files

### Story 1.8: Resize the panes

As a developer,
I want to resize the tree and preview panes with the mouse or keyboard,
So that I can give the layout the width I need for my files.

**Acceptance Criteria:**

**Given** the two-pane layout
**When** it renders
**Then** a divider with a 12px hit area overlays the pane edge without covering the tree scrollbar, with a 1px `border` line and a 3×32px grip in `border-strong` drawn at rest (FR24, UX-DR10)
**And** the cursor is `col-resize` on hover

**Given** the divider
**When** I inspect it
**Then** it is a focusable `role="separator"` with `aria-orientation="vertical"`, `aria-valuenow/min/max` in pixels, `aria-valuetext` such as "280 pixels", `aria-controls` the tree pane and `aria-label` "Resize file tree" (UX-DR10, NFR8)

**Given** I drag the divider
**When** I move the pointer
**Then** the tree width follows, clamped to no less than 220px, no more than 480px or 40% of the window (whichever is smaller), and the preview never narrower than 320px; the minimums win in narrow windows (UX-DR10)
**And** the line and grip turn `accent` during hover and drag

**Given** the divider has focus
**When** I press Left or Right
**Then** the width changes by 16px, or 64px with Shift; Home and End jump to the minimum and maximum; Enter, or a double-click, resets to 280px (UX-DR10)
**And** the focus ring is 2px around the grip

**Given** the window is resized
**When** the window width changes
**Then** `aria-valuemax` is recomputed and is never less than `aria-valuemin` (UX-DR10)

**Given** the tab order
**When** I press Tab from the tree
**Then** focus reaches the divider before the preview pane (UX-DR12)

**Given** the divider width changes
**When** I reload the app
**Then** the width returns to the default, since divider width is not persisted (AD-14, NFR7)
**And** the width is applied through a CSS custom property or class, not an inline `style` attribute (AD-12)

**Given** forced-colors mode
**When** the divider renders
**Then** its line and grip use `CanvasText` borders (UX-DR27)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, clamp logic in `lib/` has unit tests, and `git status` shows only intended files

## Epic 2: Preview text, images and fallbacks

You select a file and immediately see text, an image or a Metadata Card, with a Preview Header and Last Modified stamp; the pane is never blank. Covers the kind resolver, the preview dispatcher, the preview session and the empty and prompt states.

### Story 2.1: See a selected file's details

As a developer,
I want to select a file and see its name, when it last changed, and its details,
So that I can identify what a file is even when it has no rendered preview.

**Acceptance Criteria:**

**Given** a Workspace Folder is open and no file is selected
**When** I look at the preview pane
**Then** I still see the prompt from Story 1.4, "Select a file to preview it." with "Folders open in the tree on the left." (FR19, UX-DR19)
**And** before any folder is open the pane shows only the open-folder prompt from Story 1.2 (FR19)
**And** in these states the pane has a static label and is not a tab stop (UX-DR12)

**Given** `lib/preview.ts`
**When** I call `resolvePreviewKind(name, mime)`
**Then** it returns one of `text | markdown | pdf | docx | image | metadata` using the extension, the exact-name text list from `EXPERIENCE.md` and the device-reported `File.type`, with no content sniffing (AD-8, FR17)
**And** `.doc` resolves to `metadata`, zero-byte files resolve to `metadata`, unknown or extensionless names not on the text list resolve to `metadata`, and `isPdf` is expressed through it (AD-8)
**And** `PreviewKind` and `PreviewSource` are exported from `src/types.ts` (conventions)
**And** the function is pure, has JSDoc `@param`/`@returns` and unit tests for each kind, the exact-name list (case-sensitive, any `.env*` name), device-reported MIME fallbacks and the zero-byte case

**Given** the tree glyphs from Story 1.2
**When** this story is complete
**Then** the tree kind glyph and the Metadata Card glyph both derive from `resolvePreviewKind` and the extension map in `EXPERIENCE.md` rather than a separate mapping, so the two cannot disagree (AD-8, UX-DR18)

**Given** I select a file
**When** the Selection changes
**Then** `services/previewSession` opens a session that owns one `AbortController`, the `File` read and any object URLs, and aborts the previous session first (AD-10)
**And** `size`, `updatedAt` and type are read through `getFile()` only for the Selection, never for other entries (AD-6)
**And** a result that arrives after a newer selection is discarded (AD-10)

**Given** the dispatcher
**When** a session is ready
**Then** a single `PreviewPane` component selects a renderer by `PreviewKind` and passes it a `PreviewSource` (`{ file, signal }` plus metadata), never a handle, and renderers do not import `services/tree` (AD-9, AD-1)
**And** `text`, `markdown`, `pdf`, `docx` and `image` kinds render the Metadata Card until their stories land, so no state is blank

**Given** a file is selected
**When** the Preview Header renders
**Then** it shows the kind glyph, the file name as an `h2` (truncating with ellipsis) and "Modified {when}" in a `<time datetime>` element in caption `text-muted` (FR11, UX-DR11)
**And** the stamp reads "Today at 11:04 AM" for today, "Yesterday at 4:30 PM" for yesterday and "Oct 21, 2026 at 3:12 PM" for older dates (FR11, UX-DR11)
**And** the formatter is a pure `lib/` function with unit tests for today, yesterday, older and midnight boundaries
**And** the header is shown only while a file is selected

**Given** a selected file without a preview
**When** the Metadata Card renders
**Then** it is centered, 420px wide, on `surface-raised` with a `border-strong` outline and `rounded.lg`, showing a 48px kind glyph, the name as an `h2`, and a definition list with Size, Type and Last modified (labels caption `text-muted`, values monospace) (FR17, UX-DR17)
**And** Size uses `formatSize`, Type uses the strings from `EXPERIENCE.md` (for example "Word document", "PDF document", "Archive", "Binary file", "Audio file", "Video file", "XYZ file", "File") from extension and device-reported type only (FR17, UX-DR17)
**And** executables, archives and unknown formats show "No preview is available for this type of file."

**Given** a zero-byte file
**When** it is selected
**Then** the card shows "This file is empty.", Size reads "0 bytes" and the Last modified value matches the header stamp (FR17, UX-DR17)

**Given** a legacy `.doc` file
**When** it is selected
**Then** the card shows "Legacy .doc files can't be previewed. Only .docx is supported." (FR14, FR17, UX-DR17)

**Given** the Preview Pane while a file is selected
**When** I inspect it
**Then** it is `role="region"` with `aria-labelledby` the header file name and `tabindex="0"` so it is keyboard-reachable and scrollable (NFR8, UX-DR12)
**And** the tab order is toolbar, Tree, divider, Preview Pane (UX-DR12)

**Given** the preview takes longer than 150 ms
**When** the previous content is still showing
**Then** the previous content stays until the new one is ready and "Loading preview..." appears after 150 ms (UX-DR22)
**And** the status region announces "Previewing {name}" on activation and "{name}: no preview available" for card outcomes, never on arrow-key moves (UX-DR22)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, `lib/` additions have unit tests and `git status` shows only intended files

### Story 2.2: Preview text files

As a developer,
I want text files shown as readable monospaced text,
So that I can read code, configs and logs without opening an IDE.

**Acceptance Criteria:**

**Given** a file resolves to the `text` kind
**When** I select it
**Then** its content is shown as monospaced text on `code-bg` with standard soft wrap and no horizontal scroll by default, using the `code` typography token (FR12, UX-DR13)
**And** `TextPreview` lives in `components/preview/TextPreview.tsx` and consumes a `PreviewSource` (AD-9, conventions)

**Given** a text file up to 1 MB
**When** I select it
**Then** it renders in under 100 ms (FR12, NFR3)

**Given** a text file larger than 1 MB
**When** I select it
**Then** only the leading 1 MB is read and shown, and a banner above the content reads "Showing the first 1 MB of {size}. The rest of the file isn't shown." with {size} from `formatSize` (FR12, UX-DR14)
**And** the banner uses `notice-bg`, `notice-text` and a 1px `notice-border`, has an info glyph and is not dismissible (UX-DR14)
**And** the banner is pinned above the content and does not scroll away, and it is static, not a live region (UX-DR14)

**Given** extensions and exact names
**When** a file is named `Makefile`, `Dockerfile`, `LICENSE`, `README`, `.gitignore`, `.editorconfig`, `.env` or `.env.local`, or any other entry on the `EXPERIENCE.md` list
**Then** it previews as text, matching case-sensitively (FR12, AD-8, UX-DR13)
**And** an extensionless file not on the list shows a Metadata Card instead (UX-DR13)

**Given** a text file is selected
**When** the Preview Pane renders
**Then** the file content is inert text inserted as text nodes and never as HTML (NFR6)
**And** the pane scrolls independently and is keyboard-reachable via its focusable region (NFR8, UX-DR12)

**Given** the text is rendered
**When** I switch themes in the future or the OS theme changes
**Then** the colours come only from role variables, with `text` on `code-bg` meeting 4.5:1 in all themes (UX-DR29)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, new `lib/` functions (such as truncation or size-limit logic) have unit tests and `git status` shows only intended files

### Story 2.3: Preview images

As a developer,
I want PNG, JPEG, SVG and WebP images shown scaled to fit the pane,
So that I can check a generated mockup or asset at a glance.

**Acceptance Criteria:**

**Given** a file resolves to the `image` kind (PNG, JPEG, SVG or WebP)
**When** I select it
**Then** it is shown as an `<img src="blob:…">` scaled to fit the Preview Pane with its aspect ratio preserved (FR16, AD-11)
**And** `ImagePreview` lives in `components/preview/ImagePreview.tsx` and consumes a `PreviewSource` (AD-9)

**Given** an image smaller than the pane
**When** it renders
**Then** it is shown at its native size and not enlarged (FR16, UX-DR16)

**Given** an image
**When** I inspect its markup
**Then** the `alt` text is the file name (UX-DR16)
**And** the media fills the pane width within the 24px gutter and is not rounded (DESIGN.md)

**Given** an SVG file that contains `<script>` or references an external resource
**When** I select it
**Then** it renders only through the `<img>` element, is never inlined into the DOM, runs no script and makes no network request (FR16, AD-11, NFR5, NFR6)

**Given** object URLs
**When** a preview needs one
**Then** only `previewSession` calls `URL.createObjectURL`, and it revokes the URL when the Selection changes, when the file is refreshed and when the session ends (AD-10)
**And** no object URL is created at list time, and the old `openedItems` ref and `revokeItemUrls` no longer exist (AD-10)

**Given** I click through several images quickly
**When** an earlier image finishes loading after a later selection
**Then** the earlier result is discarded and the pane shows only the latest selection (AD-10)
**And** a test or documented manual check confirms that no stale image paints and no URL is left unrevoked

**Given** an animated GIF, APNG or WebP
**When** it is shown
**Then** it autoplays as authored with no pause control, as a documented v1 exception to WCAG 2.2.2 (UX-DR16)

**Given** no component uses `fetch()` or inline `style` attributes to display the image
**When** the code is reviewed
**Then** image sizing is done in CSS classes and custom properties (AD-12)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 2.4: Failed previews degrade gracefully

As a developer,
I want a file that can't be previewed to show a clear card instead of a broken pane,
So that one bad file never stops me from working.

**Acceptance Criteria:**

**Given** a renderer throws, rejects or the `File` read fails for the Selection
**When** the failure is caught by the dispatcher
**Then** the pane shows the Metadata Card with "This file couldn't be previewed. It may be damaged or in an unexpected format." (FR18, AD-9, UX-DR17)
**And** the failure is a typed outcome (`renderFailed`), not an exception thrown into the UI, and no stack trace or raw error text is ever shown (conventions)

**Given** the dispatcher
**When** a preview fails
**Then** the app stays responsive: I can select another file immediately and the next preview renders normally (FR18)
**And** the dispatcher is wrapped so a failing renderer can never blank the whole pane or crash the app (AD-9)

**Given** I select a file that Story 1.6 marked unavailable, or whose `getFile()` rejects
**When** the Preview Pane renders
**Then** it shows the Metadata Card with the render-failure explanation, using whatever metadata is readable (FR10, FR18, UX-DR17)
**And** the status region announces "{name}: no preview available" (UX-DR22)

**Given** a lazy renderer chunk fails to load
**When** the dispatcher awaits it
**Then** the same Metadata Card fallback appears rather than a blank or error screen (AD-9)

**Given** a failed preview was shown
**When** the Selection changes
**Then** the failed session's object URLs are revoked and its late results are discarded (AD-10)

**Given** a card with a failure explanation
**When** I inspect it
**Then** the explanation is in `ui-body` beneath the definition list and the name is an `h2` (UX-DR17)
**And** the pane stays keyboard-reachable (NFR8)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, any new `lib/` outcome helpers have unit tests and `git status` shows only intended files

## Epic 3: Read Markdown, Word and PDF safely

You preview formatted Markdown, .docx and PDF, and previewed content cannot run scripts or make network requests. Covers the sanitizer, the meta CSP, the lazy-loaded renderers, bundle-budget checks, the narrowed `PdfPreview` and the hostile-Markdown zero-request proof.

### Story 3.1: Preview Markdown safely

As a developer,
I want Markdown shown as formatted rich text that cannot run anything or fetch anything,
So that I can read a generated spec the way it was meant to look, even if the file is untrusted.

**Acceptance Criteria:**

**Given** a Markdown parser is needed
**When** this story selects one
**Then** the chosen library and its version are verified against current documentation, recorded in the story's completion notes and imported only through a dynamic `import()` or `React.lazy` reachable from the Markdown renderer (AD-9, AD-15)
**And** `vite build` shows the initial JS stays under 150 KB gzipped, with the measured size recorded (NFR1, AD-15)

**Given** a file resolves to the `markdown` kind
**When** I select it
**Then** `MarkdownPreview` in `components/preview/MarkdownPreview.tsx` renders real headings, lists, tables, code blocks, links and images, consuming a `PreviewSource` (FR13, AD-9, UX-DR15)
**And** prose is capped at 760px, left-aligned, with headings scaling from `heading-lg` (h1) to `ui-body` bold (h5–h6), and code uses the `code` token on `code-bg` (UX-DR2)
**And** the rendered content inherits theme variables so it follows theme changes without re-rendering

**Given** `services/sanitize`
**When** any renderer produces HTML
**Then** the HTML passes through `sanitize` before reaching the DOM; no renderer inserts unsanitized HTML (AD-11)
**And** the sanitizer is an allowlist that removes `<script>`, event-handler attributes, `style` attributes, `<iframe>`, `<object>`, `<embed>`, `<form>` and any `src` or `href` that points off the page, including `javascript:` and `data:` URLs (AD-11, NFR6)
**And** `sanitize` lives in `services/` because it needs the DOM, has JSDoc, and is unit-tested in a Vitest DOM environment (`happy-dom` or `jsdom`, added as a devDependency) with a hostile-input corpus covering each rule above (AD-1, AD-11)

**Given** Markdown containing a remote image such as `![x](https://example.com/a.png)`
**When** it renders
**Then** no request is made and the image is replaced by the blocked-resource placeholder: `placeholder-bg`, a 1px dashed `border-strong`, an image-off glyph, minimum 120×48px, the label "Remote image blocked" and the alt text as a caption when present (FR13, UX-DR15)
**And** the placeholder has the accessible name "Remote image blocked" (UX-DR15)

**Given** Markdown with links
**When** it renders
**Then** `#anchor` links stay in the page and scroll within the Preview Pane; all other links (remote, relative or `javascript:`) become plain `text` with no underline, no tab stop and no navigation (FR13, AD-11, UX-DR15)
**And** every actual link that remains is underlined (1px, `accent`, offset 2px) in every theme and state (UX-DR15)
**And** clicking any link never navigates the app away from the current page (FR13)

**Given** Markdown that embeds raw HTML such as `<script>`, `<img onerror=…>` or `<a href="javascript:…">`
**When** it renders
**Then** nothing executes, the dangerous attributes and elements are removed, and no network request is made (NFR5, NFR6)

**Given** a Markdown file larger than 1 MB
**When** I select it
**Then** only the leading 1 MB is read and rendered, and the same truncation banner as text preview is pinned above it (FR13, UX-DR14)
**And** truncation never cuts the file in a way that crashes the parser: a partial trailing construct renders as plain text

**Given** the parser or sanitizer throws on a file
**When** the renderer fails
**Then** the Metadata Card with the render-failure explanation is shown (FR18, AD-9)

**Given** an object URL, `fetch()` call or inline `style` attribute
**When** the renderer is reviewed
**Then** the Markdown renderer makes no `fetch()` call and sets no inline `style` attribute (AD-12)

**Given** the rendered output
**When** I use the keyboard
**Then** the Preview Pane region is focusable and scrollable and any remaining links are reachable in order (NFR8, UX-DR12)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 3.2: Preview Word documents

As a developer,
I want a `.docx` file shown with its text and basic formatting,
So that I can check an exported summary without opening Word.

**Acceptance Criteria:**

**Given** a DOCX converter is needed
**When** this story selects one
**Then** the library and version are verified against current documentation, recorded in the completion notes and loaded only through a dynamic `import()` on first use (AD-9, AD-15, NFR1)
**And** `vite build` shows initial JS still under 150 KB gzipped, with the measured size recorded (AD-15)

**Given** a file resolves to the `docx` kind
**When** I select it
**Then** `DocxPreview` in `components/preview/DocxPreview.tsx` shows its text and basic formatting (headings, bold, italic, lists, tables, links), consuming a `PreviewSource` (FR14, AD-9)
**And** a typical document under 5 MB displays in under 1 s, including the first-use lazy load (FR14, NFR3)

**Given** the converter produces HTML
**When** it reaches the DOM
**Then** it has passed through the same `services/sanitize` chokepoint as Markdown, with no separate or weaker path (AD-11)
**And** it contains no executable content, no inline `style` attributes and no remote resource request (FR14, NFR5, NFR6, AD-12)

**Given** a document with embedded images
**When** it renders
**Then** embedded image data is shown only as `blob:` or in-document data that the sanitizer allows, never by fetching a remote URL; remote image references become the blocked-resource placeholder (FR14, AD-11, UX-DR15)

**Given** a document with hyperlinks
**When** it renders
**Then** links follow the same rules as Markdown: remote and unsafe links become plain text, remaining links are underlined in `accent`, and nothing navigates the app away (FR14, UX-DR15)

**Given** a legacy `.doc` file
**When** it is selected
**Then** it still shows the Metadata Card "Legacy .doc files can't be previewed. Only .docx is supported." and no converter is loaded (FR14, AD-8)

**Given** a corrupt, password-protected or non-zip `.docx`
**When** it is selected
**Then** the converter's failure is caught and the Metadata Card shows "This file couldn't be previewed. It may be damaged or in an unexpected format." with the pane staying responsive (FR18, AD-9)

**Given** rendered output
**When** I change theme
**Then** the content follows theme variables, and body text uses `ui-body` with prose capped at 760px (UX-DR2, UX-DR15)

**Given** a test `.docx` fixture containing a script-like payload or remote reference
**When** it is rendered in tests
**Then** the sanitizer's tests show nothing executable remains (NFR6)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 3.3: Preview PDFs

As a developer,
I want a PDF shown as a continuously scrolling document in the pane,
So that I can read an exported report in place.

**Acceptance Criteria:**

**Given** a file resolves to the `pdf` kind
**When** I select it
**Then** `PdfPreview` shows its pages as a continuous scrollable sequence using the `<object type="application/pdf">` embed that the architecture keeps (FR15, AD-3)
**And** there are no page-navigation or custom zoom controls (FR15, UX-DR16)

**Given** the existing `PdfPreview`
**When** this story is complete
**Then** its `fetch()` call and `countPdfPages` are removed, `lib/pdf.ts` keeps only `isPdf` (now expressed through `resolvePreviewKind`), and no renderer calls `fetch()` (AD-3, AD-12)

**Given** a PDF is selected
**When** its source is created
**Then** the `blob:` URL is created lazily and only by `previewSession` when this file is selected, revoked when the Selection changes, and never created at list time (AD-10, AD-3)

**Given** the PDF renderer
**When** the app starts
**Then** it is loaded via `React.lazy` or a dynamic `import()` on first PDF selection, and initial JS stays under 150 KB gzipped, with the measured size recorded (NFR1, AD-9, AD-15)

**Given** the Preview Pane
**When** I use the keyboard
**Then** the PDF container is focusable and keyboard-reachable, and the pane scrolls without a mouse; its inner text and structure are whatever the browser exposes (NFR8, UX-DR12, UX-DR16)

**Given** a PDF that is corrupt or that the browser cannot display
**When** it is selected
**Then** the Metadata Card fallback is shown where the failure is detectable, and the pane never goes blank without an explanation (FR18, AD-9)

**Given** two PDFs are selected in quick succession
**When** the earlier one finishes loading late
**Then** its result is discarded and its URL revoked (AD-10)

**Given** the embed is used
**When** the code is reviewed
**Then** no inline `style` attribute is set; size is controlled by CSS classes (AD-12)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, `git status` shows only intended files, and `grep` finds no `countPdfPages` or `fetch(` in `src/`

### Story 3.4: Lock the page down and prove nothing leaves it

As a developer who handles untrusted files,
I want a second layer of protection and a demonstrated guarantee that previewing never makes a network request,
So that I can open any folder without worrying about what is inside.

**Acceptance Criteria:**

**Given** `index.html`
**When** this story is complete
**Then** it carries a meta CSP of the shape `default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; object-src blob:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'` (AD-12)
**And** the exact string is adjusted only as far as needed, with each deviation and its reason recorded in the completion notes (AD-12)

**Given** the production build
**When** I run `vite build` and `vite preview`
**Then** the app works under the CSP: the tree, selection, text, image, Markdown, DOCX and PDF previews all render, theme variables apply and no CSP violation appears in the console (AD-12)
**And** any dev-server relaxation of the CSP is explicitly separate from the production string and is not used as evidence (AD-12)

**Given** the PDF embed
**When** it is checked against the CSP
**Then** the story verifies `object-src blob:` allows it, or records the minimal change and why (AD-12)

**Given** a hostile Markdown file containing a remote image, `<script>`, `<img onerror>`, a `javascript:` link, a remote link and a `style` attribute
**When** it is opened in the production preview build with the browser network panel open
**Then** zero outbound requests are made, nothing executes, the remote image shows "Remote image blocked" and links are inert (SM-3, NFR5, NFR6)
**And** the procedure and its result are recorded in the completion notes as the SM-3 evidence for this behaviour

**Given** the CSP
**When** the documentation of this story is reviewed
**Then** it states that a meta CSP is a second wall and not a guarantee, because it cannot set `frame-ancestors` and does not stop top-level navigation, and that the sanitizer remains the first wall (AD-11, AD-12)

**Given** the lint step
**When** it runs
**Then** it fails the build on `fetch(` in `src/components/preview/` and on inline `style=` attributes or `.style.cssText` in renderers, in addition to the AD-13 forbidden identifiers (AD-12, AD-13)

**Given** speed and size work
**When** any later change is proposed
**Then** it must not weaken sanitization or relax the CSP to pass a target (SM-C1)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

## Epic 4: Refresh to see what changed

You press Refresh after an agent edits files and the tree, preview and timestamp update, keeping expansion and selection; a removed file clears with a clear message.

### Story 4.1: Refresh the folder tree

As a developer who just changed files from the terminal,
I want to press Refresh and see the tree match the disk,
So that new files appear and removed ones disappear without losing my place.

**Acceptance Criteria:**

**Given** the toolbar
**When** no Workspace Folder is open
**Then** the Refresh button (inline-SVG glyph, `border-strong` outline) is disabled, drops to `text-muted` and keeps its outline (UX-DR3)
**And** once a folder is open it is enabled

**Given** a folder is open with some folders expanded
**When** I activate Refresh
**Then** `services/tree.refresh()` re-reads the root and every currently expanded folder, replaces each cached level, and reads no collapsed or never-expanded folder (FR20, AD-7, AD-6)
**And** only `name` and `kind` are read per entry, with no `getFile()` call for non-selected entries (AD-6)

**Given** a file was added or removed in an expanded folder on disk
**When** Refresh completes
**Then** the new entry appears and the removed entry disappears, in the correct `compareFileItems` order (FR20, AD-2)

**Given** expanded folders and a selected file that still exist
**When** Refresh completes
**Then** every surviving id keeps its expansion state and the file stays selected, because ids are the normalized relative path and are stable across reads (FR20, AD-4, AD-7)
**And** dotfile visibility is unchanged, because it is a view filter and Refresh does not reset it (AD-6)

**Given** an expanded folder was deleted on disk, or became a file
**When** Refresh completes
**Then** its expansion entry is dropped and the folder row is removed, and a surviving id whose kind changed (file to folder or the reverse) is treated as a different entry whose old expansion and selection are dropped (AD-7)

**Given** Refresh is running
**When** the button is activated again
**Then** the second request is ignored while the first is in flight, with no concurrent reads (FR20)
**And** the button has `aria-busy="true"` and its label does not change (UX-DR24)

**Given** Refresh starts and finishes
**When** the status changes
**Then** the polite status region announces "Refreshing..." and then "Refreshed."; identical strings re-announce by clearing the region and setting the text on the next frame (UX-DR22)

**Given** I activate Refresh with the keyboard or mouse
**When** it completes
**Then** focus stays on the Refresh button (UX-DR24)
**And** if the tree's tab-stop row vanished, the roving tabindex is repaired immediately by the priority order: the row if it survives, else its nearest surviving ancestor or previous visible row, else the selected row, else the first row (UX-DR8)

**Given** a folder of about 1,000 entries is expanded
**When** I refresh
**Then** the tree updates without freezing the interface (NFR2, NFR4)

**Given** the tree state
**When** Refresh runs
**Then** `services/tree` is still the only writer, components call only the `refresh` intent, and no `useState` copies the tree data (AD-5)

**Given** this story adds pure `lib/` logic (for example a reconcile helper)
**When** I run the tests
**Then** it has JSDoc `@param`/`@returns` and unit tests for added, removed, kind-swapped and unchanged ids

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 4.2: Refresh the selected file's preview

As a developer who revised a file from the terminal,
I want Refresh to reload the open preview and its timestamp,
So that I can see the new content and know the change landed.

**Acceptance Criteria:**

**Given** a file is selected and has changed on disk
**When** I press Refresh
**Then** a new `previewSession` opens for the same id, which aborts the previous session, revokes its object URLs and discards its late results (FR20, AD-7, AD-10)
**And** the selection's `size`, `updatedAt` and type are re-read through `getFile()` for the Selection only (AD-6)

**Given** the refreshed file has new content
**When** the new session finishes
**Then** the preview shows the new content and the Preview Header reads the new "Modified {when}" stamp, for example "Modified Today at 11:04 AM" (FR20, FR11, UX-DR11)
**And** this works for every preview kind that exists at this point: text, image, Markdown, DOCX, PDF and the Metadata Card

**Given** the selected file's path is unchanged
**When** the new preview renders
**Then** the Preview Pane keeps its scroll position (UX-DR12)

**Given** the preview takes longer than 150 ms to reload
**When** the previous content is still showing
**Then** it stays visible and "Loading preview..." appears after 150 ms, and the status region announces "Refreshing..." and then "Refreshed." once (UX-DR22)

**Given** the file did not change on disk
**When** I press Refresh
**Then** the preview and stamp stay equivalent and nothing flashes or blanks

**Given** I switch to a different file while a refresh reload is in progress
**When** the earlier session completes
**Then** its result is discarded and only the latest selection is shown (AD-10)

**Given** the selected file is now empty, or has become a type that resolves to a different kind
**When** Refresh completes
**Then** the preview switches to the right renderer through `resolvePreviewKind`, for example a zero-byte file shows the Metadata Card "This file is empty." (FR17, AD-8)

**Given** the reload fails for a file that still exists
**When** the new session rejects
**Then** the Metadata Card with the render-failure explanation is shown and the pane stays responsive (FR18, AD-9)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 4.3: Handle a missing selection and an unreadable folder

As a developer,
I want Refresh to tell me clearly when my selected file is gone or the folder can no longer be read,
So that I never mistake a stale or blank pane for current content.

**Acceptance Criteria:**

**Given** a file is selected and has been deleted on disk
**When** I press Refresh
**Then** the Selection clears, the preview pane returns to the "Select a file to preview it." prompt, and a status message above the prompt reads "{name} was removed or can no longer be read, so the selection was cleared." (FR21, UX-DR23)
**And** the same string is mirrored into the polite status region (UX-DR22)
**And** the message remains until the next selection (UX-DR23)

**Given** the Selection still exists but can no longer be read
**When** I press Refresh
**Then** the same clear-and-explain behaviour applies (FR21, AD-7)

**Given** the Selection was removed together with a parent folder
**When** I press Refresh
**Then** the parent folder row disappears, the Selection clears and the same message appears (FR21, AD-7)

**Given** an expanded folder becomes unreadable on disk
**When** I press Refresh
**Then** the folder is marked "Unavailable" with its "This folder can't be read." child row and the rest of the tree keeps working (FR10, UX-DR6, UX-DR7)

**Given** the Workspace Folder itself can no longer be read, or its permission was revoked
**When** I press Refresh
**Then** the existing tree and Selection are kept, and the message "Access to that folder wasn't granted. Choose a folder to try again." appears inline under the toolbar, mirrored to a `role="alert"`, and is dismissed on my next action (UX-DR23, UX-DR22)
**And** nothing is cleared, and Open folder remains available to choose another folder

**Given** the selection-missing notice is showing
**When** I select another file
**Then** the notice disappears (UX-DR23)

**Given** the Selection was removed but a different file now has the same name at the same path
**When** I press Refresh
**Then** it is the same id, so the Selection is kept and the preview reloads with the new file's content (AD-4, AD-7)

**Given** focus was on a row that vanished
**When** Refresh completes
**Then** focus stays on the Refresh button and the tab stop is repaired immediately (UX-DR24, UX-DR8)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, any new `lib/` helpers have unit tests and `git status` shows only intended files

## Epic 5: Choose a theme and meet the quality bar

You switch among Light, Dark and Warm Sand and the choice is remembered. Covers the final accessibility and contrast audit, forced colors, reduced motion, and the SM-1 to SM-4 verification walkthroughs.

### Story 5.1: Switch between Light, Dark and Warm Sand

As a developer who works long sessions,
I want to switch between Light, Dark and Warm Sand and have the app remember my choice,
So that the viewer is comfortable in whatever light I am working in.

**Acceptance Criteria:**

**Given** the toolbar
**When** it renders
**Then** it contains a theme control with `role="radiogroup"` labeled "Theme" and three joined segments "Light", "Dark" and "Warm Sand", each with its own `role="radio"` or native radio input (FR22, UX-DR21)
**And** each segment has a leading inline-SVG glyph (sun, moon, dune) that is `aria-hidden`, and the group has a `border-strong` outline with `rounded.DEFAULT` and inner active segment `rounded.sm` (UX-DR21)
**And** the control is usable even when no folder is open

**Given** the theme control
**When** I use the keyboard
**Then** the group is a single tab stop (the checked radio), and arrow keys move between and select its three segments (UX-DR21, NFR8)
**And** a visible 2px `focus-ring` shows on the focused segment in every theme (FR8, UX-DR24)

**Given** a segment is active
**When** it renders
**Then** it has `accent` fill, `on-accent` text, a leading check glyph and `aria-checked="true"`, so the active state is not colour-only (UX-DR21)
**And** all segment widths are fixed to the longest label ("Warm Sand") and weight never changes, so selecting a theme never shifts layout (UX-DR21)

**Given** a folder with an expanded tree, a Selection and a scrolled preview
**When** I choose a theme
**Then** `data-theme` on `<html>` changes immediately, every surface follows (Tree, Preview Pane, Preview Header, Metadata Card, notices, rendered Markdown and DOCX, text preview, the divider), with no reload (FR22, UX-DR1)
**And** the Selection, expansion state and scroll positions are untouched (FR22)
**And** no component CSS branches on theme and no inline `style` attribute is used (AD-14, AD-12)

**Given** a stored Theme exists
**When** the app starts
**Then** `services/prefs` returns it and `data-theme` is set to it, taking priority over the OS preference (FR23, AD-14)

**Given** no stored Theme exists
**When** the app starts
**Then** the theme is Light or Dark according to `prefers-color-scheme`, and never Warm Sand (FR23, UX-DR21)

**Given** I choose a theme
**When** the choice is saved
**Then** `services/prefs` persists `theme` in `localStorage` alongside the existing `showDotfiles` key, with every access in `try/catch`, and nothing else is stored (NFR7, AD-14)
**And** if storage is unavailable or throws, the choice still applies for the session and no error is shown (AD-14)

**Given** a stored value that is not `light`, `dark` or `sand`
**When** the app starts
**Then** it is ignored and the OS-based default applies (AD-14)

**Given** the radio selection changes
**When** the theme applies
**Then** the status region does not interrupt with extra announcements; the radio's checked state is announced natively (UX-DR22)

**Given** this story adds pure `lib/` logic (for example theme validation)
**When** I run the tests
**Then** it has JSDoc `@param`/`@returns` and unit tests

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 5.2: Verify contrast in all three themes

As a user with low vision,
I want every text and control to stay readable in all three themes,
So that no theme leaves me squinting or guessing.

**Acceptance Criteria:**

**Given** a pure `lib/` contrast function
**When** I call it with two hex colours
**Then** it returns the WCAG 2.1 relative-luminance contrast ratio, rounded as in the `DESIGN.md` table, with JSDoc `@param`/`@returns` and unit tests against known pairs (UX-DR29, AD-1)

**Given** the theme token values in the stylesheet
**When** the contrast test suite runs
**Then** it reads the actual `--color-*` values for `light`, `dark` and `sand` from the CSS source and computes every pair listed in the `DESIGN.md` verification table (UX-DR29)
**And** each text pair must be at least 4.5:1 and each UI-component or focus-indicator pair at least 3:1, per the minimum named in that table, or the test fails

**Given** the dotfile rule
**When** the suite runs
**Then** it blends `text` at 60% over `surface` and asserts at least 4.5:1 in every theme, and asserts that hovered and selected dotfile rows use full-opacity `text` pairs (UX-DR5, UX-DR29)
**And** `text-muted` and `danger-text` at 0.6 are asserted to fail, documenting why they are exempt from dimming

**Given** the `accent / text` pair
**When** the suite runs
**Then** it asserts the ratio is below 3:1 and that the stylesheet underlines every link in rendered previews, since colour alone does not distinguish links (UX-DR15, UX-DR29)

**Given** the thin margins named in `DESIGN.md`
**When** the suite runs
**Then** it has explicit cases for Sand dotfile rest (4.55), Dark `notice-border` on `notice-bg` (3.06) and Dark `text-muted` on `row-selected` (4.61), so a token change that lowers any of them fails the build (UX-DR29)

**Given** any token changes in the future
**When** `npm test` runs
**Then** the suite fails with the pair, theme, expected minimum and actual ratio (UX-DR29)

**Given** a pair in the table is found to fail with the real CSS values
**When** this story is run
**Then** the token is corrected in the stylesheet and the correction is recorded; the story does not weaken the test to make it pass

**Given** every focusable element in every theme
**When** reviewed
**Then** the 2px `focus-ring` pair against each of `surface`, `surface-raised`, `bg`, `row-hover`, `row-selected`, `code-bg`, `notice-bg` and `placeholder-bg` meets 3:1 (FR8, UX-DR29)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass, tests pass and `git status` shows only intended files

### Story 5.3: Verify assistive-technology and display modes

As a user of assistive technology or a non-default display setup,
I want the app to hold up in forced colors, reduced motion, zoom and screen readers,
So that the experience is the same quality for me as for everyone else.

**Acceptance Criteria:**

**Given** forced-colors mode (`@media (forced-colors: active)`)
**When** I walk through the app
**Then** the selected row shows its 3px `border-inline-start` bar (mapped to `Highlight`) and a 1px `Highlight` outline, the active theme segment shows a 2px `Highlight` border and a check glyph, focus uses `outline`, the divider line and grip use `CanvasText` borders, disabled controls use `GrayText`, the blocked-resource dashed border and notice banner use `CanvasText`, and dotfile opacity is reset to 1 (UX-DR27)
**And** the theme control remains functional but visually inert, and the result is recorded in the completion notes

**Given** `prefers-reduced-motion: reduce`
**When** I use the app
**Then** all transitions and animations are removed: the tree spinner is a static glyph, the chevron rotates instantly and smooth scrolling is off (UX-DR27)

**Given** a 1280px window at 200% browser zoom (640 CSS px)
**When** I use the app
**Then** there is no page-level horizontal scroll, the toolbar wraps onto a second row with the Workspace Folder name truncating first, and row and toolbar heights grow in `rem` rather than clipping (UX-DR28)
**And** the documented exceptions are stated in `epics.md` or the completion notes: 400% reflow does not meet WCAG 1.4.10, and animated images may fail WCAG 2.2.2 (UX-DR28, UX-DR16)

**Given** text-spacing overrides (WCAG 1.4.12)
**When** applied
**Then** rows, the toolbar and cards do not clip content (UX-DR28)

**Given** the live-region table in `EXPERIENCE.md`
**When** each event is triggered
**Then** exactly one persistent visually hidden `role="status"` carries "Opened {name}", "Previewing {name}", "{name}: no preview available", "Loading preview...", "Selection cleared", "Refreshing...", "Refreshed.", the selection-missing string and the access-denied string (also mirrored in `role="alert"`) (UX-DR22)
**And** announcements fire on activation or failure and never on each arrow-key move, and identical strings re-announce by clearing then setting on the next frame (UX-DR22)

**Given** the page structure
**When** inspected
**Then** `<html lang="en">`, a `<header>` toolbar, a `<main>` preview pane, a visually hidden `h1` "file-browser", `h2` for the Preview Header and Metadata Card names, a document title of "file-browser" plus the folder name once open, and the tree named "File tree" are all present (UX-DR26)
**And** the unsupported-browser screen is a single `<main>` with an `h1` (UX-DR25, UX-DR26)

**Given** a screen reader and keyboard-only pass
**When** I run UJ-1 and UJ-2 with only the keyboard
**Then** every control is reachable and operable, rows announce role, name, level, expanded and selected state, the unavailable description is read, and the preview region is reachable and labeled (FR8, NFR8)
**And** any defect found is fixed in this story and recorded; if a fix belongs to an earlier story's scope it is noted against that story

**Given** every glyph in the app
**When** inspected
**Then** each is inline SVG with `currentColor`, `aria-hidden="true"` and no icon library, and every control has a text label (UX-DR18, UX-DR27)

**Given** this story is complete
**When** I run `npm run build` and `npm run lint`
**Then** both pass and `git status` shows only intended files

### Story 5.4: Run the release verification

As the product owner,
I want evidence that v1 meets its success metrics and its policies,
So that I can ship it, or know exactly what to fix first.

**Acceptance Criteria:**

**Given** SM-1
**When** I run a timed UJ-1 walkthrough on a typical laptop
**Then** opening a folder, finding three new files, previewing each and refreshing once completes in under 30 s with no perceptible lag, and the time and steps are recorded (SM-1, FR1, FR4, FR5, FR7, FR12–FR16, FR20)

**Given** SM-2
**When** I run a measured pass on a folder of about 1,000 entries
**Then** the tree shows in under 300 ms, a similar folder expands in under 100 ms, text up to 1 MB previews in under 100 ms, a typical `.docx` under 5 MB previews in under 1 s, and initial JS is under 150 KB gzipped from `vite build` (SM-2, NFR1, NFR2, NFR3, AD-15)
**And** the measurements and method are recorded, and an item that misses its target is reported as a defect rather than relaxed

**Given** NFR4
**When** I open a large repository with thousands of entries in total and about 2,000 in one folder
**Then** the interface stays responsive (NFR4)

**Given** SM-3
**When** I run the UJ-2 checklist end to end
**Then** the large folder stays responsive, the dotfile toggle works, all three themes stay legible, a binary and a zero-byte file each show a Metadata Card (the latter saying "This file is empty."), and a hostile Markdown file with a remote image makes zero outbound requests in `vite build` + `vite preview` (SM-3, FR9, FR17, FR22, NFR5, NFR6)
**And** the same checklist in a non-Chromium browser shows the unsupported-browser screen (NFR9)

**Given** SM-4
**When** I run `npm run build` and `npm run lint`
**Then** both pass with no errors (SM-4)

**Given** the policy gates
**When** the repository is checked
**Then** the AD-13 grep gate finds no `createWritable`, `removeEntry`, `move`, `readwrite` or `FileSystemWritableFileStream`, the AD-12 gates find no `fetch(` or inline `style` in renderers, no icon library is in `package.json`, no backend or external network request exists, and `FileRow`, `MOCK_FILES`, `countPdfPages` and `openedItems` are gone (FR3, FR25, AD-3, AD-12, AD-13)
**And** `AGENTS.md` uses the tree semantics and no longer mandates `listbox`/`option`

**Given** the counter-metrics
**When** results are reviewed
**Then** no performance or size result was reached by weakening sanitization, relaxing the CSP, or dropping keyboard or screen-reader support (SM-C1, SM-C2)

**Given** the evidence
**When** this story is complete
**Then** a verification record in the completion notes lists each SM, NFR and gate with its result, command or method, and any open defects with the story they belong to
**And** SM-5 (daily use by the author) is noted as a post-release observation, not a gate

**Given** this story is complete
**When** I run `git status`
**Then** only files in the stated scope changed
