---
name: file-browser
description: A calm, read-only two-pane file previewer. System fonts, vanilla CSS custom properties, three complete themes, zero network.
status: final
created: 2026-10-23
updated: 2026-10-23
colors:
  # light
  light-bg: '#F6F7F8'
  light-surface: '#FFFFFF'
  light-surface-raised: '#FFFFFF'
  light-row-hover: '#EEF0F2'
  light-row-selected: '#DCE8FA'
  light-border: '#D0D5DB'
  light-border-strong: '#808893'
  light-text: '#0E1115'
  light-text-muted: '#515A66'
  light-accent: '#1D4ED8'
  light-on-accent: '#FFFFFF'
  light-focus-ring: '#1D4ED8'
  light-notice-bg: '#FFF4D6'
  light-notice-text: '#5C3B00'
  light-notice-border: '#B7791F'
  light-danger-text: '#B42318'
  light-code-bg: '#F1F3F5'
  light-placeholder-bg: '#EEF0F2'
  # dark
  dark-bg: '#0D1014'
  dark-surface: '#14181D'
  dark-surface-raised: '#1B2027'
  dark-row-hover: '#222932'
  dark-row-selected: '#1E3A5F'
  dark-border: '#313945'
  dark-border-strong: '#6B7686'
  dark-text: '#E6EAF0'
  dark-text-muted: '#9AA5B4'
  dark-accent: '#6EA8FE'
  dark-on-accent: '#0D1014'
  dark-focus-ring: '#8BBBFF'
  dark-notice-bg: '#2E2610'
  dark-notice-text: '#F2D58A'
  dark-notice-border: '#8A6D1F'
  dark-danger-text: '#FF8A80'
  dark-code-bg: '#10141A'
  dark-placeholder-bg: '#1B2027'
  # sand
  sand-bg: '#EFE8DA'
  sand-surface: '#F7F2E8'
  sand-surface-raised: '#FBF8F1'
  sand-row-hover: '#EDE5D4'
  sand-row-selected: '#E2D4B6'
  sand-border: '#CBBFA6'
  sand-border-strong: '#857A62'
  sand-text: '#1A160E'
  sand-text-muted: '#5E5546'
  sand-accent: '#8A4B14'
  sand-on-accent: '#FFFFFF'
  sand-focus-ring: '#8A4B14'
  sand-notice-bg: '#F3E3B8'
  sand-notice-text: '#4F3500'
  sand-notice-border: '#A0742A'
  sand-danger-text: '#9B2C1C'
  sand-code-bg: '#EDE5D3'
  sand-placeholder-bg: '#EDE5D4'
typography:
  ui-body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  ui-label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
  tree-row:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  caption:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  heading-lg:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  heading-md:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.3'
  code:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.55'
rounded:
  sm: 4px
  DEFAULT: 6px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  toolbar-height: 44px   # minimum; implement as min-height 2.75rem
  row-height: 28px       # minimum; implement as min-height 1.75rem
  tree-indent: 16px
  divider-hit: 12px
  divider-grip-width: 3px
  divider-grip-height: 32px
  tree-width-default: 280px
  tree-width-min: 220px
  tree-width-max: 480px
  preview-min: 320px
  preview-gutter: 24px
  reading-max: 760px
