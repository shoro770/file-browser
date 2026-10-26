// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, Suspense } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PNG_BYTES, docxFile, link, makeDocx, paragraph, picture } from '../../testDocx'
import type { DocxParts } from '../../testDocx'
import { makeSource } from '../../testHelpers'
import DocxPreview from './DocxPreview'

/** The first docx render loads the converter chunk, which can be slow on a busy machine. */
const SLOW = { timeout: 10000 }
vi.setConfig({ testTimeout: 15000 })

const TABLE = '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>cell</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'

/** Renders a built document and waits for its first heading. */
async function show(parts: DocxParts, strict = false) {
  const source = makeSource('a.docx', 'docx', { file: docxFile(await makeDocx(parts)) })
  const tree = (
    <Suspense fallback={null}>
      <DocxPreview source={source} />
    </Suspense>
  )
  await act(async () => {
    render(strict ? <StrictMode>{tree}</StrictMode> : tree)
  })
  await screen.findByRole('heading', { level: 1 }, SLOW)
}

const originalScrollIntoView = Element.prototype.scrollIntoView
afterEach(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView
  vi.restoreAllMocks()
})

describe('DocxPreview', () => {
  it('renders headings, a list and a table with their roles', async () => {
    await show({
      body: paragraph('Title', { style: 'Heading1' }) + paragraph('one', { bullet: true }) + paragraph('two', { bullet: true }) + TABLE,
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toHaveAttribute('id', 'md-title')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('shows a raster image and names a blocked one "Remote image blocked", with no style attribute anywhere', async () => {
    await show({
      body: paragraph('T', { style: 'Heading1' }) + picture('rId1', 'a dot') + picture('rId2', 'far away', true),
      rels: [
        { id: 'rId1', type: 'image', target: 'media/a.png' },
        { id: 'rId2', type: 'image', target: 'https://example.com/a.png', external: true },
      ],
      media: { 'media/a.png': PNG_BYTES },
    })
    expect(screen.getByRole('img', { name: 'a dot' })).toHaveAttribute('src', expect.stringMatching(/^data:image\/png/))
    expect(screen.getByRole('img', { name: 'Remote image blocked' })).toBeInTheDocument()
    expect(document.querySelector('[style]')).toBeNull()
  })

  it('leaves remote links as plain text, so no link is a tab stop', async () => {
    await show({
      body: paragraph('T', { style: 'Heading1' }) + link('site', 'rId1'),
      rels: [{ id: 'rId1', type: 'hyperlink', target: 'https://example.com', external: true }],
    })
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('site')).toBeInTheDocument()
  })

  it('keeps a bookmark link to a heading in the page: focuses and scrolls to it without changing the URL', async () => {
    await show({ body: paragraph('Intro', { style: 'Heading1' }) + link('go', 'anchor:Intro') })
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    const before = window.location.href
    fireEvent.click(screen.getByRole('link', { name: 'go' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Intro' })).toHaveFocus()
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe(before)
  })

  it('does not scroll or navigate on a click inside the content', async () => {
    await show({ body: paragraph('T', { style: 'Heading1' }) })
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    fireEvent.click(screen.getByRole('heading', { level: 1 }))
    expect(scroll).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
  })

  it('survives a repeated effect run under StrictMode', async () => {
    await show({ body: paragraph('Twice', { style: 'Heading1' }) }, true)
    expect(screen.getAllByRole('heading', { level: 1, name: 'Twice' })).toHaveLength(1)
  })
})
