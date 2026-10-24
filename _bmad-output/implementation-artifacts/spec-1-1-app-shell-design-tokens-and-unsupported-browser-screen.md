---
title: 'App shell, design tokens and unsupported-browser screen'
type: 'feature'
created: '2026-10-25'
status: 'done'
baseline_commit: '318a954e18719b4d5e343bbdfac023a89e1e97ce'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app is a Vite scaffold with mock files, shadows and one hard-coded palette. There is no two-pane shell, no theme system, and unsupported browsers get a small notice instead of an explanation screen.

**Approach:** Replace the scaffold shell with a `<header>` toolbar over a tree pane and a `<main>` preview pane, driven by three CSS-variable themes (light, dark, sand) from `DESIGN.md`. Browsers without `showDirectoryPicker` get a single-`<main>` explanation screen instead.

## Boundaries & Constraints

**Always:** System fonts only, sizes in `rem`, `tabular-nums` for sizes/dates. Component CSS uses role variables only (no hex, no `[data-theme]` selectors). Transitions: 120 ms colour/opacity only, none under `prefers-reduced-motion: reduce`. Every `localStorage` access in `try/catch`. Props typed in `src/types.ts`. Layering `types <- lib <- services <- hooks <- components`; `lib/` pure with JSDoc `@param`/`@returns`. No inline `style` attributes, no network requests, no new dependencies.

**Never:** Shadows, gradients, blur, modals, popovers. Web fonts or CDNs. Tree, Open folder button, Hidden-files toggle, theme control, divider or preview content (later stories; show only working controls). Edits to `AGENTS.md`, `FileRow.tsx`, `PdfPreview.tsx`, `lib/files.ts`, `lib/format.ts`, `lib/pdf.ts`, `services/directory.ts`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Supported, no stored theme | `showDirectoryPicker` exists, prefers dark | `data-theme="dark"` on `<html>`; header, tree pane, `<main>` render | N/A |
| Supported, no stored theme, light | prefers light/no preference | `data-theme="light"`, never `sand` | N/A |
| Storage throws | `localStorage.getItem` throws | Same default as above, nothing shown | Swallowed in `try/catch` |
| Stored theme valid | `light`/`dark`/`sand` stored | That theme applied | N/A |
| Stored theme invalid | any other string | Treated as absent | Falls back to system default |
| Unsupported browser | no `showDirectoryPicker` | One `<main>`: `h1` "This browser can't open folders." + body, 480px column on `bg`; no header, panes or controls | N/A |

</frozen-after-approval>

## Code Map

- `index.html` -- set title to `file-browser` (lang already `en`); no CSP yet (deferred by AD-12).
- `src/index.css` -- Vite scaffold CSS with shadows and one palette; replace with tokens + reset.
- `src/App.css` -- scaffold shell/FileRow/PdfPreview styles; replace with shell + unsupported-screen styles. FileRow/PdfPreview become unstyled orphans until Story 1.2.
- `src/App.tsx` -- holds `MOCK_FILES`, `FileRow` list, `openedItems`, `pickFolder` wiring; replace with shell. Reuse nothing from it.
- `src/main.tsx` -- entry; compute support via `isFolderPickerSupported` (`src/services/directory.ts`), apply theme before first render, pass props to `App`.
- `src/types.ts` -- add `Theme` and `AppProps`; leave existing types alone.
- `src/lib/theme.ts` (new) -- pure `parseTheme`, `resolveTheme`.
- `src/services/prefs.ts` (new) -- `readTheme()`; storage access wrapped in `try/catch`; `systemPrefersDark()`.
- `src/components/UnsupportedBrowser.tsx` (new) -- explanation screen.
- Body copy: "file-browser needs folder access, which is available in current desktop Chrome and Edge. Open this page in one of those to continue."
- Tokens: DESIGN.md frontmatter `colors:` lists 18 roles per theme (bg, surface, surface-raised, row-hover, row-selected, border, border-strong, text, text-muted, accent, on-accent, focus-ring, notice-bg, notice-text, notice-border, danger-text, code-bg, placeholder-bg) as `{theme}-{role}` hex values; also typography, rounded, spacing, sizes (tree 280/220/480, toolbar 44px, row 28px, preview-min 320px).

## Tasks & Acceptance