components:
  toolbar:
    backgroundColor: '{colors.light-surface-raised}'
    textColor: '{colors.light-text}'
    height: '{spacing.toolbar-height}'
    padding: '{spacing.2}'
    borderColor: '{colors.light-border}'
  toolbar-button:
    backgroundColor: 'transparent'
    textColor: '{colors.light-text}'
    borderColor: '{colors.light-border-strong}'
    rounded: '{rounded.DEFAULT}'
    typography: '{typography.ui-label}'
    padding: '{spacing.2}'
  tree-row:
    height: '{spacing.row-height}'
    typography: '{typography.tree-row}'
    textColor: '{colors.light-text}'
    hoverBackground: '{colors.light-row-hover}'
    selectedBackground: '{colors.light-row-selected}'
    selectedBar: '{colors.light-accent}'
    indent: '{spacing.tree-indent}'
    rounded: '{rounded.sm}'
  tree-row-dotfile:
    opacity: 0.6
    appliesTo: the kind glyph and the name label only; never the row background, the Unavailable suffix and warning glyph, placeholder child rows, or any text-muted or danger-text content
    appliesWhen: row at rest only
    hoverOpacity: 1
    selectedOpacity: 1
  tree-row-unavailable:
    textColor: '{colors.light-danger-text}'
    typography: '{typography.caption}'
  divider:
    hitWidth: '{spacing.divider-hit}'
    gripWidth: '{spacing.divider-grip-width}'
    gripHeight: '{spacing.divider-grip-height}'
    lineColor: '{colors.light-border}'
    handleColor: '{colors.light-border-strong}'   # grip is drawn at rest, not only on hover (3:1)
    activeColor: '{colors.light-accent}'
  preview-header:
    backgroundColor: '{colors.light-surface-raised}'
    textColor: '{colors.light-text}'
    metaColor: '{colors.light-text-muted}'
    padding: '{spacing.3}'
    borderColor: '{colors.light-border}'
  notice-banner:
    backgroundColor: '{colors.light-notice-bg}'
    textColor: '{colors.light-notice-text}'
    borderColor: '{colors.light-notice-border}'
    rounded: '{rounded.DEFAULT}'
    padding: '{spacing.3}'
  metadata-card:
    backgroundColor: '{colors.light-surface-raised}'
    textColor: '{colors.light-text}'
    labelColor: '{colors.light-text-muted}'
    borderColor: '{colors.light-border-strong}'
    rounded: '{rounded.lg}'
    padding: '{spacing.5}'
    width: 420px
  empty-state:
    textColor: '{colors.light-text}'
    secondaryColor: '{colors.light-text-muted}'
    titleTypography: '{typography.heading-lg}'
    padding: '{spacing.6}'
  blocked-resource:
    backgroundColor: '{colors.light-placeholder-bg}'
    textColor: '{colors.light-text-muted}'
    borderColor: '{colors.light-border-strong}'
    rounded: '{rounded.DEFAULT}'
  theme-control:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    borderColor: '{colors.light-border-strong}'
    activeBackground: '{colors.light-accent}'
    activeTextColor: '{colors.light-on-accent}'
    rounded: '{rounded.DEFAULT}'
    reservedWidth: segments are sized for weight 600 so selection never shifts layout
  preview-link:
    textColor: '{colors.light-accent}'
    textDecoration: underline
    underlineThickness: 1px
  unsupported-browser:
    backgroundColor: '{colors.light-bg}'
    textColor: '{colors.light-text}'
    maxWidth: 480px
---

> Token convention. Colors are role tokens prefixed by theme: `light-`, `dark-`, `sand-` (Warm Sand). `components` entries and EXPERIENCE.md reference the `light-` name as the canonical spelling of a role; at runtime it resolves to whichever theme is active. `{colors.light-focus-ring}` therefore means "the focus ring color of the current theme".

## Brand & Style

A quiet instrument, not an app with a personality. file-browser sits beside a terminal and must feel lighter than an IDE: content-first, flat, nearly chrome-free, with generous reading space in the preview and tight, dense rows in the tree. The three themes are three moods of one system, not three skins:

- **Light** is crisp and editorial: near-white surfaces, cool gray structure, one confident blue accent.
- **Dark** is sleek and developer-leaning: blue-black surfaces, soft off-white text (never pure white), a lightened accent.
- **Warm Sand** is low-glare and earthy: paper-warm neutrals and a burnt-sienna accent, for long sessions.

Voice is plain and calm: short sentences, no exclamation marks, no emoji. Nothing decorative moves; motion is limited to a 120 ms color/opacity transition. Under `prefers-reduced-motion` all transitions and animations are removed: the tree spinner becomes a static glyph, the chevron rotates instantly and smooth scrolling is off.

