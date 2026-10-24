# Epic 1 Context: Open a folder and navigate it

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

The user picks a local folder and sees it in a fast, lazy, keyboard-accessible tree beside a resizable preview pane, with the option to hide dotfiles. It is also the brownfield rework that sets the foundation for later epics: layering with a `hooks/` layer, path-based `FileItem` ids, a central tree store, `Tree`/`TreeNode` replacing `FileRow`, mock-data removal, design tokens, an unsupported-browser screen and a Vitest runner.

## Stories

- Story 1.1: App shell, design tokens and unsupported-browser screen
- Story 1.2: Open a folder and see its top level
- Story 1.3: Expand and collapse folders
- Story 1.4: Select a file
- Story 1.5: Navigate the tree by keyboard
- Story 1.6: Unreadable entries stay contained
- Story 1.7: Hide and show dotfiles
- Story 1.8: Resize the panes

## Requirements & Constraints

- Choosing a folder replaces the previous tree and clears the selection. Cancel is silent and leaves state unchanged. Denied access keeps state and shows one inline message.
- Access is strictly read-only: nothing is ever created, modified, renamed or deleted, and no control can write.
- Only immediate children are read, on expand. Collapsed or never-expanded folders cause no read. Re-expanding shows cached children with no reload. Collapse keeps descendants' expansion state until a new folder is chosen.
- Ordering is folders first, then case-insensitive natural order.
- Selection is single-item and file-only. Selecting a folder toggles it and leaves the selection alone.
- Dotfiles (any name starting with ".") are shown by default at 60% opacity. The toggle persists across sessions, never re-reads disk, and never collapses folders. If the selection is hidden it clears.
- An unreadable entry is marked unavailable and the rest of the tree stays usable.
- Two panes with a resizable divider and independent scrolling. The preview gets the majority of the width. Before a folder is chosen only the open-folder prompt shows, never sample or mock files.
- Performance: a folder of about 1,000 entries opens in under 300 ms and expands in under 100 ms. The UI stays responsive with thousands of entries in total and up to about 2,000 in one folder.
- No network requests and no persisted file content. Only the `theme` and `showDotfiles` preferences are stored. Supported browsers are current desktop Chrome and Edge, and other browsers get an explanation screen.
- Keyboard and assistive-technology operability. Contrast meets WCAG 2.1 AA in every theme.

## Technical Decisions

- Layering is one-way: `types <- lib <- services <- hooks <- components`. `lib/` is pure. Components never import `services/` and go through `hooks/`.
- Keep the existing split and helpers (`categorizeFile`, `compareFileItems` as the single ordering rule, `formatSize`, `formatPath`, the read-only picker call, `isFolderPickerSupported`, explicitly typed props).
- `FileItem` is serializable pure data: `id`, `name`, `path`, `isDirectory`, optional `size`, `updatedAt`, `category`. `url` and `children` are removed. `id` is the normalized relative path (`/`-separated, no leading or trailing slash, root = `''`), stable across reads. `path` is `/` + id.
- `services/tree` is the only holder of handles, children cache, expansion set, selection id and unavailable marks, and the only writer. Its intents are `openWorkspace`, `toggle`, `select` and `refresh`. React reads it through `hooks/useTree` with `useSyncExternalStore` and immutable snapshots. A new folder discards all state.
- Listing is lazy and one level, names and kinds only (`handle.values()`). `getFile()` is not called at list time. A folder is read at most once until Refresh. A throwing read becomes a typed `unavailable` outcome, not a thrown error.
- `services/fs` is the only module referencing `FileSystem*Handle`. Allowed calls are `showDirectoryPicker({ mode: 'read' })`, `values()`, `getDirectoryHandle()`, `getFileHandle()`, `getFile()`, and `queryPermission`/`requestPermission` with `{ mode: 'read' }`. `createWritable`, `removeEntry`, `move`, `readwrite` and `FileSystemWritableFileStream` are forbidden, enforced by a grep gate in the lint step.
- Retire `FileRow`. `Tree` (`role="tree"`, named "File tree") renders `TreeNode` (`role="treeitem"`, `role="group"` around children) and alone owns roving tabindex and the keyboard map. Delete `MOCK_FILES`, `App`'s `openedItems` ref and eager PDF object URLs. `AGENTS.md` is amended to tree semantics before the first tree story (owner action).
- `services/prefs` persists only `theme` and `showDotfiles` in `localStorage`, every access in `try/catch`. The folder, handles, paths and divider width are never persisted.
- Themes are CSS custom-property sets under `:root[data-theme="light|dark|sand"]`, with 18 identical color roles plus typography, radius and spacing variables, and `color-scheme` per theme. Components use role variables only, with no hex values or theme branching. System fonts only. The default theme follows `prefers-color-scheme` and is never Sand.
- Meta CSP and no inline `style` attributes apply (inline `style` is blocked), so dynamic widths use CSS custom properties or classes. No `fetch()` calls.
- Conventions: components `PascalCase.tsx`, hooks `useThing.ts`, shared types in `src/types.ts`, UX strings taken from the EXPERIENCE.md voice and never raw error text. `lib/` functions carry JSDoc `@param`/`@returns` and Vitest tests; the runner is added in Story 1.2. Icons are inline SVG only (no icon library). `npm run build` and `npm run lint` must pass, and `git status` must show only intended files.

