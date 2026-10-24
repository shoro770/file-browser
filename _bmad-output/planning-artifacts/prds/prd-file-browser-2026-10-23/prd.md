---
title: "PRD: file-browser v1"
status: final
created: 2026-10-23
updated: 2026-10-23
---

# PRD: file-browser v1
*Working title — confirm.*

## 0. Document Purpose

This PRD defines the complete v1 of file-browser for the product owner, the UX designer, the architect and the story-writing workflow that follow. Vocabulary is anchored in the Glossary (§3); features are grouped in §4 with globally numbered FRs written in EARS form. FRs state observable behavior only: no technologies, libraries or component names. Inferred details are tagged `[ASSUMPTION]` inline and indexed in §10. It builds on the product brief and its addendum (`_bmad-output/planning-artifacts/briefs/brief-file-browser-2026-10-22/`), which hold the current-repo analysis and architecture implications; it does not duplicate them.

## 1. Vision

**Success in one sentence:** v1 proves that a zero-backend, client-side browser can be an effortless, instant and visually delightful companion that makes inspecting local workspace changes faster and cleaner than spinning up a full IDE.

file-browser is a lightweight, read-only, two-pane viewer for a local folder: a folder tree on the left and a polished preview on the right. It exists for developers who work with a coding agent in a terminal and lose sight of the file tree and of how generated documents actually look. It opens instantly, runs entirely in the browser, never modifies a file and never sends anything over the network.

v1 is a previewer with manual freshness (a refresh control and a Last Modified stamp). Live awareness of what an agent is changing is the v2 promise; v1 earns it by being something the user reaches for every day. The v1 UI is a substantial redesign of today's barebones, mock-like interface and is a core deliverable, not polish.

## 2. Target User

### 2.1 Jobs To Be Done
- **Functional:** When an agent has just generated or changed files, let me find them and see what they look like without leaving my flow.
- **Contextual:** Let me inspect any local folder safely, knowing nothing can be changed, uploaded or fetched.
- **Emotional:** Make looking at my project feel calm, quick and pleasant, lighter than an IDE.
- **Evaluative:** Let a reviewer see a working, polished, well-engineered product with documented process.

### 2.2 Non-Users (v1)
- Users who need to edit, rename, move or delete files.
- Users on browsers without folder-access support (anything other than Chrome and Edge).
- Users who need live change notification (v2).

### 2.3 Key User Journeys

- **UJ-1. Shneor verifies what Claude just made.**
  - **Persona + context:** Shneor, a full-stack engineer, runs an entire coding session in the terminal with Claude Code and has just asked it to draft an architecture spec (Markdown), an exported summary (Word) and a mockup image.
  - **Entry state:** Claude Code has finished; the files exist on disk; Shneor has file-browser open in Chrome with nothing loaded.
  - **Path:**
    1. Opens a folder and picks the project root. The Tree appears immediately; the Preview Pane shows a calm prompt to select a file.
    2. Expands subfolders to find the new files. Dotfile folders and dependency folders are visible but visually recessive, and expansion is instant.
    3. Selects the Markdown spec, then the Word summary, then the mockup image. Each preview appears immediately and is formatted well; the image fits the pane.
    4. Returns to the terminal, asks Claude to revise the spec, comes back and presses Refresh. The selected file's preview reloads and its Last Modified stamp updates (for example, "Today at 11:04 AM").
  - **Climax:** Step 4. He sees the revised content and a newer timestamp, and knows the change landed.
  - **Resolution:** All deliverables verified in under 30 seconds with no IDE launch; he returns to the terminal.
  - **Edge case:** If the selected file was deleted or became unreadable, Refresh shows a clear message instead of a stale or blank preview.

