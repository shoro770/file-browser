# Ideas

Format: `- [P<1-3> · <S|M|L>] short description`
P1 = high priority, P3 = low. S/M/L = rough complexity guess (files touched + effort), updated if it turns out different.

## Features

- [P2 · M] Render HTML files nicely (today shown as source); first re-examine whether the no-HTML-render rule is really needed, and how to render safely
- [P2 · S] Small icon buttons on the file: copy all content, copy file name, copy full path
- [P2 · S] Filter by file type (html, pdf, ...)
- [P3 · L] Allow editing/writing/copy/move/delete files; first a thorough security + permissions review (Chrome on Mac)
- [P3 · M] Windows support; first check how different it is and what it takes
- [P2 · M] Right-click context menu: preview-specific commands, and file/folder commands in the tree
- [P1 · L] Tabs for many open files; decide model first (preview tab replaced on next click vs. every open stays until closed)
- [P2 · L] Long-term goal: Notepad++ / Everything level; start with reading + writing files and fast search inside files; needs real planning (full BMAD flow)
- [P3 · L] Run commands inside the app (e.g. Claude Code); feasibility depends on leaving pure browser (needs local helper or desktop wrapper, conflicts with no-backend policy)
- [P2 · M] Remember the last opened folder; after a page reload offer to reopen it
- [P2 · M] Right-to-left display for the file preview: auto-detect RTL text, plus a small toggle button above the file
- [P2 · M] For a file type with no preview, offer to open it as plain text (works for some files, not others)

## UI / UX

- [P2 · M] Rethink the row above the preview and its buttons (hidden files toggle, color theme switch): layout, grouping, labels

## Bugs

- [P2 · S] Very long file name overflows the tree width (even at max tree width); decide how to handle it