## Colors

Each theme defines the same 18 roles, so a component never branches on theme. Hex values live in the frontmatter; roles, not values, are what components use.

| Role | Used for | Never used for |
|---|---|---|
| `bg` | Area behind the panes, unsupported-browser screen | Text containers |
| `surface` | Tree pane, preview pane | Raised elements |
| `surface-raised` | Toolbar, Preview Header, Metadata Card | Pane bodies |
| `row-hover`, `row-selected` | Tree row states | Anything outside the tree |
| `border` | Decorative hairlines between regions | Control boundaries (see `border-strong`) |
| `border-strong` | Control outlines, divider handle, card outline (3:1) | Hairlines |
| `text`, `text-muted` | Primary and secondary text | Dimming (dotfile rule: Components `tree-row-dotfile`) |
| `accent`, `on-accent` | Links (always underlined), selected-row bar, active segment | Large fills other than the active segment |
| `focus-ring` | 2 px focus outline, offset 1 px, on every focusable element | Selection |
| `notice-*` | Truncation banner only | Errors |
| `danger-text` | Unavailable entries, access-denied message | Decoration |
| `code-bg` | Text-preview and code-block background | Panes |
| `placeholder-bg` | Blocked remote resource | Anything else |

Selection is never signalled by color alone: the selected row also carries a 3 px `accent` bar on its leading edge and `aria-selected`. The bar is a real `border-inline-start`, not a background or shadow, so it survives forced colors.

### CSS custom property mapping

Theme is set by `data-theme="light|dark|sand"` on `<html>`. With no stored choice the app sets it from `prefers-color-scheme` (light or dark; FR-23).

| Token path | CSS custom property | Scope |
|---|---|---|
| `colors.<theme>-<role>` | `--color-<role>` | `:root[data-theme="<theme>"]`, one block per theme; `sand` maps from `sand-` |
| `typography.<name>.fontFamily/fontSize/fontWeight/lineHeight` | `--font-<name>-family/-size/-weight/-line` | `:root` |
| `rounded.<name>` (`DEFAULT` becomes `base`) | `--radius-<name>` | `:root` |
| `spacing.<name>` | `--space-<name>` (numeric levels) or `--size-<name>` (named) | `:root` |
| `components.<c>.<prop>` | Not emitted; components compose the variables above | none |

Example: `colors.dark-surface` becomes `--color-surface: #14181D;` inside `:root[data-theme="dark"]`. Switching theme changes one attribute; no component CSS is theme-aware. Set `color-scheme: light` or `dark` per theme so native scrollbars and form controls match. Rendered previews (Markdown, DOCX) inherit the same variables, so they follow the theme without re-rendering.

### Contrast verification (WCAG 2.1 AA)

Computed with the WCAG relative-luminance formula on the hex values above. Text needs 4.5:1; UI components and focus indicators need 3:1. Rows are grouped by foreground: text, muted, accent, danger, focus, borders.

