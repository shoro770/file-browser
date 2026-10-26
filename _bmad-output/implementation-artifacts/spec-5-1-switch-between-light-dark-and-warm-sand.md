---
title: 'Switch between Light, Dark and Warm Sand'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: '45d7e976137cdb01e85c30661397990ed1f35e9b'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The three theme token blocks, `parseTheme`/`resolveTheme`, `readTheme` and the startup `data-theme` exist, but there is no control to change theme and no `writeTheme`, so the choice cannot be made or remembered.

**Approach:** A `ThemeSwitch` component (radiogroup "Theme", three segments) driven by a `useTheme` hook. The hook applies `data-theme` on `<html>` and persists through a new `services/prefs.writeTheme`. `App.tsx` only renders `<ThemeSwitch />` in the toolbar.

## Boundaries & Constraints

**Always:** Segments are native `<input type="radio">` in one named group, labelled "Light", "Dark", "Warm Sand". The checked radio is the single tab stop and arrows move and select (native behaviour; test it). Active segment: `accent` fill, `on-accent` text, a leading check glyph (not colour-only). Segment width is fixed to "Warm Sand" and weight is constant. Each segment has an `aria-hidden` inline-SVG glyph (sun, moon, dune; add to `Glyph.tsx` in the existing style, 16px grid, `currentColor`, 1.5 stroke). Group has `border-strong` outline, `--radius`; active segment `--radius-sm`. 2px `focus-ring` on the focused segment (use `:has(:focus-visible)` on the label). Usable with no folder open. Initial value comes from `document.documentElement.dataset.theme` validated by `parseTheme`, falling back to `resolveTheme(readTheme(), systemPrefersDark())`. Choosing a theme sets `dataset.theme` synchronously, then `writeTheme` (try/catch, silent). A stored value other than `light|dark|sand` is ignored. Forced colors: active segment gets a 2px `Highlight` border. Honour `prefers-reduced-motion` for any transition. Props types live in `src/types.ts`. `lib/` additions have JSDoc `@param`/`@returns` and tests. Commit (when later asked) as `feat(theme): switch between light, dark and warm sand`, footer `Story: 5-1` above the Co-Authored-By line. Run `npm run build`, `npm run lint`, `npm test` first, then `git status`.

**Never:** No state, effect or ref added to `App.tsx`; it is 217 lines against a 220 cap, so add only an import and one JSX line. Never raise the cap or add `eslint-disable`. No edits to `src/architecture.test.ts`, `src/rendererLint.test.ts` or `scripts/check-readonly.mjs`. No inline `style`, no theme branching in component CSS, no new announcement strings (the status region stays untouched). No storage keys beyond `theme` and `showDotfiles`. No network, no icon library, no default of Warm Sand. Do not touch the Tree, preview, Selection or scroll state. Do not extract the Refresh announcer here (retro B3 is separate).

## I/O & Edge-Case Matrix

| Scenario | State | Behavior |
|---|---|---|
| Control renders | Any, no folder open | `radiogroup` "Theme", three radios, checked one matches `data-theme` |
| Keyboard | Focus on checked radio | One tab stop; ArrowRight/Down and Left/Up select the next/previous, `data-theme` updates |
| Choose Warm Sand | Folder open, file selected, scrolled | `data-theme="sand"`; Selection, expansion, scroll unchanged; no reload |
| Stored `sand` at start | `localStorage.theme = 'sand'` | Sand applied, even if OS prefers dark |
| Nothing stored | OS dark / light / unavailable | `dark` / `light` / `light`; never `sand` |
| Stored `purple` | invalid | Ignored; OS default |
| Storage throws on read or write | `localStorage` throws | Choice applies for the session; no error shown |
| Choice saved | Any | Only `theme` key written; `showDotfiles` untouched |
| Status region | Any theme change | Not written to |

</frozen-after-approval>

## Open Questions

Defaults applied; veto in review.

- Radios or `role="radio"` buttons? Default: native radios (arrow behaviour and checked state for free).
- Toolbar placement: after Refresh, before the alert, `margin-inline-start: auto`? Default: after Refresh, pushed right.
- Retro B3 (extract announcer from `App.tsx`) is still open; this story needs no `App.tsx` growth, but if the 220 cap fails at two added lines, stop and extract first.
- `useTheme` return shape `{ theme, setTheme }` per `.claude/rules/app-shell-stays-thin.md`; `ThemeSwitch` calls the hook itself so `App` stays stateless.

## Code Map

- `src/services/prefs.ts` -- add `writeTheme(theme: Theme): void` beside `readTheme`, same `THEME_KEY`, try/catch.
- `src/hooks/useTheme.ts` -- new; `useState` initialiser as above; `setTheme` sets `dataset.theme`, state, then `writeTheme`.
- `src/components/ThemeSwitch.tsx` -- new; renders the group; label text constants (`light: 'Light'`, `dark: 'Dark'`, `sand: 'Warm Sand'`) typed over `Theme`.
- `src/components/Glyph.tsx` -- add `Sun`, `Moon`, `Dune`, `Check` exports (decorative).
- `src/types.ts` -- `ThemeSwitchProps` only if the component takes props; else none.
- `src/App.tsx` -- import and `<ThemeSwitch />` in `.shell__toolbar` (2 lines).
- `src/App.css` -- `.theme-switch*` rules from existing tokens; forced-colors and reduced-motion blocks next to the existing ones.
- Reuse unchanged: `src/lib/theme.ts`, `src/main.tsx`, `src/index.css`.

