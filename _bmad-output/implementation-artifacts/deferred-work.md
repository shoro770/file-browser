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
