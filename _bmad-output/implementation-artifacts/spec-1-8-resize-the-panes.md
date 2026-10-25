---
title: 'Resize the panes'
type: 'feature'
created: '2026-10-25'
status: 'done'
route: 'dispatch'
baseline_commit: '8bac8e41b318e942a7860bed2ade0c43ba55ec66'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The tree pane is fixed at 280px, so the user cannot give the layout the width their file names need, and the tab order has no divider between the tree and the preview.

**Approach:** A focusable vertical separator between the panes resizes the tree by pointer drag or keyboard. A pure `lib/` clamp decides the width, and the width reaches CSS through a custom property set from script, never an inline `style` attribute. The width is held in memory only.

## Boundaries & Constraints

**Always:** Layering `types <- lib <- services <- hooks <- components`; `lib/` pure with JSDoc `@param`/`@returns` and tests; role CSS variables only; inline SVG only. The divider is a 12px hit area overlaying the pane edge without covering the tree scrollbar, with a 1px `border` line and a 3×32px `border-strong` grip at rest; line and grip turn `accent` on hover and while dragging; cursor `col-resize`. It is a focusable `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow/min/max` in pixels, `aria-valuetext` "{n} pixels", `aria-controls` the tree pane id, `aria-label` "Resize file tree", with a 2px `focus-ring` around the grip. Width is clamped to at least 220px and at most min(480px, 40% of window); the preview is never under 320px; minimums win in narrow windows, and `max` is never below `min`. Left/Right ±16px (Shift ±64px); Home/End jump to min/max; Enter or double-click resets to 280px. Arrow, Home, End and Enter keys call `preventDefault`. Window resize recomputes max and re-clamps the width. Tab order is toolbar, Tree, divider, Preview Pane. Forced-colors: line and grip use `CanvasText`. Transitions, if any, are removed under `prefers-reduced-motion`.

**Never:** Persisting the width (it resets to 280px on reload). Inline `style` attributes. Changes to `AGENTS.md`, theme tokens in `index.css` (use the existing `--size-*` tokens), `src/lib/{files,format,pdf}.ts`, `services/tree`, `services/prefs`, or the tree keyboard map. Keyboard access to the divider through the tree's key handler. A DOM test environment (deferred). An icon library.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default | Window 1200px | Width 280; min 220; max 480 | N/A |
| Drag below min | Pointer to 100px | Width 220 | N/A |
| Drag above max | Window 1000px, pointer to 700px | Width 400 (40% of 1000) | N/A |
| Preview floor | Window 600px | 40% = 240; preview floor allows 280; max 240 | N/A |
| Narrow window | Window 500px | Preview floor gives 180, below min; min wins: max = min = 220 | N/A |
| Keys | Width 280 | Right 296, Shift+Right 344, Left 264, Home 220, End max, Enter 280 | Clamped at ends |
| Window shrinks | Width 480, window drops to 800 | `aria-valuemax` 320, width re-clamped to 320 | N/A |
| Reload | Any width | Back to 280 | N/A |
| Drag released or cancelled | `pointerup`, `pointercancel`, lost capture | Dragging state ends | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/layout.ts` -- new, pure: `TREE_WIDTH_DEFAULT` (280), `TREE_WIDTH_MIN` (220), `TREE_WIDTH_CAP` (480), `TREE_SHARE_MAX` (0.4), `PREVIEW_MIN` (320), `STEP` (16), `STEP_SHIFT` (64); `treeWidthBounds(windowWidth)` returns `{min, max}`; `clampTreeWidth(width, windowWidth)`; `nextTreeWidth(width, key, shift, windowWidth)` returns the new width or `null` for keys it does not handle.
- `src/lib/layout.test.ts` -- cover every matrix row `lib/` can decide.
- `src/hooks/usePaneWidth.ts` -- new: holds width in state, tracks `window.innerWidth` with a `resize` listener, returns `{ width, min, max, setWidth, reset }` with width always clamped. Not persisted. Reuse `lib/layout`.
- `src/components/PaneDivider.tsx` -- new: separator element, keyboard handler, pointer-capture drag (`pointerdown/move/up/cancel`), double-click reset, `dragging` class. Inline SVG not needed (grip is CSS). Mirror `HiddenFilesToggle` for prop typing.
- `src/types.ts` -- add `PaneDividerProps` (`width`, `min`, `max`, `controls`, `onChange(width)`, `onReset()`).
- `src/App.tsx` -- call `usePaneWidth`; the hook publishes `--tree-width` (see Implementation Notes); give the tree pane `id="tree-pane"`; render `PaneDivider` after the tree pane and before `<main>`. Do not change anything else.
- `src/App.css` -- `.shell` columns use `var(--tree-width, var(--size-tree-width-default))`; divider positioned over the pane edge (12px via `--size-divider-hit`, inset so it stays clear of the tree scrollbar); line, grip, hover/drag/focus states, `col-resize`, forced-colors rules. Reuse existing `.shell__tree` border; do not duplicate it.
- Do not touch `src/components/Tree.tsx` or its roving tabindex.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/layout.ts`, `src/lib/layout.test.ts` -- bounds, clamp and key-step functions with tests -- UX-DR10
- [x] `src/hooks/usePaneWidth.ts`, `src/types.ts` -- width state with window-resize re-clamp, `PaneDividerProps` -- UX-DR10, AD-14
- [x] `src/components/PaneDivider.tsx`, `src/App.tsx`, `src/App.css` -- divider, drag, keyboard, tab order, CSS-variable width, forced-colors -- FR24, UX-DR10, UX-DR12, UX-DR27, AD-12

