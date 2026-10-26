// @vitest-environment jsdom
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'
import { BLOCKED_IMAGE_LABEL } from './sanitize'

/** The same file the manual SM-3 check opens in `vite preview`. */
const FIXTURE = join(import.meta.dirname, '..', '..', 'scripts', 'fixtures', 'hostile.md')

describe('hostile Markdown fixture', () => {
  it('renders inert: nothing executable, nothing that can load off the page', async () => {
    const text = readFileSync(FIXTURE, 'utf8')
    const fragment = await renderMarkdown({ text, truncated: false, totalSize: text.length })
    const holder = document.createElement('div')
    holder.append(fragment)

    expect(holder.querySelector('script, iframe, object, embed, form, style, link')).toBeNull()
    for (const el of holder.querySelectorAll('*')) {
      expect(el.getAttributeNames().filter((n) => n === 'style' || n.startsWith('on'))).toEqual([])
    }
    expect(holder.querySelector('img')).toBeNull()
    expect(holder.querySelector('[src]')).toBeNull()
    expect(holder.querySelector('[srcset], [data], [action], [formaction], [background]')).toBeNull()
    expect(holder.textContent).toContain(BLOCKED_IMAGE_LABEL)

    const hrefs = [...holder.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['#hostile-fixture'])
    expect(holder.textContent).toContain('remote link')
    expect(holder.textContent).toContain('javascript link')
    expect(holder.innerHTML).not.toMatch(/evil\.example|javascript:/i)
  })
})
