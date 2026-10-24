# Accessibility Review — file-browser

Lens: WCAG 2.1 AA and the ARIA Authoring Practices (APG) tree, window-splitter, radio-group and toggle-button patterns. Read: DESIGN.md, EXPERIENCE.md, .memlog.md. Spines not edited. Contrast was recomputed with a script (WCAG relative luminance, hex tokens from DESIGN.md frontmatter).

## Overall verdict

The tree semantics, keyboard map, focus rules and most contrast numbers are in good shape. Every row of the DESIGN.md contrast table reproduces to two decimals in all three themes, and the dotfile table reproduces once the blended colour is rounded to 8 bits. The gaps are mostly in places the spec does not reach:

- the dimming rule collides with danger and muted text;
- the divider is not identifiable at rest;
- the hidden-files toggle semantics are muddled;
- roving-tabindex repair is unspecified;
- reflow, forced-colors, link styling, and announcing preview outcomes are unspecified.

Counts: 0 blocker, 8 major, 9 minor, 4 nit.

## Contrast recomputation

Method: the WCAG 2.1 formula on the 6-digit hex tokens. Text needs 4.5:1; UI components and focus indicators need 3:1.

- **Verified.** All 21 pairs in DESIGN.md "Contrast verification" match my values for Light, Dark and Warm Sand, to two decimals. All pass.
- **Dotfile table verified.** 4.97 / 6.00 / 4.55 matches with 8-bit rounded blending. Unrounded I get 4.95 / 5.99 / 4.55, a difference of 0.02 that does not matter.
- **Dotfile rest state at 0.6 opacity of `text`, per background (Light / Dark / Sand):**

| Row background | Light | Dark | Sand |
|---|---|---|---|
| surface | 4.95 | 5.99 | 4.55 |
| row-hover (not applicable, the spec sets 1.0 on hover) | 4.74 | 5.36 | 4.37 |
| row-selected (not applicable, the spec sets 1.0 when selected) | 4.61 | 4.52 | 4.12 |

  The rest-state claim holds. The 0.6 dim does not pass on hover or selection in Sand (4.37 / 4.12), so restoring full opacity there is required, and the spec does that. The Sand margin at rest is 0.05.
- **Extra pairs I checked that the table omits.** All pass except the ones listed under findings.
  - `text-muted` on row-hover, bg and code-bg: at least 5.85.
  - `accent` on row-hover, bg and surface-raised: at least 5.41.
  - `accent` on row-selected: 5.41 / 4.76 / 4.63.
  - `danger-text` on row-hover, row-selected and bg: at least 5.04.
  - `focus-ring` on surface-raised, row-hover, bg, code-bg, notice-bg and placeholder-bg: at least 4.63 and in most cases much higher.
  - Selected-row accent bar against row-selected: 5.41 / 4.76 / 4.63.
  - `border-strong` on row-hover: at least 3.14.
  - `notice-border` on surface: at least 3.64.
- **Pairs below threshold (see findings):**
  - `danger-text` at 0.6 over surface: 3.08 / 3.57 / 2.99.
  - `text-muted` at 0.6 over surface: 2.77 / 3.38 / 2.70.
  - `border` against surface and bg (the divider line): 1.38 to 1.64.
  - `accent` against `text` (inline links): 2.82 / 2.00 / 2.66.
- **Thin margins, pass:** dark `notice-border` on `notice-bg` 3.06, dark `text-muted` on row-selected 4.61, Sand dotfile rest 4.55.

## Findings

### Major

**A-1. Dotfile dimming also dims `danger-text` and `text-muted` content, and those fail.** (DESIGN.md "Dotfile rows", Components > Dotfile-dimmed row, Unavailable-entry row; EXPERIENCE.md Dotfile row, Voice and Tone strings)
- Evidence:
  - DESIGN.md says dotfile rows "show the name only (no `text-muted` content)". That is not true of several rows.
  - The dim is applied to the row's content wrapper. An unreadable dotfile folder such as `.git` shows the "Unavailable" suffix and warning glyph in `danger-text` inside that wrapper. That blends to 3.08 / 3.57 / 2.99 over surface.
  - Descendants of a dotfile folder are "each dimmed at 0.6". The child rows "Empty folder", "No visible files", "Loading..." and "This folder can't be read." are `text-muted` or `danger-text`. At 0.6, `text-muted` is 2.77 / 3.38 / 2.70.
  - These are text, not decoration, and inactive-component exemptions do not apply.
- Fix: apply the dim only to the kind glyph and the name span. Exempt the suffix, glyph and placeholder child rows (opacity 1). Alternatively, define a precomputed `text-dim` colour token instead of opacity. State that the dim applies only to the file-name label and the kind glyph.