**Acceptance Criteria:**
- Given the divider, then it exposes the role, orientation, value, label and `aria-controls` attributes above, and the tree pane has the matching id.
- Given a pointer drag or the listed keys, then the tree width follows the clamp and `aria-valuenow` and `aria-valuetext` update.
- Given Tab from the tree, then focus reaches the divider before the preview pane.
- Given a window resize, then `aria-valuemax` is recomputed and never below `aria-valuemin`.
- Given a reload, then the width is 280 and the DOM has no inline `style` attribute carrying the width.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` lists only files named here plus this spec and `sprint-status.yaml`.

## Implementation Notes

Implemented directly (no subagent). `usePaneWidth` publishes `--tree-width` on `:root` through a constructable stylesheet instead of `style.setProperty` on the shell, because the latter writes a `style` attribute into the DOM (found in review); `App.tsx` therefore only calls the hook. A window resize writes the re-clamped width back, so growing the window does not restore an earlier larger width. The drag stores a grab offset so the edge does not jump. Build, lint and 94 tests pass; the manual browser check was not run.

## Spec Change Log

## Review Triage Log

| Finding (source) | Verdict | Route | Evidence |
|---|---|---|---|
| `setProperty` writes an inline `style` attribute, against the intent (EC) | medium | patch | CSSOM edits serialize into the attribute. Moved to a constructable stylesheet in `usePaneWidth`. |
| Shrink then grow restores the larger width (BH, EC, VG) | medium | patch | Stored width was never re-clamped. The resize handler now writes the clamped value back. |
| First drag move jumps up to ~11px (BH, EC) | low | patch | Grab offset recorded at pointerdown. |
| Alt/Ctrl/Meta + arrows hijacked (BH, EC) | low | patch | Early return on modifier keys. |
| `--tree-width` set after paint (BH, EC) | low | patch | Now set in `useLayoutEffect`. |
| No tests for hook resize, drag mapping, key dispatch (BH, VG) | medium (unverified) | defer | No DOM test environment; recorded in `deferred-work.md`. |
| NaN/Infinity widths (BH, EC) | false | rejected | Inputs are `clientX` and `innerWidth`, always finite. |
| Enter handled in lib and component (BH) | low | rejected | Cosmetic; the lib case keeps `nextTreeWidth` complete and tested. |
| Text selection during drag, no Escape cancel (BH, EC) | low | rejected | Pointer capture keeps events on the divider; Escape is not in the spec. |
| Key pressed during drag (EC) | low | rejected | Unrealistic input; both paths clamp. |
| `setPointerCapture` may throw (EC) | low | rejected | Called inside a live pointerdown, so the pointer is active. |
| Resize between first render and listener attach (EC) | low | rejected | Negligible window; the next resize corrects it. |
| RTL direction handling (BH) | low | rejected | Outside the spec; the app is left-to-right only. |
| `innerWidth` vs shell width (BH) | false | rejected | The shell fills the viewport. |
| Divider overlays the preview edge, not the tree edge (VG) | false | rejected | Intended: it keeps clear of the tree scrollbar. |
| Spec and sprint status unfinished (BH) | false | rejected | Process state at review time; completed after this pass. |

## Design Notes

The divider is always rendered, including before a folder is open, because the two-pane layout always exists and its width is a layout preference, not folder state. The preview floor of 320px is applied before the 220px minimum: `max = max(min, min(480, 0.4 × window, window − 320))`. Pointer position maps to width as `clientX − shell left edge`, then goes through the same clamp as the keys. The width is published on `:root` through a constructable stylesheet (`adoptedStyleSheets`): unlike `style.setProperty`, it never writes a `style` attribute.

## Verification

**Commands:**
- `npm run build` -- expected: exits 0
- `npm run lint` -- expected: exits 0
- `npm test` -- expected: all pass
- `git status --short` -- expected: only intended files

**Manual checks (if no CLI):**
- `npm run dev` in Chrome: drag the divider past both limits, use every key, double-click, shrink the window, Tab from the tree, check hover and focus states in each theme and forced-colors, reload to confirm the 280px default.
