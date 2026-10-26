// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { PNG_BYTES, docxFile, link, makeDocx, paragraph, picture } from '../testDocx'
import type { DocxParts } from '../testDocx'
import { renderDocx } from './docx'

/** Renders a built document and returns a live container for querying. */
async function render(parts: DocxParts, signal = new AbortController().signal) {
  const fragment = await renderDocx(docxFile(await makeDocx(parts)), signal)
  const holder = document.createElement('div')
  holder.append(fragment)
  return holder
}

const TABLE = '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>cell</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'

describe('renderDocx', () => {
  it('renders headings, bold, italic, lists, tables and links', async () => {
    const out = await render({
      body: [
        paragraph('Title', { style: 'Heading1' }),
        paragraph('strong', { bold: true }),
        paragraph('slanted', { italic: true }),
        paragraph('one', { bullet: true }),
        paragraph('two', { bullet: true }),
        TABLE,
        link('site', 'rId9'),
        link('top', 'anchor:_Toc1'),
      ].join(''),
      rels: [{ id: 'rId9', type: 'hyperlink', target: 'https://example.com', external: true }],
    })
    expect(out.querySelector('h1')?.textContent).toBe('Title')
    expect(out.querySelector('strong')?.textContent).toBe('strong')
    expect(out.querySelector('em')?.textContent).toBe('slanted')
    expect(out.querySelectorAll('ul > li')).toHaveLength(2)
    expect(out.querySelector('table td')?.textContent).toBe('cell')
  })

  it('gives headings prefixed ids and keeps a bookmark link whose name matches a heading', async () => {
    const out = await render({
      body: paragraph('Intro', { style: 'Heading1' }) + paragraph('Intro', { style: 'Heading2' }) + link('go', 'anchor:Intro'),
    })
    expect([...out.querySelectorAll('h1, h2')].map((h) => h.id)).toEqual(['md-intro', 'md-intro-1'])
    expect(out.querySelector('h1')?.getAttribute('tabindex')).toBe('-1')
    const links = out.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('#Intro')
  })

  it('makes a bookmark link plain text when no heading matches (Word tables of contents use _Toc names)', async () => {
    const out = await render({
      body: paragraph('Intro', { style: 'Heading1' }) + link('toc entry', 'anchor:_Toc123'),
    })
    expect(out.querySelector('a')).toBeNull()
    expect(out.textContent).toContain('toc entry')
  })

  it('turns remote links and links with no target into plain text', async () => {
    const out = await render({
      body: [link('remote', 'rId1'), link('script', 'rId2'), link('missing', 'anchor:nowhere')].join(''),
      rels: [
        { id: 'rId1', type: 'hyperlink', target: 'https://example.com', external: true },
        { id: 'rId2', type: 'hyperlink', target: 'javascript:alert(1)', external: true },
      ],
    })
    expect(out.querySelector('a')).toBeNull()
    expect(out.textContent).toContain('remote')
    expect(out.textContent).toContain('script')
    expect(out.textContent).toContain('missing')
  })

  it('shows an embedded raster image from an in-document data URL', async () => {
    const out = await render({
      body: picture('rId5', 'a dot'),
      rels: [{ id: 'rId5', type: 'image', target: 'media/a.png' }],
      media: { 'media/a.png': PNG_BYTES },
    })
    const image = out.querySelector('img')
    expect(image?.getAttribute('src')).toMatch(/^data:image\/png;base64,/)
    expect(image?.getAttribute('alt')).toBe('a dot')
    expect(out.querySelector('.blocked-resource')).toBeNull()
  })

  it('replaces linked and non-raster images with the blocked placeholder', async () => {
    const out = await render({
      body: picture('rId1', 'remote pic', true) + picture('rId2', 'vector'),
      rels: [
        { id: 'rId1', type: 'image', target: 'https://example.com/a.png', external: true },
        { id: 'rId2', type: 'image', target: 'media/a.svg' },
      ],
      media: { 'media/a.svg': new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') },
    })
    expect(out.querySelector('img')).toBeNull()
    const placeholders = out.querySelectorAll('[aria-label="Remote image blocked"]')
    expect(placeholders).toHaveLength(2)
    expect(out.textContent).toContain('remote pic')
    expect(out.querySelector('script')).toBeNull()
    expect(out.innerHTML).not.toContain('example.com')
  })

  it('leaves script-like text as literal text and nothing executable behind', async () => {
    const out = await render({
      body: paragraph('<script>alert(1)</script><img src=x onerror=alert(1)>') + link('x', 'rId1'),
      rels: [{ id: 'rId1', type: 'hyperlink', target: 'javascript:alert(1)', external: true }],
    })
    expect(out.textContent).toContain('<script>alert(1)</script>')
    expect(out.querySelector('script, img, iframe, object, embed, form')).toBeNull()
    for (const element of out.querySelectorAll('*')) {
      expect(element.hasAttribute('style')).toBe(false)
      expect([...element.attributes].some((attribute) => attribute.name.startsWith('on'))).toBe(false)
      expect(element.getAttribute('href') ?? '#').toMatch(/^#/)
    }
  })

  it('rejects a file that is not a zip, a damaged zip and an empty file', async () => {
    const signal = new AbortController().signal
    await expect(renderDocx(docxFile('not a zip'), signal)).rejects.toThrow()
    const good = await makeDocx({ body: paragraph('x') })
    await expect(renderDocx(docxFile(good.slice(0, 40)), signal)).rejects.toThrow()
    await expect(renderDocx(docxFile(''), signal)).rejects.toThrow()
  })

  it('rejects a zip that holds no Word document', async () => {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    zip.file('readme.txt', 'hello')
    const bytes = await zip.generateAsync({ type: 'arraybuffer' })
    await expect(renderDocx(docxFile(bytes), new AbortController().signal)).rejects.toThrow()
  })

  it('rejects when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(render({ body: paragraph('x') }, controller.signal)).rejects.toThrow()
  })
})
