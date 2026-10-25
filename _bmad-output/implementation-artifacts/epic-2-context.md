# Epic 2 Context: Preview text, images and fallbacks

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Selecting a file immediately shows text, an image or a Metadata Card, with a Preview Header and Last Modified stamp. The preview pane is never blank and never shows raw error text. The epic adds the kind resolver, the preview dispatcher, the selection-scoped preview session and the empty and prompt states.

## Stories

- Story 2.1: See a selected file's details
- Story 2.2: Preview text files
- Story 2.3: Preview images
- Story 2.4: Failed previews degrade gracefully

## Requirements & Constraints

- The preview pane shows a header (kind glyph, file name, "Modified {when}") only while a file is selected.
- Anything without a renderer, empty, legacy `.doc` or unknown gets a Metadata Card (Size, Type, Last modified plus a short explanation). Type comes from extension and device-reported type only, with no content sniffing.
- Latest selection wins: a slow read never paints over a newer selection. Previous content stays until the new one is ready; "Loading preview..." appears after 150 ms.
- Text previews are truncated at 1 MB. Images render only as `<img src="blob:...">`; SVG is never inlined.
- No network requests, no `fetch()`, no inline `style` attributes, no writes to the user's files.

## Technical Decisions

- `lib/preview.ts` holds `resolvePreviewKind(name, mime)` returning `text | markdown | pdf | docx | image | metadata`. It is the single source for preview kind, tree glyph and card glyph.
- `services/previewSession` owns one `AbortController`, the `File` read and every object URL per selection. Starting a session aborts and revokes the previous one. Only it calls `URL.createObjectURL`/`revokeObjectURL`.
- One `PreviewPane` dispatcher picks a renderer by kind and passes a `PreviewSource` (`{ file, signal }` plus metadata), never a handle. Renderers do not import `services/tree`. A renderer that throws renders the Metadata Card.
- `size`, `updatedAt` and type come from `getFile()` for the Selection only. Components reach services through `hooks/`.
- `PreviewKind` and `PreviewSource` are exported from `src/types.ts`.

## UX & Interaction Patterns

- Preview Pane is `<main>` containing a `role="region"` labelled by the header `h2`; `tabindex="0"` only while a file is selected. In prompt and empty states it has a static label and is not a tab stop. Tab order: toolbar, Tree, divider, Preview Pane.
- Stamp formats: "Today at 11:04 AM", "Yesterday at 4:30 PM", "Oct 21, 2026 at 3:12 PM", inside `<time datetime>`.
- Metadata Card: centered, 420px, `surface-raised`, `border-strong`, `rounded.lg`, 48px glyph, `h2` name, definition list (Size, Type, Last modified).
- Announcements: "Previewing {name}" on activation, "{name}: no preview available" for card outcomes, never on arrow-key moves.

## Cross-Story Dependencies

- Story 2.1 builds the resolver, session, dispatcher and card that Stories 2.2 and 2.3 plug renderers into; Story 2.4 reuses the card for failures.
- Epic 3 renderers (Markdown, DOCX, PDF) reuse the same dispatcher and session.
