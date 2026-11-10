// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOW, makeSource } from '../testHelpers'
import type { PreviewPaneProps, PreviewState, TextContent } from '../types'
import PreviewPane from './PreviewPane'

const ready = (source: ReturnType<typeof makeSource>): PreviewState => ({ status: 'ready', id: source.meta.name, source })
const pdf = (name: string, url = 'blob:fake/1') => ready(makeSource(name, 'pdf', { pdfUrl: url }))
const text = (value: string): TextContent => ({ text: value, truncated: false, totalSize: value.length })

/** Renders the pane and lets the lazy chunk settle. */
async function show(state: PreviewState, onAnnounce = vi.fn(), strict = false) {
  const element = (next: PreviewState) => {
    const props: PreviewPaneProps = { state: next, now: NOW, loading: false, onAnnounce, rootName: 'root' }
    return strict ? (
      <StrictMode>
        <PreviewPane {...props} />
      </StrictMode>
    ) : (
      <PreviewPane {...props} />
    )
  }
  let view!: ReturnType<typeof render>
  await act(async () => {
    view = render(element(state))
  })
  return { onAnnounce, rerenderWith: (next: PreviewState) => act(async () => view.rerender(element(next))) }
}

/** The embed once the lazy chunk has loaded; `<object>` has no ARIA role, and the header title repeats the name. */
async function embed(): Promise<HTMLObjectElement> {
  return waitFor(() => {
    const object = document.querySelector('object')
    if (!object) throw new Error('no embed yet')
    return object
  })
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('PreviewPane PDFs', () => {
  it('embeds a PDF under its header in a named, focusable region, and announces no card', async () => {
    const { onAnnounce } = await show(pdf('report.pdf'))
    const object = await embed()
    expect(object).toHaveAttribute('title', 'report.pdf')
    expect(object).toHaveAttribute('type', 'application/pdf')
    expect(object).toHaveAttribute('data', 'blob:fake/1')
    const region = screen.getByRole('region', { name: 'report.pdf' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveAttribute('aria-labelledby', 'preview-title')
    expect(region).toContainElement(object)
    expect(screen.queryByText(/This file couldn't be previewed/)).toBeNull()
    expect(onAnnounce.mock.calls.flat().filter((text) => text !== 'Loading preview...')).toEqual([])
  })

  it('works under StrictMode', async () => {
    await show(pdf('report.pdf'), vi.fn(), true)
    expect(await embed()).toBeInTheDocument()
  })

  it('shows the failure card and announces it when the embed errors', async () => {
    const { onAnnounce } = await show(pdf('bad.pdf'))
    const object = await embed()
    await act(async () => {
      fireEvent.error(object)
    })
    expect(screen.getByText(/This file couldn't be previewed/)).toBeInTheDocument()
    expect(document.querySelector('object')).toBeNull()
    expect(onAnnounce).toHaveBeenCalledWith('bad.pdf: no preview available')
  })

  it('retries when the same PDF is selected again (a new source object)', async () => {
    const view = await show(pdf('bad.pdf'))
    const object = await embed()
    await act(async () => {
      fireEvent.error(object)
    })
    expect(screen.getByText(/This file couldn't be previewed/)).toBeInTheDocument()
    await view.rerenderWith(pdf('bad.pdf', 'blob:fake/2'))
    expect(await embed()).toHaveAttribute('data', 'blob:fake/2')
    expect(screen.queryByText(/This file couldn't be previewed/)).toBeNull()
  })

  it('ignores a late error from an old PDF once another file is selected', async () => {
    const view = await show(pdf('a.pdf'))
    const stale = await embed()
    await view.rerenderWith(ready(makeSource('b.txt', 'text', { text: text('fine') })))
    await act(async () => {
      fireEvent.error(stale)
    })
    expect(screen.getByText('fine')).toBeInTheDocument()
    expect(screen.queryByText(/This file couldn't be previewed/)).toBeNull()
  })

  it('shows the card and announces it for a PDF the session gave no URL (zero bytes)', async () => {
    const base = makeSource('e.pdf', 'metadata')
    const empty = ready({ ...base, file: new File([], 'e.pdf'), meta: { ...base.meta, size: 0 } })
    const { onAnnounce } = await show(empty)
    expect(document.querySelector('object')).toBeNull()
    expect(screen.getByText('This file is empty.')).toBeInTheDocument()
    expect(onAnnounce).toHaveBeenCalledWith('e.pdf: no preview available')
  })
})