| Pair (fg / bg) | Use | Min | Light | Dark | Warm Sand |
|---|---|---|---|---|---|
| text / surface | Tree names, preview text | 4.5 | 18.92 | 14.76 | 16.15 |
| text / bg | Toolbar labels on app background | 4.5 | 17.64 | 15.79 | 14.79 |
| text / surface-raised | Toolbar and Metadata Card text | 4.5 | 18.92 | 13.56 | 16.99 |
| text / row-hover | Hovered row | 4.5 | 16.56 | 12.15 | 14.39 |
| text / row-selected | Selected row | 4.5 | 15.29 | 9.53 | 12.30 |
| text / code-bg | Text preview | 4.5 | 17.01 | 15.30 | 14.38 |
| notice-text / notice-bg | Truncation banner | 4.5 | 9.21 | 10.46 | 8.95 |
| text-muted / surface | Secondary text | 4.5 | 6.99 | 7.14 | 6.57 |
| text-muted / surface-raised | Last Modified Stamp, Metadata Card labels | 4.5 | 6.99 | 6.56 | 6.91 |
| text-muted / row-selected | Secondary text on selected row | 4.5 | 5.65 | 4.61 | 5.00 |
| text-muted / row-hover | Muted text on hovered row | 4.5 | 6.12 | 5.88 | 5.85 |
| text-muted / bg | Muted text on app background | 4.5 | 6.52 | 7.64 | 6.01 |
| text-muted / code-bg | Muted text in code areas | 4.5 | 6.28 | 7.40 | 5.85 |
| text-muted / placeholder-bg | Blocked-resource placeholder | 4.5 | 6.12 | 6.56 | 5.85 |
| accent / surface | Links, active control text | 4.5 | 6.70 | 7.38 | 6.08 |
| accent / surface-raised | Links in header and card | 4.5 | 6.70 | 6.78 | 6.39 |
| accent / bg | Accent text on app background | 4.5 | 6.25 | 7.90 | 5.56 |
| accent / row-hover | Link or accent text on hovered row | 4.5 | 5.87 | 6.08 | 5.41 |
| accent / row-selected | Accent text on selected row | 4.5 | 5.41 | 4.76 | 4.63 |
| on-accent / accent | Text on accent fill | 4.5 | 6.70 | 7.90 | 6.78 |
| accent bar / row-selected | Selected-row 3 px bar (UI) | 3 | 5.41 | 4.76 | 4.63 |
| accent / text | Link vs body text (color alone) | 3 | 2.82 | 2.00 | 2.66 |
| danger-text / surface | Unavailable entry, error text | 4.5 | 6.57 | 7.81 | 6.79 |
| danger-text / surface-raised | Error text on raised surfaces | 4.5 | 6.57 | 7.17 | 7.15 |
| danger-text / row-hover | Unavailable suffix on hovered row | 4.5 | 5.75 | 6.43 | 6.05 |
| danger-text / row-selected | Unavailable suffix on selected row | 4.5 | 5.31 | 5.04 | 5.17 |
| danger-text / bg | Access-denied notice on app background | 4.5 | 6.13 | 8.35 | 6.22 |
| danger-text / code-bg | Error text in code areas | 4.5 | 5.91 | 8.09 | 6.05 |
| focus-ring / surface | Focus ring (UI) | 3 | 6.70 | 9.04 | 6.08 |
| focus-ring / surface-raised | Focus ring in toolbar and header (UI) | 3 | 6.70 | 8.30 | 6.39 |
| focus-ring / bg | Focus ring on app background (UI) | 3 | 6.25 | 9.67 | 5.56 |
| focus-ring / row-hover | Focus ring on hovered row (UI) | 3 | 5.87 | 7.44 | 5.41 |
| focus-ring / row-selected | Focus ring on selected row (UI) | 3 | 5.41 | 5.83 | 4.63 |
| focus-ring / code-bg | Focus ring on text preview (UI) | 3 | 6.02 | 9.37 | 5.41 |
| focus-ring / notice-bg | Focus ring within banner (UI) | 3 | 6.12 | 7.60 | 5.32 |
| focus-ring / placeholder-bg | Focus ring on blocked placeholder (UI) | 3 | 5.87 | 8.30 | 5.41 |
| border-strong / surface | Divider handle, control borders (UI) | 3 | 3.58 | 3.87 | 3.80 |
| border-strong / surface-raised | Metadata Card outline (UI) | 3 | 3.58 | 3.56 | 3.99 |
| border-strong / bg | Control borders on app background (UI) | 3 | 3.34 | 4.14 | 3.47 |
| border-strong / row-hover | Control outline on hovered row (UI) | 3 | 3.14 | 3.19 | 3.38 |
| notice-border / notice-bg | Banner border (UI) | 3 | 3.32 | 3.06 | 3.28 |
| notice-border / surface | Banner border on pane (UI) | 3 | 3.64 | 3.64 | 3.74 |

