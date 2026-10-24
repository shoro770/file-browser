# Review Log: file-browser UX specification

Date: 2026-10-23

Note: this file is an audit trail only. It records resolved items and review outcomes moved out of EXPERIENCE.md and DESIGN.md during the editorial structure pass. It is not a specification; DESIGN.md and EXPERIENCE.md are authoritative.

## Resolved (moved from EXPERIENCE.md Open Items)

Resolved: last-modified stamp in Preview Header (confirmed); tree roles `tree` / `treeitem` (owner decision); dotfile dimming at rest only, contrast now passes; dimming scoped to names starting with "." (node_modules item closed); text types (`.gitignore`, `.env`, extensionless config) previewed as text; divider minimums 220 / 320 px; soft wrap for text and Markdown; preview scroll preserved on Refresh; extensionless text recognition (static case-sensitive file-name list, owner decision).

## Resolved (moved from DESIGN.md, Colors / Contrast)

The earlier Warm Sand dotfile failure (hovered 4.36, selected 4.12 at 0.6 opacity) is closed by restoring full opacity on hover and selection. Selected dotfile rows keep the 3 px accent bar and `aria-selected`. Contrast values were recomputed with the WCAG formula.

### Review resolution (review-accessibility.md)

Fixed (in DESIGN.md / EXPERIENCE.md): A-1 dotfile dimming vs danger/muted text; A-2 divider at rest; A-3 hidden-files toggle name and pressed meaning; A-4 roving tabindex repair; A-6 forced colors; A-7 preview-outcome announcements; A-8 underlined and inert preview links; A-9 `aria-selected` on files only; A-10 placeholder rows as treeitems; A-11 Preview Pane region and tab stop; A-12 folder-open and selection-cleared announcements; A-13 live-region wiring; A-14 landmarks, title, language, headings; A-15 divider ARIA detail and hit area; A-16 rem minimums; A-17 reduced-motion (spinner, scroll); A-18 type-ahead, PageUp/PageDown, edge keys; N-1, N-2, N-3, N-4. Missing contrast pairs added to the DESIGN.md table. Mock-derived gaps closed: glyph set, Metadata Card Type strings, zero-byte stamp format, Modified / Last modified (documented as intentional).

Partly fixed, owner needed: A-5 Reflow (scoped exception stated; Open Item 8; 200% zoom and toolbar wrap specified); A-8 only for links (done); A-17 animated-image autoplay (Open Item 9).

Deferred: none other.