- **UJ-2. The evaluator probes the edges.**
  - **Persona + context:** The course instructor assesses whether the product handles hard cases gracefully and meets the performance and UX bar.
  - **Entry state:** Has the app running in Chrome; has a large repository (thousands of files) available.
  - **Path:**
    1. Opens the large repository root; the Tree responds without freezing.
    2. Toggles dotfile visibility off and on; styling and visibility follow.
    3. Cycles through Light, Dark and Warm Sand; every surface stays legible and consistent.
    4. Selects an unsupported binary (executable, archive) and a zero-byte file; each shows an informative Metadata Card, never a blank or broken pane.
    5. Opens a Markdown file containing a remote image reference and confirms no network request is made.
  - **Climax:** Step 5, with nothing leaving the machine, plus step 4's graceful fallbacks.
  - **Resolution:** Concludes the product is robust, private and polished.

## 3. Glossary

- **Workspace Folder** — The local folder the user chooses to browse; the root of the Tree. One at a time.
- **Entry** — A file or folder inside the Workspace Folder.
- **Tree** — The hierarchical list of Entries in the left pane. A folder Entry may be expanded or collapsed.
- **Selection** — The single Entry currently chosen. At most one at a time.
- **Preview Pane** — The right pane that shows the Preview or Metadata Card for the Selection, under a header.
- **Preview Header** — The strip at the top of the Preview Pane showing the Selection's name and Last Modified stamp.
- **Preview** — The rendered presentation of a file's content. Supported kinds: text, Markdown, PDF, Word document (.docx), image (PNG, JPEG, SVG, WebP).
- **Metadata Card** — The fallback presentation for any file without a Preview: name, size, type and Last Modified.
- **Last Modified Stamp** — The date and time the Selection was last changed on disk, shown in the Preview Header.
- **Dotfile** — Any Entry whose name begins with a period, including its contents when a folder.
- **Refresh** — The user action that re-reads the Workspace Folder state from disk.
- **Theme** — A complete visual palette: Light, Dark or Warm Sand.

## 4. Features

### 4.1 Workspace Folder Selection
**Description:** The user grants read-only access to one local folder at the start of a session. Everything else operates on that folder. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-1: Choose a Workspace Folder
When the user activates the open-folder control, the system shall prompt the user to choose a folder from their device and, on confirmation, make it the Workspace Folder. Realizes UJ-1, UJ-2.

**Consequences (testable):**
- After confirmation, the root level of the Workspace Folder is shown in the Tree.
- Choosing a new folder while one is open replaces the previous Tree and clears the Selection.

#### FR-2: Handle cancelled or denied access
If the user cancels the folder prompt or denies access, then the system shall remain in its previous state and shall show a brief message only when access was denied.

#### FR-3: Read-only access
The system shall request and use read-only access to the Workspace Folder and shall not create, modify, rename or delete any Entry. Realizes UJ-2.

**Consequences (testable):**
- No control in the interface can write to disk.
- The permission requested from the user is read-only.

### 4.2 Folder Tree Navigation
**Description:** A hierarchical, lazily loaded Tree, built for large folders. Opening a folder reveals only its first level; deeper levels are read when expanded. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-4: Show the root level immediately
When a Workspace Folder is chosen, the system shall display its immediate children in the Tree without reading any deeper level.

**Consequences (testable):**
- Folders sort before files; names sort alphabetically, case-insensitive.
- Each Entry shows an icon or glyph that distinguishes folder from file kind.

#### FR-5: Expand folders lazily
When the user expands a folder Entry, the system shall read and display only that folder's immediate children.

**Consequences (testable):**
- Collapsed and never-expanded folders cause no read of their contents.
- Re-expanding a previously expanded folder shows its contents without a visible reload `[ASSUMPTION]`.

#### FR-6: Collapse folders
When the user collapses an expanded folder Entry, the system shall hide its descendants and retain their expansion state until Refresh or a new Workspace Folder is chosen.

#### FR-7: Select a single Entry
When the user selects a file Entry, the system shall make it the only Selection and show its Preview or Metadata Card in the Preview Pane.

