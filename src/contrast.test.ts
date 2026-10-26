/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { blendOver, contrastRatio } from './lib/contrast'

const THEMES = ['light', 'dark', 'sand'] as const
type ThemeName = (typeof THEMES)[number]
type Tokens = Record<string, string>

const indexCss = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8')
const appCss = readFileSync(join(import.meta.dirname, 'App.css'), 'utf8')

/**
 * Reads the `--color-*` tokens of one theme from the stylesheet source.
 * @param css - Text of `index.css`.
 * @param theme - Theme whose `:root[data-theme="…"]` block to read.
 * @returns Token name (without `--color-`) to `#RRGGBB`.
 */
function readTokens(css: string, theme: ThemeName): Tokens {
  const block = new RegExp(`:root(?:,\\s*:root)?\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`).exec(css)?.[1]
  if (block === undefined) throw new Error(`index.css has no :root[data-theme="${theme}"] block`)
  const tokens: Tokens = {}
  for (const [, name, value] of block.matchAll(/--color-([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) tokens[name!] = value!
  const declared = [...block.matchAll(/--color-[\w-]+\s*:/g)].length
  if (declared !== Object.keys(tokens).length) {
    throw new Error(`${theme}: ${declared} --color-* declarations but ${Object.keys(tokens).length} unique #RRGGBB tokens; use one plain hex value per token`)
  }
  return tokens
}

const TOKENS = Object.fromEntries(THEMES.map((theme) => [theme, readTokens(indexCss, theme)])) as Record<ThemeName, Tokens>

/**
 * Looks up a token, failing loudly instead of passing on a missing one.
 * @param theme - Theme name.
 * @param name - Token name without `--color-`.
 * @returns The `#RRGGBB` value.
 */
function token(theme: ThemeName, name: string): string {
  const value = TOKENS[theme][name]
  if (value === undefined) throw new Error(`${theme}: --color-${name} is missing from index.css`)
  return value
}

/**
 * Asserts a pair meets a minimum using the unrounded ratio.
 * @param theme - Theme name.
 * @param fg - Foreground token.
 * @param bg - Background token.
 * @param min - Required ratio.
 */
function expectAtLeast(theme: ThemeName, fg: string, bg: string, min: number): void {
  const actual = contrastRatio(token(theme, fg), token(theme, bg), null)
  expect(actual, `${theme}: ${fg} on ${bg} needs at least ${min}:1 but is ${actual.toFixed(2)}:1`).toBeGreaterThanOrEqual(min)
}

/** Every pair of the DESIGN.md "Contrast verification" table: foreground, background, minimum. */
const PAIRS: ReadonlyArray<readonly [string, string, number]> = [
  ['text', 'surface', 4.5],
  ['text', 'bg', 4.5],
  ['text', 'surface-raised', 4.5],
  ['text', 'row-hover', 4.5],
  ['text', 'row-selected', 4.5],
  ['text', 'code-bg', 4.5],
  ['notice-text', 'notice-bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'surface-raised', 4.5],
  ['text-muted', 'row-selected', 4.5],
  ['text-muted', 'row-hover', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'code-bg', 4.5],
  ['text-muted', 'placeholder-bg', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'surface-raised', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'row-hover', 4.5],
  ['accent', 'row-selected', 4.5],
  ['on-accent', 'accent', 4.5],
  ['accent', 'row-selected', 3],
  ['danger-text', 'surface', 4.5],
  ['danger-text', 'surface-raised', 4.5],
  ['danger-text', 'row-hover', 4.5],
  ['danger-text', 'row-selected', 4.5],
  ['danger-text', 'bg', 4.5],
  ['danger-text', 'code-bg', 4.5],
  ['focus-ring', 'surface', 3],
  ['focus-ring', 'surface-raised', 3],
  ['focus-ring', 'bg', 3],
  ['focus-ring', 'row-hover', 3],
  ['focus-ring', 'row-selected', 3],
  ['focus-ring', 'code-bg', 3],
  ['focus-ring', 'notice-bg', 3],
  ['focus-ring', 'placeholder-bg', 3],
  ['border-strong', 'surface', 3],
  ['border-strong', 'surface-raised', 3],
  ['border-strong', 'bg', 3],
  ['border-strong', 'row-hover', 3],
  ['notice-border', 'notice-bg', 3],
  ['notice-border', 'surface', 3],
]

describe('theme tokens in index.css', () => {
  it.each(THEMES)('%s defines every colour the pair table uses', (theme) => {
    const names = new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]))
    for (const name of names) expect(TOKENS[theme][name], `${theme}: --color-${name}`).toBeDefined()
  })
})

describe.each(THEMES)('%s contrast (WCAG 2.1 AA)', (theme) => {
  it.each(PAIRS)('%s on %s is at least %s:1', (fg, bg, min) => {
    expectAtLeast(theme, fg, bg, min)
  })

  it('dims dotfile names at 0.6 over surface and still reaches 4.5:1', () => {
    const dimmed = blendOver(token(theme, 'text'), token(theme, 'surface'), 0.6)
    const actual = contrastRatio(dimmed, token(theme, 'surface'), null)
    expect(actual, `${theme}: dotfile rest needs at least 4.5:1 but is ${actual.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
  })

  it('hovered and selected dotfile rows use the full-opacity text pairs', () => {
    expectAtLeast(theme, 'text', 'row-hover', 4.5)
    expectAtLeast(theme, 'text', 'row-selected', 4.5)
  })

  it.each(['text-muted', 'danger-text'])('%s at 0.6 over surface fails 4.5:1, so it is exempt from dimming', (name) => {
    const dimmed = blendOver(token(theme, name), token(theme, 'surface'), 0.6)
    expect(contrastRatio(dimmed, token(theme, 'surface'), null)).toBeLessThan(4.5)
  })

  it('keeps accent on text below 3:1, so links need an underline', () => {
    expect(contrastRatio(token(theme, 'accent'), token(theme, 'text'), null)).toBeLessThan(3)
  })
})

describe('thin margins named in DESIGN.md', () => {
  it('Sand dotfile rest stays at 4.55 or better', () => {
    const dimmed = blendOver(token('sand', 'text'), token('sand', 'surface'), 0.6)
    expect(contrastRatio(dimmed, token('sand', 'surface'))).toBeGreaterThanOrEqual(4.55)
  })

  it('Dark notice-border on notice-bg stays at 3.06 or better', () => {
    expect(contrastRatio(token('dark', 'notice-border'), token('dark', 'notice-bg'))).toBeGreaterThanOrEqual(3.06)
  })

  it('Dark text-muted on row-selected stays at 4.61 or better', () => {
    expect(contrastRatio(token('dark', 'text-muted'), token('dark', 'row-selected'))).toBeGreaterThanOrEqual(4.61)
  })
})

describe('stylesheet rules the contrast maths relies on', () => {
  it('underlines every link in rendered previews', () => {
    const rule = /\.rendered-content a\s*\{([^}]*)\}/.exec(appCss)?.[1]
    expect(rule, '.rendered-content a rule').toBeDefined()
    expect(rule).toMatch(/text-decoration:\s*underline/)
  })

  it('dims dotfile glyph and label to 0.6 at rest and restores 1 on hover and selection', () => {
    const rules = [...appCss.matchAll(/([^{}]*\.tree-row--dotfile[^{}]*)\{([^}]*)\}/g)]
    const opacityOf = (matches: (selector: string) => boolean): string[] =>
      rules.filter(([, selector]) => matches(selector!)).flatMap(([, , body]) => [...body!.matchAll(/opacity:\s*([\d.]+)/g)].map((m) => m[1]!))
    const atRest = (s: string) => !/:hover|\.is-selected/.test(s)
    expect(opacityOf((s) => atRest(s) && s.includes('> .glyph'))).toContain('0.6')
    expect(opacityOf((s) => atRest(s) && s.includes('__label'))).toContain('0.6')
    expect(opacityOf((s) => /:hover/.test(s) && /\.is-selected/.test(s))).toEqual(['1'])
  })
})
