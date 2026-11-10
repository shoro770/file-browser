// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOW, makeSource } from '../testHelpers'
import type { PreviewPaneProps, PreviewState, TextContent } from '../types'
import PreviewPane from './PreviewPane'

const control = vi.hoisted(() => ({ reject: false }))

vi.mock('../services/markdown', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/markdown')>()
  return {
    renderMarkdown: (content: TextContent) =>
      control.reject ? Promise.reject(new Error('boom: secret detail')) : actual.renderMarkdown(content),
  }
})

const text = (value: string): TextContent => ({ text: value, truncated: false, totalSize: value.length })

const ready = (source: ReturnType<typeof makeSource>): PreviewState => ({ status: 'ready', id: source.meta.name, source })

/** Renders the pane and lets lazy chunks and renders settle. */
async function show(state: PreviewState, onAnnounce = vi.fn(), loading = false) {
  const props: PreviewPaneProps = { state, now: NOW, loading, onAnnounce, rootName: 'root' }
  let view!: ReturnType<typeof render>
  await act(async () => {
    view = render(<PreviewPane {...props} />)
  })
  return { ...view, props, onAnnounce, rerenderWith: (next: PreviewState) => act(async () => view.rerender(<PreviewPane {...props} state={next} />)) }
}

beforeEach(() => {
  control.reject = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('PreviewPane region', () => {
  it('is a focusable region named by the header h2 for a selected file', async () => {
    await show(ready(makeSource('a.ts', 'text', { text: text('x') })))
    const region = screen.getByRole('region', { name: 'a.ts' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveAttribute('aria-labelledby', 'preview-title')
    expect(screen.getByRole('heading', { level: 2, name: 'a.ts' })).toHaveAttribute('id', 'preview-title')
  })

  it('keeps a static label while the file is not ready', async () => {
    await show({ status: 'idle' })
    const region = screen.getByRole('region', { name: 'Preview' })
    expect(region).not.toHaveAttribute('aria-labelledby')
  })

  it('shows "Loading preview..." only while loading, announces it and is not a live region', async () => {
    const onAnnounce = vi.fn()
    const { rerender, props } = await show({ status: 'idle' }, onAnnounce, true)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Loading preview...')).toBeInTheDocument()
    expect(onAnnounce).toHaveBeenCalledWith('Loading preview...')
    await act(async () => rerender(<PreviewPane {...props} loading={false} />))
    expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument()
  })
})

describe('PreviewPane renderers and announcements', () => {
  it('shows text as a literal text node and does not announce a card', async () => {
    const { onAnnounce } = await show(ready(makeSource('a.txt', 'text', { text: text('<script>alert(1)</script>') })))
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
    expect(onAnnounce).not.toHaveBeenCalled()
  })

  it('shows an image with the file name as alt and does not announce a card', async () => {
    const { onAnnounce } = await show(ready(makeSource('p.png', 'image', { imageUrl: 'blob:x' })))
    const image = screen.getByRole('img', { name: 'p.png' })
    expect(image).toHaveAttribute('src', 'blob:x')
    expect(onAnnounce).not.toHaveBeenCalled()
  })

  it('shows Markdown formatted, lazily, and does not announce a card', async () => {
    const { onAnnounce } = await show(ready(makeSource('s.md', 'markdown', { text: text('# Spec\n\ntext') })))
    expect(await screen.findByRole('heading', { level: 1, name: 'Spec' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 's.md' })).toHaveAttribute('tabindex', '0')
    // Only the lazy chunk's loading fallback may speak; never card text.
    expect(onAnnounce.mock.calls.flat().filter((text) => text !== 'Loading preview...')).toEqual([])
  })

  it('announces a kind without a renderer as a card, once', async () => {
    const { onAnnounce } = await show(ready(makeSource('a.zip', 'metadata')))
    // Header h2 plus the card's own h2 (the duplicate predates this story).
    expect(screen.getAllByRole('heading', { level: 2, name: 'a.zip' })).toHaveLength(2)
    expect(onAnnounce).toHaveBeenCalledTimes(1)
    expect(onAnnounce).toHaveBeenCalledWith('a.zip: no preview available')
  })

  it('shows a name-only card and announces when the read failed', async () => {
    const { onAnnounce } = await show({ status: 'failed', id: 'gone.txt', name: 'gone.txt' })
    expect(screen.getByText("This file couldn't be previewed. It may be damaged or in an unexpected format.")).toBeInTheDocument()
    expect(onAnnounce).toHaveBeenCalledWith('gone.txt: no preview available')
    expect(screen.getByRole('region', { name: 'Preview' })).toHaveAttribute('tabindex', '0')
  })
})

describe('PreviewPane failures', () => {
  it('shows the card with the failure text when Markdown rendering rejects, and never the error', async () => {
    control.reject = true
    const { onAnnounce } = await show(ready(makeSource('s.md', 'markdown', { text: text('# Spec') })))
    expect(await screen.findByText(/This file couldn't be previewed/)).toBeInTheDocument()
    expect(screen.queryByText(/boom|secret detail/)).toBeNull()
    expect(screen.getAllByRole('heading', { level: 2, name: 's.md' }).length).toBeGreaterThan(0)
    const region = screen.getByRole('region', { name: 's.md' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveAttribute('aria-labelledby', 'preview-title')
    expect(onAnnounce).toHaveBeenCalledWith('s.md: no preview available')
    expect(onAnnounce.mock.calls.flat().filter((text) => text === 's.md: no preview available')).toHaveLength(1)
  })

  it('shows the card when an image cannot be decoded', async () => {
    const { onAnnounce } = await show(ready(makeSource('p.heic', 'image', { imageUrl: 'blob:x' })))
    await act(async () => {
      fireEvent.error(screen.getByRole('img', { name: 'p.heic' }))
    })
    expect(screen.getByText(/This file couldn't be previewed/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'p.heic' })).toBeNull()
    expect(onAnnounce).toHaveBeenCalledWith('p.heic: no preview available')
  })

  it('starts the next file healthy and ignores a late failure from the old source', async () => {
    const first = makeSource('p.heic', 'image', { imageUrl: 'blob:1' })
    const view = await show(ready(first))
    const staleImage = screen.getByRole('img', { name: 'p.heic' })
    await view.rerenderWith(ready(makeSource('b.txt', 'text', { text: text('fine') })))
    await act(async () => {
      fireEvent.error(staleImage)
    })
    expect(screen.getByText('fine')).toBeInTheDocument()
    expect(screen.queryByText(/This file couldn't be previewed/)).toBeNull()
  })

  it('retries when the same file is selected again (a new source object)', async () => {
    control.reject = true
    const view = await show(ready(makeSource('s.md', 'markdown', { text: text('# Spec') })))
    expect(await screen.findByText(/This file couldn't be previewed/)).toBeInTheDocument()
    control.reject = false
    await view.rerenderWith(ready(makeSource('s.md', 'markdown', { text: text('# Spec') })))
    expect(await screen.findByRole('heading', { level: 1, name: 'Spec' })).toBeInTheDocument()
    expect(screen.queryByText(/This file couldn't be previewed/)).toBeNull()
  })
})