**A-2. The divider is not identifiable at rest (1.4.11), and the handle appears on hover only.** (DESIGN.md Components > Divider, Layout; EXPERIENCE.md Divider, Banned)
- Evidence:
  - At rest the divider is a 1 px `border` line, 1.38 to 1.64:1 against both panes. The tree and preview are the same `surface`, so no tonal edge helps.
  - The 3x32 `border-strong` grip appears only "on hover and focus". A pointer user cannot perceive that a resize control exists. 1.4.11 requires 3:1 for the visual information needed to identify a control.
  - This contradicts EXPERIENCE.md "Banned: hover-only affordances".
  - The "exempt hairline" argument in DESIGN.md covers separators, but this one is a control.
- Fix: draw the grip at rest in `border-strong` (3.58 / 3.87 / 3.80 on surface). Alternatively, make the 1 px line itself `border-strong`. Keep hover and drag in `accent`.

**A-3. Hidden-files toggle has conflicting state exposure.** (EXPERIENCE.md Voice and Tone "Hidden files toggle", Accessibility Floor; DESIGN.md Components > Toolbar)
- Evidence:
  - It is a button with `aria-pressed`, labelled "Hidden files" with visible state text "Shown" / "Hidden".
  - If the state text is inside the accessible name, the name changes when the state changes. That is the anti-pattern APG warns about: it announces "Hidden files Shown, pressed" and is ambiguous.
  - The spec never says whether pressed means files shown or files hidden. The default is "shown".
- Fix: constant name, "Show hidden files", with `aria-pressed="true"` = dotfiles visible. Render "Shown/Hidden" as `aria-hidden` visual text, or drop it and let the pressed style carry state. Pressed state also needs a non-colour cue (icon change or text) in the visual spec.

**A-4. Roving tabindex repair is unspecified in the cases that remove the tabbable row.** (EXPERIENCE.md Tree container, Focus management)
- Evidence:
  - Hide dotfiles is triggered from the toolbar button, so focus is on the button, not on a tree row, and the spec's "while a hidden row is focused" case is mostly unreachable. The row holding `tabIndex=0` can still be a dotfile row, e.g. the last-focused one. It is removed from the DOM, the tree is left with no `tabIndex=0` row, and the tree drops out of the tab order.
  - The same applies to Refresh, when a row that held `tabIndex=0` vanishes. The spec defers the fix to "the next Tree focus", which cannot happen if the tree is unreachable.
  - Which row is the tab stop when Tab enters from outside is also unspecified. APG says the last focused row, else the selected row, else the first.
  - Folder pick: "focus moves to the first Tree row". For an empty folder there is no row, so the focus target is undefined and focus is lost because the prompt button unmounts.
- Fix: invariant "the tree always has exactly one `tabIndex=0` row". On any rebuild, reassign it immediately. Preference: current focus target if alive, else the nearest surviving ancestor or previous row, else the selected row, else the first. For an empty folder, move focus to the Preview Pane message or the Open folder button.

**A-5. Reflow (1.4.10) is not met, and the 200% claim is the wrong test.** (EXPERIENCE.md Foundation, Accessibility Floor; DESIGN.md Layout)
- Evidence:
  - AA requires no 2-D scrolling at 320 CSS px wide (400% of 1280). The spec says "No narrow-viewport or touch layout" and only promises 200% with no horizontal page scroll.
  - Tree min 220 + divider 8 + preview min 320 = 548 px. At 400% zoom (320 CSS px) the layout must overflow or clip.
  - The toolbar (Open folder, folder name, Hidden files, Refresh, three-segment theme control with glyph and "Warm Sand") has no wrap or overflow rule. It likely does not fit in about 640 px at 200% zoom on a 1280 px window.
- Fix: either declare partial conformance explicitly, or add one responsive rule. Below about 600 px, stack the tree above the preview or collapse the tree. Let the toolbar wrap. Specify toolbar overflow.

**A-6. Forced-colors / Windows High Contrast is unspecified, and the spec depends on backgrounds.** (DESIGN.md Colors, Components; EXPERIENCE.md Accessibility Floor)
- Evidence:
  - Under `forced-colors: active`, background colours and box-shadows are overridden.
  - The selected-row fill and "3 px accent bar" are the only sighted selection cues. If the bar is a background or shadow it vanishes.
  - The active theme segment is an `accent` fill plus weight 600. Both can vanish or collapse.
  - The divider line and grip, the disabled-button treatment, and the blocked-resource dashed border all rely on colour tokens.
  - The 0.6 opacity on dotfile rows is not reset by forced colors, and `color-scheme` and the three themes are moot there.
