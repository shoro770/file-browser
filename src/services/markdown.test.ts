// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

/** Renders Markdown and returns a live container for querying. */
async function render(text: string, truncated = false) {
  const fragment = await renderMarkdown({ text, truncated, totalSize: text.length })
  const holder = document.createElement('div')
  holder.append(fragment)
  return holder
}

describe('renderMarkdown', () => {
  it('renders headings, lists, tables, code and links', async () => {
    const out = await render('# Title\n\n- a\n- b\n\n| h |\n|---|\n| c |\n\n```js\nlet x\n```\n\n[in](#title) and **bold**')
    expect(out.querySelector('h1')?.textContent).toBe('Title')
    expect(out.querySelectorAll('li')).toHaveLength(2)
    expect(out.querySelector('table th')?.textContent).toBe('h')
    expect(out.querySelector('pre code')?.textContent).toContain('let x')
    expect(out.querySelector('a')?.getAttribute('href')).toBe('#title')
    expect(out.querySelector('strong')?.textContent).toBe('bold')
  })

  it('gives headings prefixed, de-duplicated ids', async () => {
    const out = await render('# Intro\n\n## Intro\n\n## root')
    expect([...out.querySelectorAll('h1, h2')].map((h) => h.id)).toEqual(['md-intro', 'md-intro-1', 'md-root'])
  })

  it('makes headings focusable by script only, and ignores the blocked-image label in ids', async () => {
    const out = await render('# ![Logo](https://e.com/l.png) Title')
    const heading = out.querySelector('h1')
    expect(heading?.getAttribute('tabindex')).toBe('-1')
    expect(heading?.id).toBe('md-logo-title')
  })

  it('neutralises hostile raw HTML and remote resources', async () => {
    const out = await render(
      [
        '<script>alert(1)</script>',
        '<img src="x" onerror="alert(1)">',
        '<a href="javascript:alert(1)">js</a>',
        '<p style="x">styled</p>',
        '![cap](https://example.com/a.png)',
        '[remote](https://example.com)',
        '<iframe src="https://example.com"></iframe>',
      ].join('\n\n'),
    )
    expect(out.querySelector('script, iframe, a, img')).toBeNull()
    expect(out.querySelector('[style]')).toBeNull()
    expect(out.querySelectorAll('[role="img"]')).toHaveLength(2)
    expect(out.textContent).toContain('remote')
    expect(out.textContent).toContain('cap')
  })

  it('cuts a truncated file at its last whole line, so a half-open fence is not rendered', async () => {
    const out = await render('intro\n\n```js\nlet a = 1\n```\n\n<img src="https://e.com/a.png" on', true)
    expect(out.textContent).not.toContain('on')
    expect(out.querySelector('pre')).not.toBeNull()
  })

  it('does not throw on an unclosed construct', async () => {
    const out = await render('| a | b\n|---\n```\nopen fence\n[unclosed](http://x')
    expect(out.textContent).toContain('open fence')
  })

  it('renders task-list checkboxes as disabled', async () => {
    const out = await render('- [x] done\n- [ ] todo')
    const boxes = [...out.querySelectorAll('input')]
    expect(boxes).toHaveLength(2)
    expect(boxes.every((box) => box.disabled && box.type === 'checkbox')).toBe(true)
  })
})
