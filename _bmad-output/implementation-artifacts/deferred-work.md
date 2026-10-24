- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-app-shell-design-tokens-and-unsupported-browser-screen.md`
  summary: Add unit tests for `parseTheme`/`resolveTheme` once the Vitest runner exists.
  evidence: Pure theme logic has no running test; the "never default to sand" rule is pinned only by a manual check (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-app-shell-design-tokens-and-unsupported-browser-screen.md`
  summary: Cover the `App` unsupported-browser gate and the `prefs` storage fallbacks with component and stub tests.
  evidence: An inverted `folderPickerSupported` condition would pass build and lint; needs component-test tooling (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-open-a-folder-and-see-its-top-level.md`
  summary: Add a DOM test environment and component tests for `Tree`/`App` (single `tabIndex=0` row, focus handoff, denied alert, persistent live region).
  evidence: A regression such as `tabIndex={0}` on every row, or a removed `setDenied(false)`, passes build, lint and `npm test`; needs jsdom or happy-dom plus Testing Library (unverified medium).