## Tasks & Acceptance

**Execution:**
- [x] `src/services/prefs.ts` -- add `writeTheme` -- AD-14, NFR7
- [x] `src/services/prefs.test.ts` -- new; read/write round trip, invalid value, throwing storage on get and set, only `theme` key written (closes deferred 1.1 prefs entry)
- [x] `src/lib/theme.test.ts` -- new; `parseTheme` and `resolveTheme` incl. never `sand` by default (closes deferred 1.1 entry)
- [x] `src/hooks/useTheme.ts` -- new -- AD-14
- [x] `src/components/Glyph.tsx` -- Sun, Moon, Dune, Check
- [x] `src/components/ThemeSwitch.tsx` -- new -- UX-DR21
- [x] `src/components/ThemeSwitch.test.tsx` -- new; role `radiogroup` named "Theme", three radios, `aria-checked`/checked, single tab stop, arrow keys select, attribute updates, `writeTheme` called, storage-throws still applies, stored/invalid/OS defaults, status region unchanged, no `style` attribute, glyphs `aria-hidden`
- [x] `src/App.refresh.test.tsx` or a new `src/App.theme.test.tsx` -- control present with no folder; with a Selection, switching keeps Selection and expansion
- [x] `src/App.tsx`, `src/App.css` -- wire and style
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- add the unrun Chrome/Edge check per `.claude/rules/component-tests.md`: three themes on every surface, visible 2px focus ring on segments, forced-colors Highlight border, no layout shift, persistence across reload, scroll kept
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- 5-1 `ready-for-dev` now (done only after an independent check); remove the closed 1.1 deferred entries

**Acceptance Criteria:**
- Given the toolbar renders, then a `radiogroup` "Theme" with Light, Dark, Warm Sand exists, usable with no folder open.
- Given keyboard use, then the group is one tab stop and arrows move and select.
- Given a choice, then `data-theme` changes immediately and Selection, expansion and scroll are untouched.
- Given a stored valid theme, then it wins over the OS; given none, Light or Dark per OS, never Warm Sand; given an invalid one, it is ignored.
- Given storage throws, then the choice applies and nothing is shown.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass (including `App.tsx` ≤ 220 lines) and `git status` shows only the files listed here.

## Implementation Notes

- `App.tsx` is 219 lines (cap 220): one import and one JSX line, no state. The Refresh announcer was not extracted (retro B3 stays open).
- The check glyph sits in an always-rendered `.theme-switch__check` slot, hidden by CSS until active, so the glyph and label never move on selection (found in review).
- `main.tsx` still sets `data-theme` before first paint; `useTheme` reads it as its initial value.
- Radio-group Tab and arrow keys, the focus ring, forced colors and layout were NOT exercised in a browser; jsdom has none of them. Logged in `deferred-work.md`. Two Story 1.1 deferred entries were closed or narrowed by the new `theme` and `prefs` tests.
- Verified: `npm run build`, `npm run lint`, `npm test` pass.

## Review Triage Log

| Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|
| Check glyph mounts only when active, so the glyph and label shift inside the segment (edge, blind) | medium | patch | Reserved an always-rendered check slot hidden by CSS; test pins the slots. |
| Tab and arrow keys are not tested (edge, blind) | low | rejected | jsdom has no radio-group keys; logged as an unrun browser check. |
| `:has(:focus-visible)` ring unsupported in older browsers (blind) | false | rejected | The app targets Chromium only. |
| Forced colors only styles the active segment (blind) | false | rejected | Borders are real, so they map to system colors; matches DESIGN.md. |
| `min-width` and narrow-toolbar overflow (blind, edge) | low | rejected | The toolbar already wraps; below about 26rem it clips, logged as a browser check. |
| No cross-tab sync, no live OS-change follow (blind) | false | rejected | Not in the story; start-up default only (FR23). |
| Two sources of truth (`dataset` and state) (blind, edge) | low | rejected | Only one `ThemeSwitch` exists; a second writer is hypothetical. |
| `CSSStyleSheet` stub leaks (blind) | false | rejected | Vitest isolates each test file. |
| Stale evidence line on the 1.1 deferred entry (edge) | false | rejected | It still describes the unsupported-browser gate. |
| No gaps (verification-gap) | n/a | none | Reviewer filed no gaps. |

## Verification

**Commands:**
- `npm run build` -- exit 0 (`npx tsc --noEmit` checks nothing)
- `npm run lint` -- exit 0, includes the read-only gate
- `npm test` -- all pass
- `git status` -- only the files above plus the two `_bmad-output` files

**Manual checks:**
- NOT RUN until done in Chrome or Edge on `npm run build && npm run preview`: cycle all three themes over Tree, preview, notices, Markdown, DOCX and divider; Tab and arrow through the group and see the focus ring; forced colors; reload keeps the choice; no layout shift. jsdom proves DOM shape only.