All listed pairs pass in all three themes except `accent / text`, which is deliberately below 3:1: link color alone does not distinguish a link from body text, so every link in rendered Markdown and DOCX is underlined (1 px, `accent`, offset 2 px), and the underline is verified by the `accent` pairs above. Margins are thin for Sand dotfile rest (4.55), Dark `notice-border` on `notice-bg` (3.06) and Dark `text-muted` on `row-selected` (4.61), so re-run the check whenever a token changes. `border` hairlines (about 1.5:1) are decorative separators between regions that are also separated by surface contrast and layout; they carry no meaning alone, so they are exempt. Every boundary that identifies a control uses `border-strong`, including the divider grip, which is drawn at rest.

**Dotfile rows.** The rule itself is defined once, in Components (`tree-row-dotfile`). Contrast: at rest, `text` is blended 60% over `surface`; hovered and selected dotfile rows use full-opacity `text`, covered by the `text / row-hover` and `text / row-selected` rows above:

| Dotfile name at 0.6 opacity over | Min | Light | Dark | Warm Sand |
|---|---|---|---|---|
| row at rest (surface), dimmed 0.6 | 4.5 | 4.97 | 6.00 | 4.55 |
| row hovered, full opacity (`text / row-hover`) | 4.5 | 16.56 | 12.15 | 14.39 |
| row selected, full opacity (`text / row-selected`) | 4.5 | 15.29 | 9.53 | 12.30 |

Rest at 0.6 passes (Warm Sand margin is thin at 4.55). Dimming `danger-text` or `text-muted` at 0.6 would give 3.08 / 3.57 / 2.99 and 2.77 / 3.38 / 2.70 on `surface` (fail), which is why those are exempt.

## Typography

System font stacks only; no web fonts are loaded (NFR-5, zero network). Sans for all UI, monospace for text preview, code blocks and file-size/type values in the Metadata Card.

| Token | Use | Size / weight |
|---|---|---|
| `{typography.ui-body}` | Preview body prose (Markdown, DOCX), empty-state body | 14 / 400, line 1.5 |
| `{typography.ui-label}` | Toolbar buttons, theme control, Preview Header name | 13 / 500 |
| `{typography.tree-row}` | Tree rows | 13 / 400 |
| `{typography.caption}` | Last Modified Stamp, unavailable suffix, Metadata Card labels | 12 / 400 |
| `{typography.heading-lg}` | Empty-state and unsupported-browser titles | 22 / 600 |
| `{typography.heading-md}` | Metadata Card file name, Markdown h2-h3 | 16 / 600 |
| `{typography.code}` | Text preview, inline and block code, Metadata Card values | 13 / 400, line 1.55 |

Sizes are authored in `rem` (13 px = 0.8125rem) so browser font-size settings and text-spacing overrides (WCAG 1.4.4, 1.4.12) scale the UI. Rendered Markdown scales headings from `heading-lg` (h1) down to `ui-body` bold (h5-h6) and caps line length at `{spacing.reading-max}` for prose; plain-text and Markdown previews use standard soft wrap, so there is no horizontal scroll by default (code blocks inside Markdown may still scroll). Numerals in sizes and dates use `font-variant-numeric: tabular-nums`.

## Layout & Spacing

A 4 px base scale (`{spacing.1}` to `{spacing.7}`). Designed for a maximized desktop window (FR-24); no mobile or narrow-viewport layout. `row-height` and `toolbar-height` are minimums set in `rem` (`min-height`), so rows and toolbar grow under larger text or text-spacing overrides instead of clipping.

