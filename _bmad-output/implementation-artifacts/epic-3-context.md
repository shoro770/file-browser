# Epic 3 Context: Read Markdown, Word and PDF safely

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Markdown, `.docx` and PDF files preview as formatted content in the Preview Pane, and previewed content cannot run scripts or make network requests, even when the file is hostile. The epic adds the sanitizer, the lazy-loaded renderers, a meta CSP as a second wall, bundle-budget checks, a narrowed PDF embed and a hostile-Markdown zero-request proof.

## Stories

- Story 3.1: Preview Markdown safely
- Story 3.2: Preview Word documents
- Story 3.3: Preview PDFs
- Story 3.4: Lock the page down and prove nothing leaves it

## Requirements & Constraints

- Every renderer that produces HTML passes it through one sanitizing chokepoint before the DOM. It is an allowlist: no scripts, event-handler or `style` attributes, iframes, objects, embeds or forms, and no `src`/`href` pointing off the page (including `javascript:` and `data:`). Weakening it for speed or size is prohibited.
- Remote images become a "Remote image blocked" placeholder with no request. `#anchor` links stay in the page and scroll within the pane; every other link becomes plain text. Remaining links are underlined (1px, `accent`, offset 2px) in every theme.
- Initial JS stays under 150 KB gzipped; any dependency over about 15 KB gzipped loads only through a dynamic `import()` reachable from its renderer. Each story that adds a dependency records the measured build size and verifies the library and version against current documentation.
- Renderers never call `fetch()` and never set inline `style` attributes. Markdown over 1 MB is cut like text (leading 1 MB plus the pinned banner). A renderer that throws shows the Metadata Card with the render-failure text.
- The zero-outbound-request claim is proven against `vite build` + `vite preview` with hostile Markdown (Story 3.4), not the dev server.

## Technical Decisions

- `services/sanitize` needs the DOM, so it lives in `services/` and is unit-tested in a Vitest DOM environment (added by Story 3.1). Components reach it only through `hooks/`.
- `markdown`, `docx` and `pdf` renderers load via `React.lazy` or dynamic `import()` from the `PreviewPane` dispatcher. Renderers take a `PreviewSource` and never a handle.
- Only `previewSession` creates or revokes object URLs; the PDF `blob:` URL is created lazily on selection. `lib/pdf.ts` keeps only `isPdf`; `countPdfPages` and PDF `fetch()` are removed (Story 3.3).
- `index.html` gets a meta CSP: `default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; object-src blob:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'`, adjusted only where measured need requires, each deviation recorded. It is not a guarantee (no `frame-ancestors`, no top-level navigation stop); the sanitizer stays the first wall.

## UX & Interaction Patterns

- Prose is capped at 760px, left-aligned; headings scale from `heading-lg` (h1) to `ui-body` bold (h5–h6); code uses the `code` token on `code-bg`. Rendered content follows theme variables without re-rendering.
- The blocked placeholder: `placeholder-bg`, 1px dashed `border-strong`, image-off glyph, minimum 120×48px, label "Remote image blocked", alt text as caption when present, accessible name "Remote image blocked".
- The pane stays a focusable, scrollable region; remaining links are reachable in order.

## Cross-Story Dependencies

- Story 3.1 introduces the sanitizer, the DOM test environment and the placeholder; Story 3.2 (DOCX) reuses the same sanitizer with no weaker path.
- Story 3.3 depends on the dispatcher and session from Epic 2; Story 3.4 asserts the CSP against all renderers, so it follows 3.1–3.3.
- The epic-2 rules require the DOM test environment before renderers are added; Story 3.1 is where it lands.