**Consequences (testable):**
- Selecting a second file deselects the first.
- Selecting a folder Entry toggles its expansion and does not replace the current Selection `[ASSUMPTION]`.

#### FR-8: Keyboard operation
The system shall allow the user to move through the Tree, expand and collapse folders, and select files using only the keyboard, and shall expose each Entry's role, name, expansion state and selected state to assistive technology. Realizes UJ-2.

**Consequences (testable):**
- Arrow keys move focus; Enter or Space selects; arrow keys or equivalent expand and collapse.
- A visible focus indicator is present on the focused Entry in every Theme.
- The Preview Pane content is reachable by keyboard.

#### FR-9: Dotfile visibility toggle
The system shall provide a control to show or hide Dotfiles; where Dotfiles are shown, the system shall render them at 60% opacity. Realizes UJ-1, UJ-2.

**Consequences (testable):**
- Dotfiles are visible by default.
- Toggling hides or reveals them immediately without collapsing other folders or clearing the Selection.
- If the Selection is a hidden Dotfile when hiding is turned on, the Selection is cleared and the Preview Pane returns to its empty state.
- The user's choice persists across sessions on their device `[ASSUMPTION]`.

#### FR-10: Unreadable Entries
If an Entry or folder cannot be read, then the system shall keep the rest of the Tree usable and shall mark that Entry as unavailable.

### 4.3 File Previews
**Description:** Selecting a file shows a fast, well-formatted Preview in the Preview Pane. Anything without a Preview shows a Metadata Card, so the pane is never blank or broken. All rendering is local and inert. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-11: Preview Header
While a file is the Selection, the system shall show its name and Last Modified Stamp in the Preview Header.

**Consequences (testable):**
- The stamp includes date and time and uses a relative day label for today (for example, "Today at 11:04 AM") `[ASSUMPTION]`.

#### FR-12: Text Preview
When the Selection is a plain-text file, the system shall display its content as readable monospaced text.

**Consequences (testable):**
- Text files up to 1 MB display in under 100 ms.
- Files over 1 MB display a leading portion with a visible notice that content is truncated.

#### FR-13: Markdown Preview
When the Selection is a Markdown file, the system shall display it as formatted rich text (headings, lists, tables, code, links, images).

**Consequences (testable):**
- Output shall contain no executable content.
- Remote images and other remote resources are not fetched; a placeholder indicates a blocked remote resource.
- Links do not navigate the app away from the current page `[ASSUMPTION]`.

#### FR-14: Word document Preview
When the Selection is a Word (.docx) document, the system shall display its text and basic formatting.

**Consequences (testable):**
- A typical document (under 5 MB) displays in under 1 s.
- Output shall contain no executable content, and no remote resource is fetched.
- Legacy .doc files show a Metadata Card.

#### FR-15: PDF Preview
When the Selection is a PDF file, the system shall display its pages in the Preview Pane as a continuously scrollable sequence.

**Out of Scope:**
- Page-by-page navigation controls and custom zoom controls (later release).

#### FR-16: Image Preview
When the Selection is a PNG, JPEG, SVG or WebP image, the system shall display it scaled to fit the Preview Pane while preserving its aspect ratio.

**Consequences (testable):**
- Scripts embedded in an SVG do not run, and external references inside it are not fetched.
- Images smaller than the pane are not enlarged beyond their native size `[ASSUMPTION]`.

#### FR-17: Metadata Card fallback
When the Selection has no Preview, is empty (zero bytes) or cannot be rendered, the system shall display a Metadata Card with name, size, type and Last Modified. Realizes UJ-2.

**Consequences (testable):**
- Executables, archives and unknown formats show a Metadata Card.
- A zero-byte file shows a Metadata Card and indicates that it is empty.
- File type is determined from the file's extension and the type the device reports, without inspecting content `[ASSUMPTION]`.