- **Zoom and reflow (scoped exception).** The two panes need at least 548 px (220 + 12 + 320 minimum widths). At 200% zoom on a 1280 px window the viewport is 640 CSS px, so the layout holds with no page-level horizontal scroll; the toolbar may wrap onto a second row (the Workspace Folder name truncates first, then the control group wraps). At 400% zoom (320 CSS px) WCAG 1.4.10 Reflow is not met: the layout does not restack and the page scrolls in two dimensions. This is a deliberate, documented exception consistent with FR-24 (maximized desktop only, no narrow layout), not an oversight; no stacked or mobile layout is introduced. The accessibility claim is therefore WCAG 2.1 AA with this one stated exception (see EXPERIENCE.md Open Items).

- **Structure:** a full-width toolbar (`{spacing.toolbar-height}`) over two independently scrolling panes: Tree left, Preview Pane right.
- **Divider:** a `{spacing.divider-hit}` hit area overlaying the pane edge without covering the tree scrollbar, with a 1 px visible line and a grip visible at rest. Tree width starts at `{spacing.tree-width-default}`; the resize limits (`{spacing.tree-width-min}`, `{spacing.tree-width-max}` with the 40% cap, `{spacing.preview-min}`, and which wins) are behavioral and live in EXPERIENCE.md Interaction Primitives. The `tree-width-min` and `preview-min` minimums are owner decisions; the default, maximum and 40% cap are `[ASSUMPTION]` (PRD FR-24 requires only a resizable divider and a majority preview).
- **Maximize preview width:** the Tree is deliberately narrow; at the default width the preview holds roughly 75% of a 1440 px window. Preview content uses a `{spacing.preview-gutter}` side gutter; media (images, PDF pages) fills the pane width, prose caps at `{spacing.reading-max}` and is left-aligned, not centered, so the reading edge stays stable while resizing.
- **Rows:** `{spacing.row-height}` tall, indent `{spacing.tree-indent}` per level, `{spacing.2}` gap between chevron, icon and label. Long names truncate with an ellipsis (full-name `title`: EXPERIENCE.md Component Patterns).
- **Dense, not cramped:** vertical rhythm in the preview follows `{typography.ui-body.lineHeight}`; Metadata Card and empty states are centered in the available pane with `{spacing.6}` padding.

## Elevation & Depth

Flat. Depth comes from tonal layering: `bg` behind, `surface` for panes, `surface-raised` for the toolbar, Preview Header and Metadata Card, separated by `border` hairlines. There are no drop shadows, no overlays, no modals and no popovers in v1. The one raised object, the Metadata Card, is distinguished by a `border-strong` outline and `surface-raised`, which is legible in all three themes without a shadow.

## Shapes

Soft but disciplined. Rows and small chips use `{rounded.sm}`; buttons, the segmented control, banners and blocked-resource placeholders use `{rounded.DEFAULT}`; the Metadata Card uses `{rounded.lg}`. The segmented control's outer shape is `{rounded.DEFAULT}`; its inner active segment is `{rounded.sm}`. Panes themselves are square and edge-to-edge. Rendered images are not rounded.

## Components

Visual specs only; behavior lives in EXPERIENCE.md Component Patterns. Key-screen mocks (all three themes): [two-pane with Markdown preview](mockups/key-two-pane.html), [Metadata Card](mockups/key-metadata-card.html), [truncation banner](mockups/key-truncation.html). These spines win on any conflict with a mock. All icons are inline SVG, 16 px, `currentColor`, 1.5 px stroke; no icon library.

