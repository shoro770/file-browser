---
title: 'Verify contrast in all three themes'
type: 'feature'
created: '2026-10-26'
status: 'in-review'
baseline_commit: 'fea1498c5a50875e0fa1a4e6a6e6b4021a603bde'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-file-browser-2026-10-25/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nothing proves the three theme palettes meet WCAG 2.1 AA. The `DESIGN.md` verification table was computed by hand, and a later token change could silently drop a pair below 4.5:1 or 3:1, leaving a theme unreadable while build, lint and tests stay green.

**Approach:** Add a pure `lib/contrast.ts` (ratio and alpha blend) with unit tests, and a `src/contrast.test.ts` suite that parses the real `--color-*` values for `light`, `dark` and `sand` from `src/index.css` and asserts every `DESIGN.md` pair, the dotfile rule, the `accent / text` exemption and the thin margins. A pair that fails with the real values is fixed in `index.css`, not in the test.

## Boundaries & Constraints

**Always:** `contrastRatio(fg, bg)` takes two `#RRGGBB` strings and returns the WCAG 2.1 ratio rounded to 2 decimals (the `DESIGN.md` precision), using relative luminance with the 0.03928 threshold; `blendOver(fg, bg, alpha)` returns the hex of `fg` at `alpha` over `bg`. Both are in `src/lib/` (no DOM, no `node:` imports) with JSDoc `@param`/`@returns` and tests against known pairs (black/white 21, equal colours 1, argument order irrelevant, malformed hex throws). The suite reads the CSS with `node:fs` (add `/// <reference types="node" />` as `architecture.test.ts` does) and extracts the three blocks `:root[data-theme="light|dark|sand"]`; it fails loudly if a block or a token is missing. Minimums: text pairs 4.5, UI and focus pairs 3, as in the table's Min column. Encode the table once as data (fg, bg, min, use) and run it per theme. Failure messages name pair, theme, expected minimum and actual ratio. Cover every row of the table, including `focus-ring` on `surface`, `surface-raised`, `bg`, `row-hover`, `row-selected`, `code-bg`, `notice-bg` and `placeholder-bg`. Dotfile: `blendOver(text, surface, 0.6)` against `surface` is at least 4.5 in each theme; `text / row-hover` and `text / row-selected` stand in for full-opacity hovered and selected rows, and the suite also asserts `App.css` sets `.tree-row--dotfile` hover and `.is-selected` opacity to 1 and rest to 0.6. `text-muted` and `danger-text` blended at 0.6 over `surface` are asserted to fall below 4.5, in each theme. `accent / text` is asserted below 3, and `.rendered-content a` in `App.css` is asserted to set `text-decoration: underline`. Explicit named cases pin Sand dotfile rest (4.55), Dark `notice-border / notice-bg` (3.06) and Dark `text-muted / row-selected` (4.61) at or above their values. If a real pair fails, correct the token in `src/index.css`, keep the hue family, re-run the whole suite, and record the old and new values in Implementation Notes. Update `DESIGN.md` only if a table number changes, and say so. Commit (when later asked) as `test(theme): verify contrast in all three themes`, footer `Story: 5-2` above the Co-Authored-By line. Run `npm run build`, `npm run lint`, `npm test`, then `git status`.

**Never:** Never weaken, skip, loosen or round-up a threshold or tolerance to make a pair pass. Never hardcode hex values in the test that are also in `index.css`; read them. No edits to `src/architecture.test.ts`, `src/rendererLint.test.ts` or `scripts/check-readonly.mjs`. No changes to `App.tsx` (219 of 220 lines), components, hooks or services. No new dependencies (no colour or contrast library), no network, no inline `style`, no `eslint-disable`. Do not treat `border` hairlines (about 1.5:1) as pairs; `DESIGN.md` exempts them. Do not claim visual or real-browser contrast verified: the suite proves token arithmetic only.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|---|---|---|
| Known pairs | `#000000`/`#FFFFFF` | 21 |
| Identical colours | `#808080`/`#808080` | 1 |
| Order swapped | `(a, b)` and `(b, a)` | Same ratio |
| Lowercase or uppercase hex | `#ffffff` and `#FFFFFF` | Same ratio |
| Malformed colour | `red`, `#FFF`, `''` | Throws a clear error |
| Blend | `blendOver('#000000','#FFFFFF',0.6)` | `#666666`; alpha 1 returns fg, alpha 0 returns bg |
| Token lowered | Any listed pair under its minimum | Suite fails naming pair, theme, minimum, actual |
| Block or token missing from CSS | e.g. no `sand` block | Suite fails with a parse error, not a silent pass |
| Exempt pair | `accent / text` | Passes only while below 3 |

