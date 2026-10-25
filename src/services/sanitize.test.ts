// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BLOCKED_IMAGE_LABEL, sanitize } from './sanitize'

/** Serializes a fragment for assertions. */
function html(fragment: DocumentFragment): string {
  const holder = document.createElement('div')
  holder.append(fragment)
  return holder.innerHTML
}

/** Every element in a fragment. */
const elements = (fragment: DocumentFragment) => [...fragment.querySelectorAll('*')]

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('sanitize: hostile input', () => {
  it('removes scripts', () => {
    const out = sanitize('<p>a</p><script>alert(1)</script><SCRIPT src="//e.com/x.js"></SCRIPT>')
    expect(html(out)).toBe('<p>a</p>')
  })

  it('removes event-handler attributes', () => {
    const out = sanitize('<p onclick="x()" onmouseover=x>hi</p><a href="#a" onfocus="x()">l</a>')
    for (const el of elements(out)) expect(el.getAttributeNames().filter((n) => n.startsWith('on'))).toEqual([])
    expect(out.querySelector('p')?.textContent).toBe('hi')
  })

  it('removes style attributes and style elements', () => {
    const out = sanitize('<p style="background:url(//e.com/x)">a</p><style>p{background:url(//e.com)}</style>')
    expect(html(out)).toBe('<p>a</p>')
  })

  it.each(['iframe', 'object', 'embed', 'form', 'svg', 'math', 'link', 'meta', 'base', 'video', 'audio', 'button', 'textarea', 'select'])(
    'removes <%s>',
    (tag) => {
      const out = sanitize(`<${tag} src="https://e.com/x" action="https://e.com" data="https://e.com"><p>keep</p></${tag}>`)
      expect(out.querySelector(tag)).toBeNull()
    },
  )

  it('removes id, class, name and data attributes (no DOM clobbering)', () => {
    const out = sanitize('<p id="root" class="x" name="body" data-x="1" aria-label="y">a</p><img name="cookie" id="x">')
    for (const el of elements(out)) {
      expect(el.hasAttribute('id') || el.hasAttribute('name') || el.hasAttribute('data-x')).toBe(false)
    }
    expect(out.querySelector('p')?.getAttributeNames()).toEqual([])
  })

  it('handles nested, malformed and mutation-prone markup without leaving script', () => {
    const corpus = [
      '<scr<script>ipt>alert(1)</scr</script>ipt>',
      '<img src=x onerror=alert(1)//',
      '<svg><script>alert(1)</script></svg>',
      '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
      '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
      '<a href="javascript:alert(1)"><b>x</b></a>',
      '<table><form><input></form></table>',
    ]
    for (const input of corpus) {
      const out = html(sanitize(input))
      expect(out).not.toMatch(/<script|onerror|javascript:|<svg|<math|<form/i)
    }
  })
})

describe('sanitize: images', () => {
  it('replaces a remote image with the named placeholder and its caption', () => {
    const out = sanitize('<p><img src="https://example.com/a.png" alt="A chart"></p>')
    expect(out.querySelector('img')).toBeNull()
    const placeholder = out.querySelector('[role="img"]')
    expect(placeholder?.getAttribute('aria-label')).toBe(BLOCKED_IMAGE_LABEL)
    expect(placeholder?.textContent).toContain('Remote image blocked')
    expect(placeholder?.querySelector('.blocked-resource__caption')?.textContent).toBe('A chart')
    expect(placeholder?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('shows no caption without alt text', () => {
    const out = sanitize('<img src="https://example.com/a.png">')
    expect(out.querySelector('.blocked-resource__caption')).toBeNull()
  })

  it.each(['./a.png', '/a.png', '//e.com/a.png', 'data:image/png;base64,AAAA', 'javascript:alert(1)', 'blob:x', 'file:///etc/passwd'])(
    'replaces an image sourced from %s',
    (src) => {
      const out = sanitize(`<img src="${src}" alt="x">`)
      expect(out.querySelector('img')).toBeNull()
      expect(out.querySelector('.blocked-resource')).not.toBeNull()
    },
  )

  it('keeps an inline raster data image only when allowed, and never other sources', () => {
    const data = 'data:image/png;base64,iVBORw0KGgo='
    const kept = sanitize(`<img src="${data}" alt="x"><img src="https://e.com/a.png"><img src="data:image/svg+xml;base64,AAAA">`, {
      allowDataImages: true,
    })
    const images = [...kept.querySelectorAll('img')]
    expect(images.map((img) => img.getAttribute('src'))).toEqual([data])
    expect(kept.querySelectorAll('.blocked-resource')).toHaveLength(2)
  })

  // jsdom loads no subresources by default, so this guards only the sanitizer's own code path;
  // the proof that no remote element survives is the DOM-shape assertions above. The real
  // zero-request proof is the browser network-panel check (Story 3.4).
  it('does not call fetch or XHR itself', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const xhr = vi.spyOn(XMLHttpRequest.prototype, 'open')
    sanitize('<img src="https://e.com/a.png"><script src="https://e.com/x.js"></script><link rel="stylesheet" href="https://e.com/x.css">')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(xhr).not.toHaveBeenCalled()
  })
})

describe('sanitize: links', () => {
  it('keeps in-page anchors', () => {
    const out = sanitize('<a href="#intro">go</a>')
    expect(out.querySelector('a')?.getAttribute('href')).toBe('#intro')
  })

  it.each([
    'https://example.com',
    'http://example.com',
    './other.md',
    '/abs',
    '//e.com',
    'mailto:a@b.c',
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
  ])('turns a link to %j into plain text', (href) => {
    const out = sanitize(`<p>see <a href="${href}">the <b>text</b></a> now</p>`)
    expect(out.querySelector('a')).toBeNull()
    expect(out.querySelector('p')?.textContent).toBe('see the text now')
    expect(out.querySelector('p b')?.textContent).toBe('text')
  })

  it('turns an anchor without href into plain text', () => {
    expect(sanitize('<a>x</a>').querySelector('a')).toBeNull()
  })
})

describe('sanitize: structure that stays', () => {
  it('keeps headings, lists, tables, code, emphasis and blockquotes', () => {
    const out = sanitize(
      '<h1>T</h1><ul><li>a</li></ul><table><thead><tr><th align="center">h</th></tr></thead><tbody><tr><td colspan="2">c</td></tr></tbody></table><pre><code class="language-js">x</code></pre><p><em>e</em><strong>s</strong><del>d</del></p><blockquote><p>q</p></blockquote>',
    )
    for (const tag of ['h1', 'ul', 'li', 'table', 'th', 'td', 'pre > code', 'em', 'strong', 'del', 'blockquote']) {
      expect(out.querySelector(tag)).not.toBeNull()
    }
    expect(out.querySelector('code')?.hasAttribute('class')).toBe(false)
    expect(out.querySelector('td')?.getAttribute('colspan')).toBe('2')
  })

  it('reduces a checkbox to a disabled checkbox and nothing else', () => {
    const out = sanitize('<input type="text" name="x" value="v" onfocus="x()" checked autofocus formaction="//e.com">')
    const input = out.querySelector('input')
    expect(input?.getAttributeNames().sort()).toEqual(['checked', 'disabled', 'type'])
    expect(input?.getAttribute('type')).toBe('checkbox')
  })

  it('returns an empty fragment for empty input', () => {
    expect(sanitize('').childNodes).toHaveLength(0)
  })
})