- **Toolbar** (`components.toolbar`): `surface-raised`, `{spacing.toolbar-height}` high, bottom `border` hairline. Left to right: Open folder button, Workspace Folder name (`ui-label`, truncating), flexible spacer, Hidden files toggle, Refresh button, theme control. Height is a minimum; the bar wraps rather than clipping (see Layout & Spacing). The Hidden files toggle always shows an eye glyph (eye = shown state; eye with slash = not shown; meaning defined in EXPERIENCE.md Accessibility Floor) and a visible state word ("Shown" / "Hidden"); the shown (pressed) state also fills `row-selected`, so state never relies on color alone. Buttons: transparent fill, `border-strong` outline, `{rounded.DEFAULT}`, `ui-label` text with a leading inline-SVG glyph; hover fills `row-hover`; disabled drops to `text-muted` and keeps the outline.
- **Tree row** (`components.tree-row`): 28 px; chevron (folders only, rotates 90 degrees when expanded), kind glyph (from the file-kind glyph set below), label. Hover `row-hover`. Selected: `row-selected` fill plus 3 px `accent` leading bar. Focus: 2 px `focus-ring` outline inset so it is not clipped by the pane.
- **Dotfile-dimmed row** (`components.tree-row-dotfile`) is the canonical statement of the dotfile rule; every other mention points here.
  - Identical to a tree row, with `opacity: 0.6` on the kind glyph and the name label only, at rest only (120 ms opacity transition, removed under `prefers-reduced-motion`).
  - Opacity is 1.0 while the row is hovered or selected/active.
  - Never dimmed: the row background and wrapper, the "Unavailable" suffix and its warning glyph (`danger-text`), and placeholder child rows ("Empty folder", "No visible files", "Loading...", "This folder can't be read."). These keep full opacity so `text-muted` and `danger-text` keep their AA values (see Colors, Contrast).
  - Scope: any entry whose name starts with ".", file or folder, and nothing else (no hardcoded names such as `node_modules`).
  - Descendants of a dotfile folder dim their own glyph and name at 0.6 at rest; opacity is set per element and does not compound through nesting; their placeholder children do not dim.
  - Selected dotfile rows keep the 3 px accent bar and `aria-selected`. On an unavailable dotfile row only the name and kind glyph dim.
- **Divider** (`components.divider`): 1 px `border` line inside the hit area; a centered grip (`gripWidth` by `gripHeight`) in `border-strong` (3:1, see Contrast) is always visible, at rest as well as on hover and focus. Hover and drag turn the line and grip `accent`; keyboard focus shows the standard 2 px focus ring around the grip. Cursor `col-resize`.
- **Preview Header** (`components.preview-header`): `surface-raised` strip with a bottom hairline. Row 1: file-kind glyph and file name (`ui-label`, truncating). Row 2 (or right-aligned when wide): "Modified {when}" stamp in `caption` and `text-muted`, rendered in a `<time>` element. Placement: header only (EXPERIENCE.md Component Patterns).
- **Truncation notice banner** (`components.notice-banner`): full width of the text preview (placement and dismissal: EXPERIENCE.md Component Patterns), `notice-bg` fill, 1 px `notice-border`, `notice-text`, leading inline-SVG info glyph, `{rounded.DEFAULT}`, `{spacing.3}` padding.
- **Metadata Card** (`components.metadata-card`): centered in the pane at its token width; large kind glyph (48 px, `text-muted`), file name in `heading-md`, then a definition list (Name omitted; Size, Type, Last modified) with labels in `caption`/`text-muted` and values in `code`. The large glyph comes from the file-kind glyph set. Type strings and glyph-per-kind: EXPERIENCE.md Component Patterns, Content rules. An optional explanation line sits beneath in `ui-body`.
- **Empty states** (`components.empty-state`): centered column: 48 px outline glyph in `text-muted`, `heading-lg` title, `ui-body` secondary line in `text-muted`, optional single primary button. Primary button: `accent` fill, `on-accent` text. Used for no-folder, no-selection and empty-folder.
- **File-kind glyph set** `[ASSUMPTION]`: seven inline-SVG glyphs, 16 px in tree rows and the Preview Header, 48 px in the Metadata Card, `currentColor`, 1.5 px stroke, `aria-hidden="true"`, distinguished by shape (never color): folder (same shape collapsed or expanded; the chevron carries state), generic file (page with folded corner; default and unknown types), image (frame with mountain and sun), document (page with text lines; .docx and .doc), pdf (page with "PDF" tab), text (page with short left-aligned lines; plain text, Markdown, recognized config names), binary (page with 0/1 blocks; known unpreviewable types such as archives and executables). A blocked-resource, warning, info, eye, sun, moon and dune glyph complete the icon inventory.
- **Preview links** (`components.preview-link`): all links in rendered Markdown and DOCX are `accent` and underlined (1 px, offset 2 px) in every theme and state. Inert links (blocked remote, or unsafe) render as plain `text` with no underline (behavior: EXPERIENCE.md). Focus uses the standard ring.
- **Forced colors** (`@media (forced-colors: active)`): system colors take over (`CanvasText`, `Canvas`, `Highlight`, `GrayText`, `LinkText`); the app keeps structure with real borders and outlines, not backgrounds or shadows.
  - Selected row: the 3 px bar is `border-inline-start` (maps to `Highlight`) and the row also gets a 1 px `Highlight` outline.
  - Active theme segment: a visible 2 px `Highlight` border plus a check glyph, since the fill is overridden.
  - Focus: `outline` (survives).
  - Divider line and grip: `CanvasText` borders.
  - Disabled controls: `GrayText` text and border.
  - Blocked-resource dashed border: `CanvasText`.
  - Notice banner: `CanvasText` 1 px border.
  - Dotfile opacity is reset to 1 and dotfile rows are distinguished by nothing beyond the leading "." in the name (the dim is cosmetic).
  - The three themes and `color-scheme` are moot here and the theme control stays functional but visually inert.
