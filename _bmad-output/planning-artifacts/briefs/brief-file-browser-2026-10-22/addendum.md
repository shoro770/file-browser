# Addendum: file-browser brief

Depth that belongs downstream (PRD, architecture) rather than in the brief.

## Current repo state (2026-10-22, branch feat/pdf-preview)
- Flat single-folder list via `FileRow` (listbox, roving tabindex); no tree, no recursion.
- `src/services/directory.ts`: `showDirectoryPicker({mode:'read'})`, skips dotfiles, builds `blob:` URLs for PDFs only, directories report no size or mtime.
- `PdfPreview`: `<object>` embed plus regex page count (`src/lib/pdf.ts`); can't read page trees in compressed object streams.
- App still shows `MOCK_FILES` until a folder is opened. README is a bare title.

## Implications for architecture
- v1 needs a recursive `FileItem` tree with lazily populated `children` (type already has optional `children`) and a way to keep directory handles for on-demand expansion; today `toFileItem` discards the handle.
- Blob URLs are created eagerly for PDFs; with a tree this must become on-demand to keep folder opens instant.
- DOCX (e.g. mammoth) and Markdown renderers are new dependencies; load them as lazy chunks to protect the initial-load budget. Sanitize their HTML output.
- Dotfile default flips from hidden to visible; `.git` and `node_modules` become visible, so lazy loading is mandatory, not optional.
- Theming: three palettes via CSS custom properties; plain CSS only, no Tailwind (decided). Dotfiles use `opacity: 0.6`.
- Images: render through `<img src={URL.createObjectURL(file)}>`; revoke the object URL when selection changes. SVG only via `<img>`, never inlined, so scripts cannot run and external references are not fetched. This replaces the earlier "images go to the metadata card" plan; the metadata card remains for other binaries.
- Security: sanitize all Markdown and DOCX HTML; block every external fetch (remote images, links, fonts) to honor the no-network policy.

## Roadmap parked
- v2: background polling or change detection (File System Access API has no reliable push events), highlight new/modified, change feed.
- Later: search, multi-select, code previews, richer image handling (zoom, EXIF), non-Chromium fallback (`<input webkitdirectory>`).

## Tensions resolved
- Promise leads with live awareness; v1 defers it. Resolved: v1 = previewer with manual freshness, live = v2 (user confirmed).
