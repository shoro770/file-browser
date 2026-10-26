# Epic 4 Context: Refresh to see what changed

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

After files change on disk from the terminal, one Refresh press makes the tree, the open preview and its Last Modified stamp match the disk, keeping expansion and selection. A removed selection clears with a clear message. Live change detection is out of v1; Refresh is the seam.

## Stories

- Story 4.1: Refresh the folder tree
- Story 4.2: Refresh the selected file's preview
- Story 4.3: Handle a missing selection and an unreadable folder

## Requirements & Constraints

- Refresh re-reads the root and every expanded folder only; collapsed and never-expanded folders are never read. Per entry only `name` and `kind`; `getFile()` only for the Selection.
- Ids are normalized relative paths, so expansion and selection survive by id. A surviving id whose kind changed is a different entry.
- Dotfile visibility is a view filter and is untouched by Refresh.
- A second request while one runs is ignored. The button keeps its label and gets `aria-busy`; focus stays on it.
- Read-only access, no network, no backend, no icon library (inline SVGs).

## Technical Decisions

- `services/tree` is the only writer; components call the `refresh` intent through `hooks/useTree`. No `useState` copy of tree data.
- Selection preview reload runs through a new `previewSession` (aborts the old one, revokes its URLs, discards late results).
- Pure reconcile logic belongs in `lib/` with JSDoc and unit tests.

## UX & Interaction Patterns

- Polite status region announces "Refreshing..." then "Refreshed."; identical strings re-announce by clearing, then setting on the next frame.
- Refresh button: disabled with no folder (keeps outline, `text-muted`); toolbar order is Open folder, name, Hidden files, Refresh.
- Roving tabindex is repaired immediately when the tab-stop row vanishes.
- Missing selection: pane returns to the prompt with a notice until the next selection. Unreadable root: keep everything, inline message mirrored to `role="alert"`.

## Cross-Story Dependencies

- 4.1 builds the `refresh` intent and button; 4.2 adds the selection reload to it; 4.3 adds the missing-selection and unreadable-folder messages.
