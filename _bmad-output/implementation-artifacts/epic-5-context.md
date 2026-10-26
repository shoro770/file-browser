# Epic 5 Context: Choose a theme and meet the quality bar

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

The user switches among Light, Dark and Warm Sand, and the choice is remembered. The epic then closes v1 with a contrast audit, assistive-technology and display-mode checks (forced colors, reduced motion) and the release verification walkthroughs.

## Stories

- Story 5.1: Switch between Light, Dark and Warm Sand
- Story 5.2: Verify contrast in all three themes
- Story 5.3: Verify assistive-technology and display modes
- Story 5.4: Run the release verification

## Requirements & Constraints

- Switching applies at once to every surface, with no reload, and never clears Selection, expansion or scroll.
- At start: stored theme, else Light or Dark from the OS setting. Never Warm Sand by default. An invalid stored value is ignored.
- Only `theme` and `showDotfiles` persist, in `localStorage`, every access in `try/catch`. The app works silently when storage is unavailable.
- Text meets 4.5:1 and UI components or focus indicators 3:1 in every theme.
- No inline `style`, no network, no icon library, no writes to the user's files.

## Technical Decisions

- A theme is a set of CSS custom properties selected by `data-theme` on `<html>`. Components consume tokens only; no component CSS branches on theme.
- `src/lib/theme.ts` (`parseTheme`, `resolveTheme`), `services/prefs` (`readTheme`, `systemPrefersDark`) and the three token blocks in `index.css` exist already. `main.tsx` sets the first theme before render.
- Layering: components reach services only through `hooks/`. `App.tsx` is capped at 220 lines and must not gain state, effects or refs; the theme control lives in its own hook and component.
- Announcements go to the single polite `role="status"` region; the theme radio relies on native checked-state announcement.

## UX & Interaction Patterns

- Theme control: toolbar `role="radiogroup"` labeled "Theme"; three joined segments with sun, moon and dune glyphs; one tab stop; arrows move and select.
- Active segment: `accent` fill, `on-accent` text, check glyph, `aria-checked`. Segment widths are fixed to "Warm Sand"; weight never changes.
- Focus ring is 2px `focus-ring` in every theme. Forced colors: active segment gets a 2px `Highlight` border plus the check.

## Cross-Story Dependencies

- Story 5.2 reads the token values that 5.1 leaves in the stylesheet; 5.3 and 5.4 verify the control built in 5.1 in a real browser.