#### FR-18: Render failure
If a Preview fails to render (for example, a corrupt document), then the system shall show a Metadata Card together with a short explanation, and shall remain responsive.

#### FR-19: Empty state
While no Selection exists, the Preview Pane shall show a clear, inviting prompt to select a file (or to open a folder if none is open). Realizes UJ-1.

### 4.4 Freshness
**Description:** v1 has no background change detection. The user decides when to re-read the disk. Realizes UJ-1.

**Functional Requirements:**

#### FR-20: Manual Refresh
When the user activates Refresh, the system shall re-read the Workspace Folder and the Selection from disk, and update the Tree, the Preview and the Last Modified Stamp.

**Consequences (testable):**
- Expanded folders stay expanded and the Selection is kept when its Entry still exists `[ASSUMPTION]`.
- New and removed Entries appear or disappear in expanded folders.
- After the Selection's file changed on disk, the Preview and stamp reflect the new content and time.

#### FR-21: Selection missing after Refresh
If the Selection no longer exists or is unreadable after Refresh, then the system shall clear the Selection and tell the user why. Realizes UJ-1 edge case.

### 4.5 Themes
**Description:** Three complete Themes make long sessions comfortable. Realizes UJ-2.

**Functional Requirements:**

#### FR-22: Choose a Theme
The system shall provide Light, Dark and Warm Sand Themes and a control to switch among them.

**Consequences (testable):**
- Switching applies immediately to every surface, including Tree, Preview Pane and rendered Previews, without a reload and without clearing the Selection or expansion state.
- Text and interactive elements meet WCAG 2.1 AA contrast in each Theme `[ASSUMPTION]`.

#### FR-23: Default and remembered Theme
When the app starts, the system shall apply the user's last chosen Theme or, if none, Light or Dark according to the device's appearance setting. The user's choice persists across sessions on their device `[ASSUMPTION]`.

### 4.6 Layout and Experience
**Description:** The v1 interface is a considered redesign: a two-pane layout in which the Tree and the Preview Pane share the window, designed for a maximized window. Detailed visual and interaction design is specified downstream in UX documents. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-24: Two-pane layout
The system shall present the Tree on the left and the Preview Pane on the right, with the Preview Pane receiving the majority of the available width.

**Consequences (testable):**
- The user can resize the divider between panes.
- Each pane scrolls independently.

#### FR-25: Placeholder content removed
The system shall not show sample or mock files at any point. Before a folder is chosen it shall show an open-folder prompt only.

**Feature-specific NFRs:**
- The UI is visually coherent and polished in all three Themes; the UX design pass owns visual specifics.

## 5. Non-Goals (Explicit)

- Not an editor or IDE: no editing, saving, renaming, moving or deleting.
- Not a search tool in v1: no file-name or content search.
- Not a live monitor in v1: no background polling, no change feed, no highlighting of new or modified files.
- Not a hosted service: no backend, accounts, uploads, telemetry or remote fetches.
- Not cross-browser in v1.

## 6. MVP Scope

### 6.1 In Scope
- Choose a Workspace Folder (read-only); lazy hierarchical Tree; single Selection.
- Previews: text, Markdown, PDF, Word (.docx), images; Metadata Card fallback.
- Last Modified Stamp, manual Refresh, dotfile toggle.
- Light, Dark and Warm Sand Themes with remembered choice.
- Keyboard and screen-reader accessible Tree and Previews.
- Substantial UI/UX redesign of the two-pane interface.

### 6.2 Out of Scope for MVP
- File operations of any kind.
- Multi-select; file-content search (roadmap candidates).
- Live change detection and change feed (v2).
- PDF page-turning and zoom controls (later).
- Code syntax highlighting (later).
- Specialized handling of single folders with 10,000+ Entries.
- Non-Chromium browsers (later).
- Remembering the last Workspace Folder across sessions `[ASSUMPTION]`.

## 7. Cross-Cutting Requirements

