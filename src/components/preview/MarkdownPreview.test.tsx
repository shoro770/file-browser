// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, Suspense } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeSource } from '../../testHelpers'
import type { TextContent } from '../../types'
import MarkdownPreview from './MarkdownPreview'

/** A Markdown source with the given leading text. */
function source(text: string, truncated = false, totalSize = text.length) {
  const content: TextContent = { text, truncated, totalSize }
  return makeSource('spec.md', 'markdown', { text: content })
}

/** Renders the preview and waits for the first heading or the given role. */
async function show(text: string, truncated = false, totalSize?: number) {
  // The component suspends on first render, so the act must be awaited.
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <MarkdownPreview source={source(text, truncated, totalSize)} />
      </Suspense>,
    )
  })
  await screen.findByRole('heading', { level: 1 })
}

const originalScrollIntoView = Element.prototype.scrollIntoView
afterEach(() => {
  Element.prototype.scrollIntoView = originalScrollIntoView
  vi.restoreAllMocks()
})

describe('MarkdownPreview', () => {
  it('renders real headings, lists, tables and in-page links', async () => {
    await show('# Title\n\n- one\n- two\n\n| h |\n|---|\n| c |\n\n## Part\n\n[go](#part)')
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toHaveAttribute('id', 'md-title')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'go' })).toHaveAttribute('href', '#part')
  })

  it('leaves remote and unsafe links as plain text, not links', async () => {
    await show('# T\n\n[remote](https://example.com) [js](javascript:alert(1)) [rel](./a.md)')
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText(/remote.*js.*rel/)).toBeInTheDocument()
  })

  it('replaces a remote image with a placeholder named "Remote image blocked" and its caption', async () => {
    await show('# T\n\n![A chart](https://example.com/a.png)')
    expect(screen.getByRole('img', { name: 'Remote image blocked' })).toBeInTheDocument()
    expect(screen.getByText('A chart')).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  // jsdom runs no scripts and loads no images here, so this proves the DOM holds nothing that would run or load.
  it('leaves no script, handler, frame or inline style in the DOM for hostile HTML', async () => {
    await show('# T\n\n<script>alert(1)</script><img src=x onerror="alert(1)"><p style="color:red" onclick="alert(1)">p</p>')
    expect(document.querySelector('script, iframe, img, [style], [onclick], [onerror]')).toBeNull()
  })

  it('renders under StrictMode, which runs the append effect twice', async () => {
    await act(async () => {
      render(
        <StrictMode>
          <Suspense fallback={null}>
            <MarkdownPreview source={source('# Twice')} />
          </Suspense>
        </StrictMode>,
      )
    })
    expect(await screen.findAllByRole('heading', { level: 1, name: 'Twice' })).toHaveLength(1)
  })

  it('shows the truncation banner only for a cut file', async () => {
    await show('# T', true, 4_400_000)
    expect(screen.getByText(/Showing the first 1 MB of/)).toBeInTheDocument()
  })

  it('shows no banner for a whole file', async () => {
    await show('# T')
    expect(screen.queryByText(/Showing the first 1 MB/)).toBeNull()
  })

  it('keeps the page where it is when any link is clicked, and scrolls and focuses an in-page anchor', async () => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    await show('# T\n\n## Part\n\n[go](#part)')
    const before = window.location.href
    const click = fireEvent.click(screen.getByRole('link', { name: 'go' }))
    expect(click).toBe(false) // default prevented, so nothing navigates
    expect(window.location.href).toBe(before)
    expect(scrolled).toHaveBeenCalledTimes(1)
    expect(scrolled.mock.contexts[0]).toBe(screen.getByRole('heading', { name: 'Part' }))
    expect(screen.getByRole('heading', { name: 'Part' })).toHaveFocus()
  })

  it('does nothing when an anchor has no target', async () => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    await show('# T\n\n[gone](#missing)')
    fireEvent.click(screen.getByRole('link', { name: 'gone' }))
    expect(scrolled).not.toHaveBeenCalled()
  })

  it('rejects to the boundary when the source has no text', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const bare = makeSource('a.md', 'markdown')
    // `use()` throws the rejection on a later render, so assert the cached promise rejects instead.
    return import('../../hooks/useMarkdown').then(async ({ useMarkdown }) => {
      await expect(useMarkdown(bare)).rejects.toThrow()
      error.mockRestore()
    })
  })
})