</frozen-after-approval>

## Open Questions

Defaults applied; veto in review.

- Dotfile test depth — options: assert the 0.6/1 opacity values by reading `App.css` (catches a changed opacity; chosen) / assert only the arithmetic (misses a CSS change). Default: read `App.css`.
- Rounding in assertions — options: compare the 2-decimal rounded ratio to the minimum (matches the `DESIGN.md` table, but a raw 4.496 rounds to 4.50 and passes) / compare the raw ratio (strict). Default: strict raw comparison for minimums; the rounded value only for the three named thin-margin cases and for failure messages. This means `contrastRatio` should expose or be paired with an unrounded form (for example an optional digits argument).
- `DESIGN.md` numbers disagree with the real CSS for some pair — options: fix the token (chosen, per the AC) / correct the doc if the CSS value is the intended one and the doc is a typo. Decide per pair and record it; do not change both silently.
- Real-CSS probe was not run at planning time (sandbox refused a scratch script), so which pairs, if any, fail today is unknown.

## Code Map

- `src/index.css` -- the three `:root[data-theme="…"]` blocks (lines 1-66) hold every `--color-*` token the suite reads. Only edit a value here if a pair fails.
- `src/App.css` -- `.rendered-content a` (underline, 1px, offset 2px, around line 340) and `.tree-row--dotfile` rules (opacity 0.6 at rest, 1 on hover and `.is-selected`, around lines 557-575). Read-only for this story.
- `src/lib/theme.ts`, `src/lib/theme.test.ts` -- style and JSDoc pattern for a small pure helper plus its test. Reuse as the model; do not edit.
- `src/lib/contrast.ts`, `src/lib/contrast.test.ts` -- new.
- `src/contrast.test.ts` -- new; sits beside `src/csp.test.ts` and `src/architecture.test.ts`, which already read project files with `node:fs`.
- `src/architecture.test.ts` -- bans `fetch(`, inline `style=`, `innerHTML` in non-test source and keeps `App.tsx` ≤ 220 lines; `lib/contrast.ts` must pass it. Do not edit.
- `_bmad-output/planning-artifacts/ux-designs/ux-file-browser-2026-10-23/DESIGN.md` -- "Contrast verification" table (the data source for the pair list) and the dotfile table. Edit only if a number changes.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- add the browser-only entry below.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/contrast.ts` -- add `contrastRatio` and `blendOver` (and an internal hex parser) with JSDoc -- UX-DR29, AD-1
- [x] `src/lib/contrast.test.ts` -- cover the I/O matrix rows: 21, 1, symmetry, case, malformed input, blend -- UX-DR29
- [x] `src/contrast.test.ts` -- parse the three theme blocks from `index.css`; run the full pair table per theme; dotfile, muted/danger exemption, `accent / text`, underline and thin-margin cases; clear failure messages -- UX-DR5, UX-DR15, UX-DR29, FR8
- [x] `src/index.css` -- only if a pair fails: correct the token; record old and new values -- AC "does not weaken the test"
- [x] `_bmad-output/planning-artifacts/ux-designs/ux-file-browser-2026-10-23/DESIGN.md` -- only if a table number changes
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` -- add the unrun Chrome/Edge check: eyeball legibility of each surface in all three themes (tree, rows hovered and selected, dotfile rows, Metadata Card, notices, Markdown, DOCX links underlined, text preview, blocked-image placeholder, focus ring on every surface). Per `.claude/rules/component-tests.md`, say it was not exercised in a browser
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- 5-2 stays `ready-for-dev` until an independent check passes build, lint and tests; only then `done`

**Acceptance Criteria:**
- Given two hex colours, when `contrastRatio` is called, then it returns the WCAG 2.1 ratio to 2 decimals and `blendOver` returns the correct blended hex.
- Given the real `index.css`, when `npm test` runs, then every table pair in all three themes meets its minimum or the suite fails naming pair, theme, minimum and actual ratio.
- Given the dotfile rule, when the suite runs, then rest at 0.6 is at least 4.5 in each theme, hovered and selected rows use full-opacity `text` pairs, and `text-muted` and `danger-text` at 0.6 fail 4.5.
- Given `accent / text`, when the suite runs, then it is below 3 and `.rendered-content a` is underlined.
- Given the thin margins (Sand dotfile rest 4.55, Dark `notice-border / notice-bg` 3.06, Dark `text-muted / row-selected` 4.61), when a token is lowered, then the build fails.
- Given a failing real pair, when the story runs, then the token is fixed in `index.css` and recorded, and no test threshold is changed.
- Given `npm run build`, `npm run lint` and `npm test`, then all pass and `git status` shows only the files named above.