### 7.1 Performance
- **NFR-1:** Initial load shall transfer under 150 KB of gzipped script; heavy renderers (PDF, Word) load only on first use.
- **NFR-2:** Opening a folder of about 1,000 Entries shall show the Tree in under 300 ms; expanding a folder of similar size shall take under 100 ms.
- **NFR-3:** Preview timing targets are stated in FR-12 and FR-14.
- **NFR-4:** The interface shall remain responsive when the Workspace Folder contains thousands of Entries in total, with up to about 2,000 Entries in any single folder. Single folders of 10,000+ Entries are not a v1 target.

### 7.2 Privacy and Security
- **NFR-5:** The system shall make no network requests to external services and shall transmit no file content or metadata off the device.
- **NFR-6:** All rendered content shall be inert; no script from a previewed file shall execute.
- **NFR-7:** The system shall not persist file contents; only preferences (Theme, dotfile visibility) are stored on the device.

### 7.3 Accessibility
- **NFR-8:** All controls and Previews are keyboard-operable and expose appropriate roles and states to assistive technology (see FR-8); contrast per FR-22.

### 7.4 Platform
- **NFR-9:** Supported on current desktop Chrome and Edge. In an unsupported browser the app shall explain that it cannot open folders there.

## 8. Success Metrics

**Primary**
- **SM-1:** A timed walkthrough of UJ-1 (open folder, find three new files, preview each, refresh once) completes in under 30 s on a typical laptop with no perceptible lag. Validates FR-1, FR-4, FR-5, FR-7, FR-12–FR-16, FR-20.
- **SM-2:** Every performance target in NFR-1 to NFR-2, FR-12 and FR-14 is met in a measured run on a folder of about 1,000 Entries. Validates NFR-1–NFR-4.
- **SM-3:** The UJ-2 checklist passes end to end: large folder, dotfile toggle, three Themes, binary and zero-byte Metadata Cards, zero outbound requests on a hostile Markdown file. Validates FR-9, FR-17, FR-22, NFR-5, NFR-6.

**Secondary**
- **SM-4:** The production build and lint checks pass with no errors. Validates overall quality.
- **SM-5:** Daily use: the author reaches for file-browser instead of an IDE when only inspecting files.

**Counter-metrics (do not optimize)**
- **SM-C1:** Preview speed must not be gained by weakening sanitization or allowing a network request. Counterbalances SM-2.
- **SM-C2:** Bundle size must not be gained by dropping keyboard or screen-reader support. Counterbalances SM-2.

## 9. Open Questions

1. **Remember last folder:** should the app offer to reopen the last Workspace Folder, given that it requires re-granting access? Not a v1 blocker; deferred (§6.2). Revisit when daily use shows the re-pick friction.
2. **Product name:** "file-browser" is still the working title. Revisit before any public sharing.

*Resolved 2026-10-23:* Refresh reloads both Tree and active file (FR-20); text truncation at 1 MB accepted (FR-12); folder scale of about 1,000–2,000 Entries per folder (NFR-4); continuous-scroll PDF only (FR-15).

## 10. Assumptions Index

- §4.2 FR-5: Re-expanding shows cached contents without a visible reload.
- §4.2 FR-7: Selecting a folder toggles expansion and keeps the file Selection.
- §4.2 FR-9, §4.5 FR-23: Dotfile toggle and Theme choice persist locally across sessions.
- §4.3 FR-11: Relative day label ("Today at …") in the Last Modified Stamp.
- §4.3 FR-13: Links in Markdown do not navigate the app away.
- §4.3 FR-16: Small images are not enlarged.
- §4.3 FR-17: File type from extension and device-reported type only.
- §4.4 FR-20: Refresh keeps expansion state and Selection.
- §4.5 FR-22: WCAG 2.1 AA contrast in every Theme.
- §6.2: Last Workspace Folder is not remembered across sessions.