**Execution:**
- [x] `src/types.ts` -- add `Theme = 'light' | 'dark' | 'sand'`, `THEMES`, `AppProps { folderPickerSupported: boolean }` -- shared typed props
- [x] `src/lib/theme.ts` -- `parseTheme(value: unknown): Theme | null`; `resolveTheme(stored: unknown, prefersDark: boolean): Theme` (stored valid wins, else dark/light, never sand by default) -- pure, JSDoc `@param`/`@returns`; no test runner until Story 1.2
- [x] `src/services/prefs.ts` -- `readTheme(): unknown | null` in `try/catch`; `systemPrefersDark()` via `matchMedia` guarded -- impure access isolated
- [x] `src/index.css` -- three `:root[data-theme]` blocks with exact DESIGN.md hex plus `color-scheme`; `--font-*`, `--radius-*`, `--space-*`, `--size-*` at `:root`; reset; `.visually-hidden`; reduced-motion rule -- AD-14
- [x] `src/App.css` -- grid shell: `<header>` min-height 2.75rem, panes `280px minmax(0,1fr)` with independent `overflow: auto`, unsupported column 480px; role variables only -- layout
- [x] `src/components/UnsupportedBrowser.tsx` -- `<main>` + `h1` + body, no controls -- UX-DR25
- [x] `src/App.tsx` -- delete mock/list/PDF wiring; render `UnsupportedBrowser` when unsupported, else `<h1 class="visually-hidden">file-browser</h1>`, `<header>`, an empty tree pane `<div>` (no role; the `role="tree"` container arrives in Story 1.2) and an empty `<main>` -- FR24
- [x] `src/main.tsx` -- set `document.documentElement.dataset.theme` via `resolveTheme(readTheme(), systemPrefersDark())` before render; pass `folderPickerSupported` -- FR23
- [x] `index.html` -- `<title>file-browser</title>` -- UX-DR26

**Acceptance Criteria:**
- Given a supported browser, when the first frame renders, then a header sits above a left pane and a right `<main>`, each scrolling independently, with the tree pane 280px wide.
- Given the stylesheet, then each theme defines the same 18 `--color-*` roles with DESIGN.md hex values, and no component rule contains a hex colour or `[data-theme]`.
- Given an unsupported browser, then only the explanation `<main>` renders, with no buttons or links.
- Given `npm run build` and `npm run lint`, both pass and `git status` lists only files named in this spec (plus this spec, `epic-1-context.md` and `sprint-status.yaml`).

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| Open folder, list and PDF preview removed; orphaned `FileRow`/`PdfPreview`/`directory.ts` (BH, EC) | low | rejected | Frozen intent and Design Notes remove the flow until Story 1.2; orphans are retired there. |
| Empty tree pane lacks `role="tree"`, unnamed empty `header`/`main` (BH, EC) | false | rejected | No tree exists yet; spec says the container arrives in 1.2. Implicit `banner`/`main` landmarks are valid. |
| Duplicate `h1`/`main` patterns (BH) | false | rejected | Story AC requires the hidden `h1` in the shell and a separate `<main>` + `h1` on the unsupported screen. |
| `readTheme(): unknown \| null` redundant (BH, EC) | low | patch | `src/services/prefs.ts:11`; type collapses to `unknown`, `getItem` returns `string \| null`. |
| No fallback tokens before `data-theme` is set (BH, EC) | medium | patch | Tokens exist only under `[data-theme]`; the module script runs after first paint or fails, leaving colour vars unset. |
| `sand` unreachable, no live theme listeners, unnamespaced key (BH, EC) | false | rejected | Theme control is Epic 5; intent excludes controls. Key `theme` is the key AD-14 names. |
| Unused tokens, no min/max or narrow-viewport handling (BH, EC) | false | rejected | Tokens are required by the story; clamps and narrow behaviour belong to the divider story (1.8). |
| No tests for `parseTheme`/`resolveTheme` (BH, VG) | medium (unverified) | defer | No runner until Story 1.2; behaviour checked by hand for all six matrix cases. |
| Unsupported gate in `App` unverified (VG) | medium (unverified) | defer | Needs component-test tooling; covered by the manual check. |
| `prefs` catch fallbacks unverified (VG) | low | rejected | Both wrap storage/`matchMedia` in `try/catch` as read; testing waits on a runner. |
| Unsupported copy thin; runtime const in `types.ts` (BH) | false | rejected | Copy is mandated by `EXPERIENCE.md`; `types.ts` already holds `FILE_CATEGORIES`. |
| `main.tsx` outside `try/catch` (EC) | false | rejected | `readTheme` and `systemPrefersDark` already catch; a `dataset` assignment cannot throw. |
| `.unsupported` overflow with `height: 100%` (EC) | false | rejected | Nothing sets `overflow: hidden` on `html`/`body`, so the page scrolls. |
| Removed font-smoothing and code styles (EC) | false | rejected | Scaffold styles; no code UI exists yet. |
| `rem` vs `px` widths (EC) | false | rejected | Spec requires sizes in `rem`; equal at the default font size. |
| Transitions not implemented (EC) | false | rejected | No element transitions yet; the reduced-motion rule is future-proofing. |

## Design Notes

Roles map to `--color-<role>`. The explicit open-folder flow is intentionally absent from the shell until Story 1.2, so the old `pickFolder` wiring in `App.tsx` is removed rather than hidden; `services/directory.ts` stays for 1.2 to replace.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0
- `npm run lint` -- expected: exits 0
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- Run `npm run dev`; confirm two panes, `data-theme` on `<html>`, and no network requests in DevTools. Delete `window.showDirectoryPicker` before load (or use Firefox) to see the unsupported screen.