## UX & Interaction Patterns

- Toolbar (`<header>`, min-height 2.75rem): Open folder, Workspace Folder name (truncating), Hidden files toggle, theme control. It wraps at 200% zoom. Only working controls appear in each story. Page structure: `<main>` for the preview, a visually hidden `h1` "file-browser", and a document title that includes the folder name.
- Tree row: 28px min height, 16px indent per level, chevron (folders only, rotates 90 degrees), 16px kind glyph (seven inline SVGs mapped by extension), truncating label with a `title`. Hover uses `row-hover`. Selected uses `row-selected` plus a 3px `accent` `border-inline-start`. Focus ring is 2px inset in `focus-ring`.
- Dotfile dimming applies to glyph and label only, at rest only, per element, never to the row background, the Unavailable suffix or placeholder rows. Opacity resets to 1 in forced-colors mode.
- Unavailable row: warning glyph plus "Unavailable" suffix in `danger-text`, described as "Unavailable, can't be read" via `aria-describedby`. An unavailable folder shows the child row "This folder can't be read."
- Placeholder rows ("Empty folder", "No visible files", "Loading...") are `treeitem`s with `aria-disabled`, are reachable by arrows and are never selectable. "Loading..." and the spinner appear only after 150 ms.
- ARIA: folders have `aria-expanded` and no `aria-selected`. Files have `aria-selected`. All rows have level, setsize and posinset. Exactly one row has `tabIndex=0`, repaired on any rebuild by the priority: current row, nearest surviving ancestor or previous row, selected row, first row.
- Keys: Up/Down, Right (expand, then first child), Left (collapse, then parent), Enter/Space (select or toggle, no page scroll), Home/End, PageUp/PageDown, type-ahead (500 ms accumulation). Tab leaves the tree. Tab order is toolbar, Tree, divider, Preview Pane.
- Divider: focusable `role="separator"` labeled "Resize file tree", with `aria-valuenow/min/max`, a 12px hit area and a visible grip. Left/Right move 16px (Shift 64px), Home/End jump to min/max, and Enter or double-click resets to 280px. Width is clamped to a 220px minimum and a maximum of the smaller of 480px and 40% of the window (the minimum wins), and the preview is never under 320px. Default is 280px.
- Hidden files toggle: constant name "Hidden files", `aria-pressed` true means shown, eye/eye-slash glyph plus a visible "Shown"/"Hidden" word. It is usable with no folder open. If hiding removes the focused row, focus moves to the previous visible row or the parent.
- Prompts and empty states: open-folder prompt, "Select a file to preview it." / "Folders open in the tree on the left.", "This folder is empty.", and "Nothing to show." / "Hidden files are turned off."
- Focus: after a folder is chosen, focus goes to the first tree row without selecting it (or to Open folder if the folder is empty). Cancel or denial returns focus to Open folder. Selecting never moves focus out of the tree.
- A persistent visually hidden `role="status"` region announces "Opened {name}", "Previewing {name}" and "Selection cleared". The access-denied message is also mirrored in `role="alert"`. It is shown once inline under the toolbar and dismissed on the next action.
- Unsupported-browser screen replaces the whole app: a single `<main>`, an `h1` "This browser can't open folders.", a 480px column, no controls.
- No shadows, gradients, blur, modals or popovers. Transitions are 120 ms color or opacity only, and `prefers-reduced-motion` removes them (static spinner, instant chevron). Forced-colors mode maps to system colors.

## Cross-Story Dependencies

- Story 1.1 (tokens, shell) underlies every other story. Story 1.2 needs the `AGENTS.md` tree-semantics amendment first and introduces `lib` tests (Vitest), `services/fs`, `services/tree`, `useTree`, `Tree`/`TreeNode` and the live region that later stories build on.
- Story 1.3 needs the 1.2 tree store. Story 1.4 needs rows from 1.2/1.3 and introduces the select-a-file prompt that Epic 4 and Story 1.7 return to when clearing the selection.
- Story 1.5 completes the keyboard model and the roving-tabindex repair, which 1.3, 1.6, 1.7 and later rebuilds rely on. It also needs the divider (1.8) in the tab order.
- Story 1.6 adds unavailable marks used by the 1.3 placeholder rows. Story 1.7 adds `services/prefs` and depends on the cached-children model.
- Outside the epic: Epic 2 consumes the Selection through `useTree` and replaces the prompt pane with previews. Epic 4 Refresh builds on the tree store. Epic 5 adds the theme control and the final accessibility audit on the tokens defined in 1.1.
