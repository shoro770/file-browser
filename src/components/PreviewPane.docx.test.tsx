// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOW, makeSource } from '../testHelpers'
import { docxFile, makeDocx, paragraph } from '../testDocx'
import type { PreviewState } from '../types'
import PreviewPane from './PreviewPane'

/** The first docx render loads the converter chunk, which can be slow on a busy machine. */
const SLOW = { timeout: 10000 }
vi.setConfig({ testTimeout: 15000 })

/** A ready docx state whose file holds the given bytes. */
async function docxState(name: string, body: string | null): Promise<PreviewState> {
  const bytes = body === null ? 'not a zip' : await makeDocx({ body })
  const source = makeSource(name, 'docx', { file: docxFile(bytes, name) })
  return { status: 'ready', id: name, source }
}

/** Renders the pane and lets the lazy chunk and conversion settle. */
async function show(state: PreviewState, onAnnounce = vi.fn()) {
  let view!: ReturnType<typeof render>
  const element = (next: PreviewState) => <PreviewPane state={next} now={NOW} loading={false} onAnnounce={onAnnounce} />
  await act(async () => {
    view = render(element(state))
  })
  return { onAnnounce, rerenderWith: (next: PreviewState) => act(async () => view.rerender(element(next))) }
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('PreviewPane Word documents', () => {
  it('shows a docx formatted, in a named focusable region, and announces no card', async () => {
    const { onAnnounce } = await show(await docxState('summary.docx', paragraph('Summary', { style: 'Heading1' }) + paragraph('body')))
    expect(await screen.findByRole('heading', { level: 1, name: 'Summary' }, SLOW)).toBeInTheDocument()
    const region = screen.getByRole('region', { name: 'summary.docx' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveAttribute('aria-labelledby', 'preview-title')
    expect(onAnnounce.mock.calls.flat().filter((text) => text !== 'Loading preview...')).toEqual([])
  })

  it('shows the card with the failure text for a damaged docx, never the error, and announces it once', async () => {
    const { onAnnounce } = await show(await docxState('broken.docx', null))
    expect(await screen.findByText(/This file couldn't be previewed/, {}, SLOW)).toBeInTheDocument()
    expect(screen.queryByText(/zip|Could not find|corrupt/i)).toBeNull()
    expect(screen.getByRole('region', { name: 'broken.docx' })).toHaveAttribute('tabindex', '0')
    expect(onAnnounce).toHaveBeenCalledWith('broken.docx: no preview available')
    expect(onAnnounce.mock.calls.flat().filter((text) => text !== 'Loading preview...')).toHaveLength(1)
  })

  it('retries when the same file is selected again (a new source object)', async () => {
    const view = await show(await docxState('a.docx', null))
    expect(await screen.findByText(/This file couldn't be previewed/, {}, SLOW)).toBeInTheDocument()
    await view.rerenderWith(await docxState('a.docx', paragraph('Fixed', { style: 'Heading1' })))
    expect(await screen.findByRole('heading', { level: 1, name: 'Fixed' }, SLOW)).toBeInTheDocument()
    expect(screen.queryByText(/This file couldn't be previewed/)).toBeNull()
  })

  it('shows the newer selection when another file replaces a docx', async () => {
    const view = await show(await docxState('a.docx', paragraph('First', { style: 'Heading1' })))
    await view.rerenderWith({
      status: 'ready',
      id: 'b.txt',
      source: makeSource('b.txt', 'text', { text: { text: 'second', truncated: false, totalSize: 6 } }),
    })
    expect(screen.getByText('second')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'First' })).toBeNull()
  })

  it('keeps legacy .doc on the Metadata Card with its explanation', async () => {
    const source = makeSource('old.doc', 'metadata', { file: new File(['x'], 'old.doc') })
    const { onAnnounce } = await show({ status: 'ready', id: 'old.doc', source })
    expect(screen.getByText("Legacy .doc files can't be previewed. Only .docx is supported.")).toBeInTheDocument()
    expect(onAnnounce).toHaveBeenCalledWith('old.doc: no preview available')
  })
})
