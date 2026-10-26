/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (name: string) => readFileSync(join(import.meta.dirname, name), 'utf8')
const appCss = read('App.css')
const indexCss = read('index.css')
const html = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8')

/**
 * Collects the bodies of every `@media (<query>)` block, honouring nested braces.
 *
 * @param css - Stylesheet text.
 * @param query - The text inside the media query parentheses.
 * @returns The bodies, in source order; empty when the query never appears.
 */
function mediaBlocks(css: string, query: string): string[] {
  const out: string[] = []
  const head = `@media (${query})`
  for (let at = css.indexOf(head); at !== -1; at = css.indexOf(head, at + head.length)) {
    const open = css.indexOf('{', at)
    let depth = 1
    let i = open + 1
    while (i < css.length && depth > 0) depth += css[i++] === '{' ? 1 : css[i - 1] === '}' ? -1 : 0
    out.push(css.slice(open + 1, i - 1))
  }
  if (out.length === 0) throw new Error(`no @media (${query}) block found`)
  return out
}

/** Returns the declaration block of the first rule whose selector list contains `selector`, across the given text. */
function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // The selector must start a selector list (after `}`, `,` or the start), never follow a combinator.
  const match = new RegExp(`(?:^|[},])\\s*${escaped}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, 'm').exec(css)
  if (!match) throw new Error(`no rule for ${selector}`)
  return match[1]
}

const forced = mediaBlocks(appCss, 'forced-colors: active').join('\n')

describe('forced colors (UX-DR27)', () => {
  it('maps the selected row to a Highlight bar and a 1px Highlight outline', () => {
    const block = rule(forced, '.tree-row.is-selected')
    expect(block).toMatch(/border-inline-start-color:\s*Highlight/)
    expect(block).toMatch(/outline:\s*1px solid Highlight/)
  })

  it('gives the active theme segment a Highlight border and keeps dotfiles at full opacity', () => {
    expect(rule(forced, '.theme-switch__segment.is-active')).toMatch(/border-color:\s*Highlight/)
    expect(rule(forced, '.tree-row--dotfile > .tree-row__label')).toMatch(/opacity:\s*1/)
  })

  it('uses CanvasText for the divider, banner, notice and blocked placeholder', () => {
    expect(rule(forced, '.divider__grip')).toMatch(/background:\s*CanvasText/)
    expect(rule(forced, '.truncation-banner')).toMatch(/CanvasText/)
    expect(rule(forced, '.preview__notice')).toMatch(/CanvasText/)
    expect(rule(forced, '.blocked-resource')).toMatch(/border-color:\s*CanvasText/)
  })

  it('uses GrayText for disabled controls and placeholder rows', () => {
    expect(rule(forced, '.button:disabled')).toMatch(/color:\s*GrayText/)
    expect(rule(forced, '.tree-row--placeholder')).toMatch(/color:\s*GrayText/)
  })

  it('uses only system colours inside forced-colors blocks and keeps focus as an outline', () => {
    expect(forced).not.toMatch(/#[0-9a-fA-F]{3,8}\b|var\(--color|rgba?\(|hsla?\(|oklch\(|color-mix\(/)
    expect(appCss).toMatch(/\.tree-item:focus-visible > \.tree-row\s*\{[^}]*outline:\s*2px solid/)
  })
})

describe('reduced motion (UX-DR27)', () => {
  it('removes every transition and animation globally and for the spinner and chevron', () => {
    const global = mediaBlocks(indexCss, 'prefers-reduced-motion: reduce').join('\n')
    expect(global).toMatch(/transition:\s*none\s*!important/)
    expect(global).toMatch(/animation:\s*none\s*!important/)
    const local = mediaBlocks(appCss, 'prefers-reduced-motion: reduce').join('\n')
    expect(rule(local, '.spinner')).toMatch(/animation:\s*none/)
    expect(rule(local, '.chevron')).toMatch(/transition:\s*none/)
  })

  it('never turns on smooth scrolling', () => {
    expect(appCss + indexCss).not.toMatch(/scroll-behavior:\s*smooth/)
  })
})

describe('zoom and text spacing (UX-DR28)', () => {
  it('lets the toolbar wrap and the folder name truncate first', () => {
    expect(rule(appCss, '.shell__toolbar')).toMatch(/flex-wrap:\s*wrap/)
    expect(rule(appCss, '.shell__folder-name')).toMatch(/text-overflow:\s*ellipsis/)
  })

  it('sizes rows and the toolbar as rem minimums, never fixed pixel heights', () => {
    expect(rule(appCss, '.shell__toolbar')).toMatch(/min-height:\s*var\(--size-toolbar-height\)/)
    expect(rule(appCss, '.tree-row')).toMatch(/min-height:\s*var\(--size-row-height\)/)
    expect(indexCss).toMatch(/--size-toolbar-height:\s*[\d.]+rem/)
    expect(indexCss).toMatch(/--size-row-height:\s*[\d.]+rem/)
    expect(rule(appCss, '.tree-row')).not.toMatch(/(?<!-)height:\s*\d+px/)
    expect(rule(appCss, '.shell__toolbar')).not.toMatch(/(?<!-)height:\s*\d+px/)
  })
})

describe('page language', () => {
  it('declares English on the document', () => {
    expect(html).toMatch(/<html lang="en">/)
    expect(html).toMatch(/<title>file-browser<\/title>/)
  })
})