- Fix: add a short forced-colors rule.
  - Selection bar is a real `border-inline-start: 3px solid` (survives, maps to `Highlight`).
  - Active segment gets a visible border or checkmark.
  - Focus is an outline (survives).
  - Use system colours (`Highlight`, `CanvasText`, `GrayText`).
  - Reset dotfile opacity to 1 in forced colors.

**A-7. Preview outcomes are not announced (4.1.3), and loading is silent.** (EXPERIENCE.md State Patterns, Accessibility Floor "Live regions")
- Evidence:
  - Selecting a file never moves focus (correct), but the preview swap, the Metadata Card, "This file couldn't be previewed...", "This file is empty." and the unsupported-type message are not in the live region. The live region covers Refresh, selection-cleared and access-denied only.
  - A screen-reader user who selects a corrupt DOCX gets silence. "Loading..." and "Loading preview..." are explicitly static, so slow reads give no progress.
- Fix: route a one-line status to the existing `role="status"`, e.g. "Previewing {name}" or "{name}: no preview available". Do not announce on every arrow move; announce on activation or on failure. Make the 150 ms loading text live (polite), or leave it static but fire the completion status.

**A-8. Links in rendered Markdown and DOCX are colour-only and may be dead.** (DESIGN.md Colors "accent: Links"; EXPERIENCE.md Markdown / DOCX preview, Voice "Blocked remote link")
- Evidence:
  - `accent` against body `text` is 2.82 / 2.00 / 2.66:1, below the 3:1 needed for colour alone to distinguish links (1.4.1). No underline is specified.
  - "Links never navigate the app away" and "Blocked remote link: ... not navigable" leave focusable `<a>` elements that do nothing: unspecified dead links in the tab order.
- Fix: underline all preview links. Render blocked or inert links as plain text or `<span>` with no tab stop (or `aria-disabled`, with the reason in the name). Say what happens for in-document anchors (`#heading`): allow scroll within the pane.

### Minor

**A-9. `aria-selected` is set only on the selected row.** (EXPERIENCE.md Tree row, Accessibility Floor)
- Evidence: APG: when a tree supports selection, `aria-selected="false"` should be on the other selectable nodes. Omitting it makes file rows look unselectable, so some screen readers never say "not selected". Folder rows are not selectable; the spec should say so. Leave `aria-selected` off folders, or state the rule.
- Fix: files get `aria-selected` true/false. Folders get none.

**A-10. Placeholder rows inside `role="group"` are not treeitems.** (EXPERIENCE.md Tree container; State Patterns "Loading, tree", "Empty folder", "Unavailable folder expanded")
- Evidence: a group inside a tree should own treeitems. "Empty folder", "No visible files", "Loading..." and "This folder can't be read." are specified as child rows with no role.
- Fix: make them `role="treeitem"` with `aria-disabled="true"` and no expand state, or put the text in the parent's `aria-describedby`. Say whether Up/Down lands on them.

**A-11. Preview Pane container semantics.** (EXPERIENCE.md Tab order)
- Evidence:
  - "Focusable, labelled by the Preview Header file name": `aria-labelledby` on a plain `div` has no effect. It needs `role="region"`.
  - The empty and prompt states are not stated as focusable or not, so a tab stop may land on nothing.
  - Image alt = file name is the only option, and is acceptable. PDF text and structure inside the container is unspecified.
- Fix: `role="region"` plus `tabindex="0"` only when content scrolls or a file is selected. For the prompt states, leave it out of the tab order or give it a static label.

**A-12. Focus and announcements around opening a folder.** (EXPERIENCE.md Focus management, Open folder)
- Evidence: the Workspace Folder name changes and the whole tree is replaced, with no announcement beyond the focus move to row 1, which reads only the row. Also: the "Hidden files" hide that clears the selection is "no message", so a screen-reader user loses their selection silently.
- Fix: status "Opened {name}" (and optionally the item count). Consider "Selection cleared" in the same polite region; the spec chose silent, which I flag as questionable rather than wrong.

**A-13. Live-region wiring is ambiguous.** (EXPERIENCE.md Accessibility Floor, State Patterns "Permission denied", "Selection missing")
- Evidence: one `role="status"` is specified, but notices are placed visibly in different spots (under the toolbar, above the prompt). One region cannot be in two places. Repeated identical strings ("Refreshed." twice in a row) do not re-announce unless the region is cleared first. Access-denied after a user action is arguably `role="alert"`.
- Fix: say whether each visible message is itself the live region or a visually hidden mirror. Clear then set text for repeated messages.

