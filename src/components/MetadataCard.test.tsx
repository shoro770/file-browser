// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NOW, makeSource } from '../testHelpers'
import MetadataCard from './MetadataCard'
import PreviewHeader from './PreviewHeader'

const FAILED = "This file couldn't be previewed. It may be damaged or in an unexpected format."

describe('MetadataCard', () => {
  it('shows the name as an h2, a Size/Type/Last modified list and the kind explanation', () => {
    const meta = makeSource('a.zip', 'metadata').meta
    render(<MetadataCard meta={meta} name="a.zip" now={NOW} />)
    expect(screen.getByRole('heading', { level: 2, name: 'a.zip' })).toBeInTheDocument()
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Size', 'Type', 'Last modified'])
    expect(screen.getByText('Archive')).toBeInTheDocument()
    expect(screen.getByText('Yesterday at 11:04 AM')).toHaveAttribute('datetime')
    expect(screen.getByText('No preview is available for this type of file.')).toBeInTheDocument()
  })

  it('gives the empty-file and legacy .doc sentences', () => {
    const empty = { ...makeSource('e.txt', 'metadata').meta, size: 0 }
    const { unmount } = render(<MetadataCard meta={empty} name="e.txt" now={NOW} />)
    expect(screen.getByText('This file is empty.')).toBeInTheDocument()
    unmount()
    render(<MetadataCard meta={makeSource('old.doc', 'metadata').meta} name="old.doc" now={NOW} />)
    expect(screen.getByText("Legacy .doc files can't be previewed. Only .docx is supported.")).toBeInTheDocument()
  })

  it('gives the failure sentence for a failed render, beneath the list', () => {
    render(<MetadataCard meta={makeSource('p.heic', 'image').meta} name="p.heic" now={NOW} failed />)
    expect(screen.getByText(FAILED)).toBeInTheDocument()
    expect(screen.getByText('Size')).toBeInTheDocument()
  })

  it('shows the name and failure text only when the file could not be read', () => {
    render(<MetadataCard meta={null} name="gone.txt" now={NOW} />)
    expect(screen.getByRole('heading', { level: 2, name: 'gone.txt' })).toBeInTheDocument()
    expect(screen.getByText(FAILED)).toBeInTheDocument()
    expect(screen.queryByRole('term')).toBeNull()
  })
})

describe('PreviewHeader', () => {
  it('names the region with an h2 and stamps the modified time in a <time>', () => {
    const source = makeSource('a.md', 'markdown')
    render(
      <PreviewHeader meta={source.meta} titleId="t" now={NOW} id="a.md" rootName="root" file={source.file} onAnnounce={vi.fn()} />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'a.md' })).toHaveAttribute('id', 't')
    const stamp = screen.getByText('Yesterday at 11:04 AM')
    expect(stamp.tagName).toBe('TIME')
    expect(stamp).toHaveAttribute('datetime')
  })
})
