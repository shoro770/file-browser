- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-app-shell-design-tokens-and-unsupported-browser-screen.md`
  summary: Add unit tests for `parseTheme`/`resolveTheme` once the Vitest runner exists.
  evidence: Pure theme logic has no running test; the "never default to sand" rule is pinned only by a manual check (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-app-shell-design-tokens-and-unsupported-browser-screen.md`
  summary: Cover the `App` unsupported-browser gate and the `prefs` storage fallbacks with component and stub tests.
  evidence: An inverted `folderPickerSupported` condition would pass build and lint; needs component-test tooling (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-open-a-folder-and-see-its-top-level.md`
  summary: Add a DOM test environment and component tests for `Tree`/`App` (single `tabIndex=0` row, focus handoff, denied alert, persistent live region).
  evidence: A regression such as `tabIndex={0}` on every row, or a removed `setDenied(false)`, passes build, lint and `npm test`; needs jsdom or happy-dom plus Testing Library (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-expand-and-collapse-folders.md`
  summary: Cover `Tree`/`TreeNode` rendering (visible-set tab stop after collapse, `aria-expanded`, `role="group"`, `aria-level`, Enter/Space/Right toggling without bubbling) once a DOM test environment exists.
  evidence: Removing `role="group"`, the `target === currentTarget` key guard, or the visible-set check passes build, lint and `npm test` (unverified medium); extends the Story 1.2 component-test entry.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-4-select-a-file.md`
  summary: Add component tests for `TreeNode` activation routing (file selects, folder toggles, `event.repeat` ignored) and the `App` "Previewing {name}" announcement once a DOM test environment exists.
  evidence: Swapping the `activate()` branches or dropping the announcement passes build, lint and `npm test` because the store never receives folder ids (unverified medium); extends the Story 1.2 and 1.3 component-test entries.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-5-navigate-the-tree-by-keyboard.md`
  summary: Add component tests for the `Tree` keyboard map (arrows, Right/Left, Home/End, Enter/Space, `event.repeat`, modifier pass-through) and the tab-stop and focus-restore repair once a DOM test environment exists.
  evidence: Swapping ArrowUp/ArrowDown or returning null from `survivingKey` passes build, lint and `npm test` because only the pure helpers are tested (unverified medium); extends the Story 1.2 to 1.4 component-test entries.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-unreadable-entries-stay-contained.md`
  summary: Add component tests for the Unavailable row (suffix, `aria-describedby` target text, "This folder can't be read." placeholder) and for `Tree.renderRows` agreeing with `visibleRows` on placeholder order, once a DOM test environment (or `renderToStaticMarkup`) exists.
  evidence: Deleting the `else if (unavailable)` branch in `Tree.tsx` or the `aria-describedby` passes build, lint and `npm test` because only the store and `visibleRows` are tested (unverified medium); extends the Story 1.2 to 1.5 component-test entries.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-7-hide-and-show-dotfiles.md`
  summary: Add component tests for the Hidden files toggle (name, `aria-pressed`, description), the "No visible files" vs "Empty folder" label, the "Nothing to show." pane, the "Selection cleared" announcement and focus moving off a hidden row, once a DOM test environment exists.
  evidence: Always labelling "Empty folder", dropping the `isDotfileId` guard in `App.handleToggleDotfiles`, or breaking the `lastKeys` hand-off passes build, lint and `npm test` because only `lib/` and the store are tested (unverified medium); extends the Story 1.2 to 1.6 component-test entries.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-8-resize-the-panes.md`
  summary: Add component and hook tests for `PaneDivider` (ARIA attributes, key dispatch, drag offset, drag-end events) and `usePaneWidth` (window-resize re-clamp and `aria-valuemax`), once a DOM test environment exists.
  evidence: Deleting the `resize` listener, the grab offset or `onLostPointerCapture` passes build, lint and `npm test` because only `lib/layout` is tested (unverified medium); extends the Story 1.2 to 1.7 component-test entries.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-preview-images.md`
  summary: Check in a browser that an SVG with only a `viewBox` (no width or height) sizes sensibly, and that `max-height: 100%` on `.image-preview__img` resolves against `.image-preview` inside the scrolling `.preview`.
  evidence: An intrinsic-size-less SVG may render at the browser default or collapse, and a non-resolving percentage would let tall images overflow instead of fitting; neither can be proven headlessly (unverified medium); settled by selecting such files in Chrome or Edge.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-preview-markdown-safely.md`
  summary: Add hook tests for `usePreview` (previous result kept while loading, idle reset on a cleared selection, "Loading preview..." only after 150 ms), the one Epic 2 preview entry this story's jsdom tests did not close.
  evidence: Dropping the idle reset or the loading timer passes build, lint and `npm test`, because `PreviewPane` tests pass `loading` in by hand and `usePreview` itself is untested (unverified medium). Story 3.1 closed the `PreviewPane`, `PreviewHeader`, `MetadataCard`, `TextPreview`, `ImagePreview` and `PreviewBoundary` entries from Stories 2.1 to 2.4 with jsdom tests.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-preview-text-files.md`
  summary: Check in Chrome or Edge the text preview behaviors jsdom cannot show: sticky header and banner while scrolling, keyboard scroll, the 100 ms render and three-theme contrast.
  evidence: Layout, sticky positioning and contrast have no layout engine in jsdom, so Story 3.1's component tests do not cover them (unverified medium); carried from the Story 2.2 entry that those tests otherwise closed.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-preview-images.md`
  summary: Check in Chrome or Edge the image behaviors jsdom cannot show: fit and no-enlarge sizing, animated GIF autoplay, a hostile SVG making no request, rapid clicking, the decoded `<img>` surviving its URL being revoked, a real `.heic` and a corrupt `.png` showing the card, and three-theme rendering.
  evidence: jsdom decodes no images and has no layout, so none of this is exercised (unverified medium); carried from the Story 2.3 and 2.4 entries that the jsdom tests otherwise closed.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-preview-markdown-safely.md`
  summary: Check `MarkdownPreview` in Chrome or Edge against `vite build` + `vite preview` with the network panel open: a hostile `.md` (remote image, script, `onerror`, `javascript:` link, `style`) makes zero requests; a 3 MB `.md` shows the pinned banner; anchors scroll under the sticky header (`scroll-margin-top`); Tab reaches the region and remaining links; prose is capped at 760px and follows all three themes; the link underline and placeholder are readable in each theme.
  evidence: Story 3.1 was verified only in jsdom, which loads no images, has no layout and never sees a real CSP or network panel; the SM-3 proof is Story 3.4's job, and the lazy chunk was measured but not loaded in a browser (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-preview-markdown-safely.md`
  summary: Decide whether `PreviewPane` should show a placeholder while the lazy Markdown chunk loads (the `Suspense` fallback is `null`, so the body is empty for that moment on first use).
  evidence: The header and the "Loading preview..." status stay, but the body is blank until the chunk arrives; not measurable headlessly (unverified low).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-preview-markdown-safely.md`
  summary: Measure how long `marked` plus DOMPurify block the main thread for a 1 MB Markdown file, including pathological input (deep nesting, many unclosed delimiters), and decide whether to move rendering to a Worker or cap nesting.
  evidence: `renderMarkdown` runs both synchronously and ignores `source.signal`, so a stale render cannot be cancelled and a slow one freezes the pane; no timing was taken (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-preview-markdown-safely.md`
  summary: Make wide code blocks keyboard-scrollable (`tabindex="0"` on an overflowing `pre`) and confirm in a browser that a failed lazy chunk load (offline or stale hash) lands on the Metadata Card.
  evidence: `pre` uses `overflow-x: auto` but is not a tab stop, so a keyboard user cannot scroll a wide block sideways; overflow is only known in a real layout engine (unverified medium). The chunk-failure path relies on `PreviewBoundary` sitting outside `Suspense` and was not simulated.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-preview-markdown-safely.md`
  summary: Decide whether to allow `details`/`summary` and keep alt text for badge-style images, since every image is a 3rem blocked placeholder and collapsible sections always render open.
  evidence: README-style Markdown with badge rows shows several placeholders; this follows the AC (all images blocked) but may read poorly (unverified low).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-preview-word-documents.md`
  summary: Check `DocxPreview` in Chrome or Edge against `vite build` + `vite preview` with the network panel open: a real Word export and a hostile `.docx` (script text, `javascript:` link, linked image) make zero requests; a ~5 MB `.docx` paints in under 1 s from click including the first lazy load; headings, lists, tables and embedded images look right; prose is capped at 760px and follows all three themes.
  evidence: Story 3.2 was verified only in jsdom with synthetic `.docx` fixtures built in tests, which has no layout, no real Word output, no timing and no network panel; the SM-3 proof is Story 3.4's job (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-preview-word-documents.md`
  summary: Decide whether Word bookmark links (table of contents, cross-references) should work beyond the name-matches-heading case: the sanitizer strips ids, so a `#bookmark` link survives only when its name slugs to a heading's text.
  evidence: Word tables of contents link to `_Toc…` bookmarks, which match no heading, so those entries show as plain text; this follows the accepted open-question default (unverified low).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-preview-word-documents.md`
  summary: Decide whether `renderDocx` should tell the reader when mammoth skipped content (text boxes, headers, footers, comments, tracked changes), and what an empty conversion result should show.
  evidence: Only `result.value` is used; `result.messages` is dropped, so a partial or blank document looks complete (unverified low).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-preview-word-documents.md`
  summary: Measure main-thread time and memory for a large `.docx` (many images, which become base64 `data:` URLs) and decide on a size cap or a Worker; `renderDocx` reads the whole file and cannot cancel the conversion mid-way.
  evidence: `mammoth` runs on the main thread and only the checks before and after it honor `source.signal`; no timing was taken (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-preview-word-documents.md`
  summary: Decide whether `PreviewPane` should show a placeholder while the lazy Word chunk loads (the `Suspense` fallback is `null`); the chunk is much larger than the Markdown one.
  evidence: The header and the "Loading preview..." status stay, but the body is blank until the chunk arrives on first use; not measurable headlessly (unverified medium).
