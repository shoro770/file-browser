---
title: 'Verify assistive-technology and display modes'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: 'd3ddca72e920e3585b26fce7352552c420505e67'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Forced-colors, reduced-motion, zoom, text-spacing and screen-reader behaviour are only partly in the stylesheet and unproven. The selected row, disabled controls, truncation banner, blocked-resource placeholder and notices have no forced-colors rules, and the live-region and page-structure requirements (UX-DR22, UX-DR26) have no test.

**Approach:** Audit against the 5.3 criteria, close each gap with token-only CSS in `App.css` plus tests that read the real stylesheet and render `App` in jsdom. Record what only a real browser or screen reader can show as NOT RUN, with the exceptions stated.

## Boundaries & Constraints

**Always:** Add forced-colors rules inside `@media (forced-colors: active)` using system colours only: `.tree-row.is-selected` keeps its 3px `border-inline-start` with `Highlight` plus a 1px `Highlight` outline (the 2px focus outline on the focused row wins by specificity); `.button:disabled` and placeholder rows use `GrayText`; `.truncation-banner`, `.preview__notice` and `.blocked-resource` borders use `CanvasText`. Focus stays `outline`. Existing divider, theme-segment and dotfile rules stay. Reduced motion stays removal-only (no `scroll-behavior: smooth` anywhere). Row, toolbar and header heights stay in `rem` and grow (min-height). Tests: a `src/displayModes.test.ts` reading `App.css`/`index.css` (forced-colors rules, reduced-motion block, no smooth scroll, no `px` row or toolbar height, `index.html` `lang="en"`); a jsdom `src/App.a11y.test.tsx` per Design Notes. Fix any defect found in this story and record it; note a fix that belongs to an earlier story against that story. Commit (when later asked) as `test(a11y): verify assistive-technology and display modes`, footer `Story: 5-3` above the Co-Authored-By line. Run `npm run build`, `npm run lint`, `npm test`, then `git status`.

**Never:** No edits to `src/architecture.test.ts`, `src/rendererLint.test.ts`, `scripts/check-readonly.mjs` or `epics.md`. No state, effects or refs added to `App.tsx` (219 of 220 lines; extract to a hook such as `useAnnouncer` first if a change there is unavoidable). No hex values, theme selectors or inline `style` in component CSS, no `eslint-disable`, no new dependency, no network. Do not weaken a test to pass. Never claim forced colors, zoom, text spacing or a screen reader verified without a browser run; the stylesheet and jsdom prove structure only. Do not edit the theme tokens (Story 5.2).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|---|---|---|
| Forced colors | Selected row, disabled Refresh, banner, notice, placeholder | Rules exist and use `Highlight`, `GrayText`, `CanvasText`; dotfile opacity 1 |
| Reduced motion | `prefers-reduced-motion: reduce` | No transition or animation; spinner static; no smooth scroll |
| Live region | Open, select, card outcome, loading, hide dotfile selection, Refresh, selection missing, denied | Exactly one persistent visually hidden `role="status"`; denied also in `role="alert"`; same string twice re-announces; arrow moves announce nothing |
| Structure | Folder open, file and card selected, unsupported browser | `header`, `main`, hidden `h1`, `h2` names, title `{folder} - file-browser`, tree "File tree"; unsupported is one `main` with an `h1` |

</frozen-after-approval>

## Open Questions

Defaults applied; veto in review.

- Two further `role="status"` elements exist (`PreviewPane` `.preview__loading`, `PreviewLoading`), against "exactly one". Options: drop their role and mirror "Loading preview..." into the single region through `onAnnounce` (chosen; one region, visible text kept) / keep them as local statuses and document an exception (two regions, fails the AC). Check the Suspense chunk-load window is also announced.
- `.preview-header` has a fixed `height: 3rem`, which may clip under text-spacing overrides and sets the banner's sticky offset. Options: `min-height` and measure the offset (chosen if a browser run shows clipping) / leave and record. Unknown until run in a browser.
- 200% zoom page-level horizontal scroll depends on pane clamping at 640 CSS px. Options: fix in CSS if a browser run shows overflow (chosen) / accept and document.
- The documented exceptions (400% reflow, animated images) go in Implementation Notes, not `epics.md`, which is out of scope.

## Code Map

- `src/App.css` -- forced-colors blocks at ~571, 660, 728; reduced-motion blocks ~596, 734; `.tree-row` ~497, `.button:disabled` ~97, `.truncation-banner` ~270, `.blocked-resource` ~390, `.preview__notice` ~425, `.preview-header` ~212. Add the missing rules here.
- `src/index.css` -- global reduced-motion reset (~150) and `--size-*` rem tokens; read-only.
- `src/App.tsx` -- status region, h1, header, main, `document.title`; at its line cap, do not grow.
- `src/components/PreviewPane.tsx`, `preview/PreviewLoading.tsx` -- the extra `role="status"` elements and `onAnnounce` use.
- `src/components/UnsupportedBrowser.tsx`, `index.html` (`lang="en"`, CSP) -- structure checks.
- `src/App.theme.test.tsx`, `src/App.refresh.test.tsx`, `src/testHelpers.ts` -- fake-folder and jsdom setup to reuse; `src/csp.test.ts`, `src/contrast.test.ts` -- pattern for reading project files.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- add the unrun browser and screen-reader entry.

## Tasks & Acceptance

