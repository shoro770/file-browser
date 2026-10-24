- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-app-shell-design-tokens-and-unsupported-browser-screen.md`
  summary: Add unit tests for `parseTheme`/`resolveTheme` once the Vitest runner exists.
  evidence: Pure theme logic has no running test; the "never default to sand" rule is pinned only by a manual check (unverified medium).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-app-shell-design-tokens-and-unsupported-browser-screen.md`
  summary: Cover the `App` unsupported-browser gate and the `prefs` storage fallbacks with component and stub tests.
  evidence: An inverted `folderPickerSupported` condition would pass build and lint; needs component-test tooling (unverified medium).