## Implementation Notes

- No real token failed its minimum, so `src/index.css` and `DESIGN.md` are unchanged. Every table pair, the dotfile rest blend and the three thin margins pass against the real values in all three themes.
- Mutation check: lowering Dark `notice-border` from `#8A6D1F` to `#7A5D1F` made 3 tests fail with theme, pair, minimum and actual ratio (2.44:1); the token was then restored.
- Minimums compare the unrounded ratio (`contrastRatio(..., null)`); the three named thin margins use the 2-decimal value, which equals "raw at or above 4.545 / 3.055 / 4.605".
- `readTokens` throws if a theme block holds a `--color-*` declaration that is not a single plain `#RRGGBB` (rgba, shorthand, `var()`, duplicates).
- `epic-5-context.md` gained one contrast bullet (it was older than `epics.md`); it is committed with this story.
- Only token arithmetic and two stylesheet rules are tested. Rendered contrast and which token a component pairs with which background were NOT exercised in a browser; logged in `deferred-work.md`.
- Verified: `npm run build`, `npm run lint`, `npm test` (35 files, 618 tests) pass. One earlier test run, overlapping a still-running build, printed "1 error" with all tests passing; two clean reruns showed none and it was not reproduced.

## Spec Change Log

## Review Triage Log

| Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|
| Dotfile rest check covers only the label selector, not the glyph (blind, edge, gap) | medium | patch | Added a `> .glyph` rest assertion. |
| `readTokens` silently drops non-hex or duplicate `--color-*` declarations (blind, edge) | medium | patch | Throws when declarations and parsed unique tokens differ. |
| Thin-margin cases use the rounded ratio (blind, edge) | false | rejected | Rounded value at or above 4.55 is exactly raw at or above 4.545; raw 4.55 would fail today. |
| "Must fail" exemption tests break if a token improves (blind, edge) | false | rejected | The AC requires asserting `text-muted`/`danger-text` at 0.6 and `accent / text` fail. |
| Pair table incomplete vs extra combinations (blind) | false | rejected | The table mirrors every DESIGN.md row; extra pairs are not in the AC. |
| `digits` out of range throws a bare RangeError (blind, edge) | low | rejected | Unlikely in use; fix needs an added guard. |
| Later override of `.rendered-content a` underline not detected (edge) | low | rejected | Hypothetical; fix needs added parsing. |
| Stylesheet regexes fragile to nesting (blind, edge) | false | rejected | Selectors inside `@media` parse cleanly; verified by the passing test. |
| `import.meta.dirname` needs Node 20.11 (edge) | false | rejected | `src/csp.test.ts` already uses it. |
| Test file location at `src` root (blind) | false | rejected | Matches `csp.test.ts` and `architecture.test.ts`. |
| `epic-5-context.md` edited though not in Tasks (edge) | low | rejected | Fix would edit the spec; the file is committed on request. |
| Component-to-token pairings unverified (gap) | medium | defer | Already logged in `deferred-work.md` as an unrun browser check; needs a CSS audit larger than this story. |

## Design Notes

Test shape (pair table as data, run per theme):

```ts
const PAIRS = [['text', 'surface', 4.5], ['focus-ring', 'notice-bg', 3] /* … all rows */] as const
for (const theme of ['light', 'dark', 'sand'] as const)
  it.each(PAIRS)(`${theme}: %s on %s ≥ %s`, (fg, bg, min) => {
    expect(contrastRatio(tokens[theme][fg], tokens[theme][bg])).toBeGreaterThanOrEqual(min)
  })
```

The `[data-theme]` parser should match each block by selector and read `--color-<name>: #RRGGBB;` pairs, throwing if the selector or any required token is absent.

## Verification

**Commands:**
- `npm run build` -- exit 0 (`npx tsc --noEmit` checks nothing)
- `npm run lint` -- exit 0, includes the read-only gate
- `npm test` -- all pass, including the new suites and `App.tsx` ≤ 220 lines
- `git status` -- only the files listed in Tasks

**Manual checks:**
- NOT RUN until done in Chrome or Edge on `npm run build && npm run preview`: look at every surface in Light, Dark and Warm Sand and confirm text, selected and hovered rows, dotfiles, notices and the focus ring are legible. The suite proves token arithmetic only, not rendered contrast.