**Execution:**
- [x] `src/App.css` -- add the forced-colors rules above -- UX-DR27
- [x] `src/components/PreviewPane.tsx`, `src/components/preview/PreviewLoading.tsx` -- apply the loading-status default; update affected tests -- UX-DR22
- [x] `src/displayModes.test.ts` -- stylesheet assertions for forced colors, reduced motion, rem sizes, `lang` -- UX-DR27, UX-DR28, UX-DR26
- [x] `src/App.a11y.test.tsx` -- live-region, structure and keyboard role/name/level/selected assertions; unsupported screen -- UX-DR22, UX-DR25, UX-DR26, FR8
- [x] `src/App.css`, others -- fix any defect the audit finds; record it
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- NOT RUN entry: forced colors, 200% zoom, text spacing, reduced motion, UJ-1 and UJ-2 with a screen reader and keyboard in Chrome or Edge
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- 5-3 `ready-for-dev` now; `done` only after an independent build, lint and test pass

**Acceptance Criteria:**
- Given forced colors, when the stylesheet is read, then every UX-DR27 mapping exists with system colours only; the browser walkthrough is recorded as run or NOT RUN.
- Given reduced motion, then no transition, animation or smooth scroll remains in effect.
- Given a 640 CSS px window, then rows and toolbar use `rem` minimum heights, the toolbar wraps and the folder name truncates first; the 400% and animated-image exceptions are stated.
- Given each event in the live-region table, then one hidden `role="status"` carries the string, re-announcing identical text, never on arrow keys.
- Given the page, then the structure list holds; the unsupported screen is one `main` with an `h1`.
- Given UJ-1 and UJ-2, then a screen-reader and keyboard pass is run or reported NOT RUN; any defect is fixed and recorded.
- Given the gates, then build, lint and test pass and `git status` lists only the files above.

## Implementation Notes

- Audit result: forced-colors rules were missing for the selected row, disabled controls, banner, notice and blocked placeholder; added to `App.css` with system colours only. Divider, theme segment, dotfile, reduced-motion and `rem` sizing were already present and are now pinned by `src/displayModes.test.ts`. The audit found no smooth scrolling.
- Defect fixed (belongs to Story 2.1/3.x scope): `PreviewPane` and `PreviewLoading` each carried their own `role="status"`, so the app had three live regions. Both are now plain visible text; "Loading preview..." goes to the single region through `onAnnounce` (also from the lazy-chunk fallback). `App.tsx` was not touched (219 lines). Four existing PreviewPane tests were adjusted to ignore the loading string only; the new `PreviewLoading.test.tsx` pins the fallback announcement.
- Known behaviour: the region keeps reading "Loading preview..." after loading ends until the next announcement (hidden text, not re-read). Clearing it would risk wiping a card announcement fired in the same commit, so it is left.
- Open-question defaults applied: the loading status was merged into the single region; the fixed 3rem `.preview-header` and 200% zoom overflow were NOT changed because nothing could be measured.
- Documented exceptions: 400% reflow does not meet WCAG 1.4.10, and animated images may fail WCAG 2.2.2 (UX-DR28, UX-DR16).
- NOT RUN in a browser (jsdom and stylesheet reads only): forced-colors rendering, `prefers-reduced-motion` behaviour, 200% zoom layout, text-spacing overrides, and the screen-reader and keyboard pass of UJ-1 and UJ-2. No result is claimed; logged in `deferred-work.md`.
- Verified: `npm run build`, `npm run lint`, `npm test` (38 files) pass.

## Spec Change Log

## Review Triage Log

| Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|
| Fallback announcement untested; filtered assertions weaker (gap, blind) | medium | patch | Added `PreviewLoading.test.tsx` (one call, no `role="status"`). |
| `rule()` can match a descendant selector (blind) | low | patch | Regex now requires a selector-list start. |
| `mediaBlocks` silently returns nothing (blind, edge) | low | patch | Throws when no block is found. |
| Forced-colors test bans only hex and `var(--color` (edge) | low | patch | Also rejects rgb, hsl, oklch, color-mix. |
| Re-announce test accepts either string (blind, edge) | low | patch | Asserts `Refreshed.`. |
| Status keeps "Loading preview..." after load (edge, gap) | low | rejected | Hidden stale text is not re-read; a clear could wipe a same-commit card announcement. |
| Duplicate loading announce, unstable `onAnnounce`, race with "Previewing" (blind, edge) | false | rejected | `setStatus` is stable and a same-string set is a no-op; "Previewing" is set sync at activation, loading 150 ms later. |
| Loading text bypasses clear-then-set (edge) | low | rejected | Same-string repeats need an intervening string, which activation always provides. |
| Keyboard test thin, test globals unrestored, empty loading `<p>` (blind) | low | rejected | Tree keys are tested elsewhere; matches existing test files; fix adds complexity. |

## Design Notes

`App.a11y.test.tsx` renders `App` with the fake directory from `App.theme.test.tsx`. Assert `container.querySelectorAll('[role="status"]').length === 1` after each event, and that it has the `visually-hidden` class. Wait for `requestAnimationFrame` (clear, then set) before reading text.

## Verification

**Commands:**
- `npm run build` -- exit 0 (`npx tsc --noEmit` checks nothing)
- `npm run lint` -- exit 0, includes the read-only gate
- `npm test` -- all pass, `App.tsx` still ≤ 220 lines
- `git status` -- only the files in Tasks

**Manual checks:**
- NOT RUN until done in Chrome or Edge on `npm run build && npm run preview`: Windows High Contrast or `forced-colors` emulation, `prefers-reduced-motion` emulation, 200% zoom at 1280px, a text-spacing bookmarklet, and a VoiceOver or NVDA pass of UJ-1 and UJ-2 by keyboard only.