**A-14. Page-level landmarks, title, language, headings.** (EXPERIENCE.md Foundation, IA; unspecified)
- Evidence: no `lang`, document title, landmark structure (banner / navigation or tree / main), or heading plan. 2.4.1 Bypass Blocks, 2.4.2, 3.1.1. The Preview Header name and Metadata Card name and empty-state titles do not say their heading levels. The unsupported-browser screen has no heading level or landmark stated.
- Fix: one short list: `lang`, title, `<header>` toolbar, `<main>` preview, an `h1` (visually hidden is fine), and heading levels for empty-state titles. Do not use `role="toolbar"` unless arrow navigation is also added.

**A-15. Divider ARIA detail.** (EXPERIENCE.md Divider)
- Evidence: values and keys are correct (`separator`, vertical, `aria-valuenow/min/max` in px, Left/Right/Shift, Home/End, Enter reset). Missing:
  - `aria-controls` for the tree pane, and `aria-valuetext` ("280 pixels") since px values read as bare numbers.
  - `aria-valuemax` depends on window width and must update on window resize.
  - In narrow windows min can exceed max ("minimums win over the cap"), which is an invalid range.
  - The 8 px hit area sits next to the tree scrollbar and is below 24 px (WCAG 2.2 2.5.8; not required in 2.1, so informational).
- Fix: add the above and widen the hit area to 12 to 16 px, overlaying the pane edge without covering the scrollbar.

**A-16. Fixed pixel heights (28 / 44 px) risk clipping under user text changes (1.4.4, 1.4.12).** (DESIGN.md Layout, Components)
- Evidence: `row-height: 28px` and `toolbar-height: 44px` are fixed, with 13 px px-based type. Text-spacing overrides or a larger browser font setting clip or overlap.
- Fix: `min-height` in rem, with text sized in rem.

**A-17. Motion and auto-playing media.** (DESIGN.md Brand, Components; EXPERIENCE.md State Patterns, Accessibility Floor)
- Evidence: "removes all transitions" does not cover the tree spinner (an animation, not a transition), smooth scrolling, or the chevron rotation if it is a transition. Animated GIF, APNG and WebP in Image preview autoplay with no pause control, which fails 2.2.2 if the loop exceeds 5 s.
- Fix: static spinner under `prefers-reduced-motion`. For animated images either document the exception, or render the first frame to a canvas until activated.

**A-18. Keyboard map gaps for large trees.** (EXPERIENCE.md Tree keyboard map)
- Evidence: UJ-2 uses thousands of files, yet type-ahead is "optional" and there is no PageUp/PageDown. Also unspecified: Right on an empty expanded folder or a placeholder row, and Left on a root-level row (no parent). APG treats type-ahead as optional, but it is the main non-pointer way to reach a file in a long list.
- Fix: make type-ahead required, add PageUp/PageDown, and state the edge cases.

### Nit

- **N-1. Unavailable accessible name via override.** (EXPERIENCE.md Voice and Tone) The name "{name}, unavailable, can't be read" must begin with the visible label to satisfy 2.5.3, and it does. Prefer `aria-describedby` for the reason so the row name stays the file name.
- **N-2. Theme control layout shift.** (DESIGN.md Theme segmented control) Active weight 600 changes segment width when the selection moves. Reserve width, or keep weight constant and use fill plus a check glyph. Also state that the checked radio is the single tab stop (roving) and that native radios are fine.
- **N-3. Image alt equals the file name.** (EXPERIENCE.md Image preview) Acceptable given no other source; just document it as deliberate.
- **N-4. Thin contrast margins.** Sand dotfile rest is 4.55:1, dark `notice-border` on `notice-bg` is 3.06:1, dark `text-muted` on row-selected is 4.61:1. All pass, but any token nudge breaks them. Add a note to re-run the check when tokens change.

## Areas reviewed with no finding

- Tree roles and attributes: `tree`, `treeitem`, `group`, `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded` on folders only. Matches APG. Selection separated from focus is allowed.
- Keyboard map: Up/Down/Left/Right/Home/End/Enter/Space matches APG, and the Tab order is sensible.
- Focus ring: 2 px with 1 px offset passes 3:1 on every surface and row background in all three themes. The selected row uses an inset ring, which is right for a clipped pane.
- Selection, unavailable and active-theme states are not colour-only: bar plus `aria-selected`, text plus glyph, `aria-checked`.
- Radiogroup labelled "Theme" with arrow-key selection, and `aria-pressed` on a toggle button (naming issue in A-3), are the right patterns.
- Touch target size: not required in WCAG 2.1 AA. Rows are 28 px and toolbar buttons are about 34 px or more, fine.