- **Unavailable-entry row** (`components.tree-row-unavailable`): a normal tree row whose label is followed by an "Unavailable" suffix in `caption` / `danger-text`, preceded by a small inline-SVG warning glyph. The label stays `text`; only the suffix and glyph carry `danger-text` (4.5:1 verified on `surface`, `row-hover` and `row-selected`).
- **Blocked-remote-resource placeholder** (`components.blocked-resource`): inline block with `placeholder-bg`, 1 px dashed `border-strong`, `{rounded.DEFAULT}`, an image-off inline-SVG glyph, label in `caption` / `text-muted`. Minimum 120 x 48 px (not tokenized); it replaces the image in flow, so layout does not jump.
- **Theme segmented control** (`components.theme-control`): three joined segments (Light, Dark, Warm Sand).
  - `border-strong` outline; inactive segments `surface` / `text`; active segment `accent` fill with `on-accent` text and a leading check glyph (state is not color alone; `aria-checked`: EXPERIENCE.md Accessibility Floor).
  - Weight stays 400/500 for all segments so selecting never shifts width; segment widths are fixed to the longest label ("Warm Sand").
  - A small inline-SVG glyph (sun, moon, dune) precedes each label.
  - Native radio inputs may be used (tab stop: EXPERIENCE.md Interaction Primitives).
- **Unsupported-browser screen** (`components.unsupported-browser`): full-window `bg`; a centered column at its token width with a `heading-lg` title and `ui-body` paragraph; no toolbar, no panes, no actions.

## Do's and Don'ts

Do
- Reference colors by role (`--color-surface`), never by hex, in component CSS.
- Verify any new text/background pair against all three themes before adding it.
- Use `border-strong` for anything that must be recognized as a control.
- Follow the dotfile rule in Components (`tree-row-dotfile`): scope, rest-only dimming and exempt status text are defined there, not here.
- Underline every link in rendered previews.
- Draw the divider grip at rest, in `border-strong`.
- Keep every glyph inline SVG with `currentColor` and `aria-hidden="true"` (the row label carries the meaning).
- Signal state with shape or text in addition to color (bar, suffix, `aria-*`).

Don't
- Don't add web fonts, CDN stylesheets, icon libraries, Tailwind or any UI framework.
- Don't use shadows, gradients, blur or modals.
- Don't rely on background, fill or box-shadow alone for selection or active state (forced colors).
- Don't use `notice-*` colors for errors or `danger-text` for notices.
- Don't use pure `#000` or `#FFF` for text in Dark, or hard-coded theme checks in component CSS.
- Don't animate layout; transitions are color/opacity only and respect `prefers-reduced-motion`.
