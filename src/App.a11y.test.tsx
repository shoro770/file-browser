// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import './testHelpers'

type Entry = { name: string; kind: 'file' | 'directory' }

const entries: Entry[] = [
  { name: '.env', kind: 'file' },
  { name: 'a.txt', kind: 'file' },
  { name: 'b.zip', kind: 'file' },
]
let pickerFails = false
const root = {
  name: 'proj',
  kind: 'directory',
  values: async function* () {
    yield* entries
  },
  getFileHandle: async (name: string) => ({ getFile: async () => new File(['hi'], name) }),
}

/** Frames run at once, unless a test holds them to see the cleared region in between. */
let held: FrameRequestCallback[] | null = null
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
  if (held) held.push(callback)
  else callback(0)
  return 0
})
Object.assign(window, {
  showDirectoryPicker: async () => {
    if (pickerFails) throw new DOMException('no', 'NotAllowedError')
    return root
  },
})
// jsdom lacks constructable stylesheets, which `usePaneWidth` uses for the tree width.
Object.defineProperty(document, 'adoptedStyleSheets', { value: [], writable: true })
vi.stubGlobal('CSSStyleSheet', class { replaceSync() {} })

const statuses = () => document.querySelectorAll('[role="status"]')
const status = () => document.querySelector<HTMLElement>('.visually-hidden[role="status"]')!

async function openFolder() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
  await screen.findByRole('tree', { name: 'File tree' })
  await waitFor(() => expect(status()).toHaveTextContent('Opened proj'))
}

const row = (name: RegExp) => screen.findByRole('treeitem', { name })

beforeEach(() => {
  held = null
  pickerFails = false
  document.title = ''
})

describe('page structure (UX-DR26)', () => {
  it('has a banner toolbar, a main pane, a hidden h1 and a title that names the folder', async () => {
    render(<App folderPickerSupported />)
    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('radiogroup', { name: 'Theme' }))
    expect(screen.getAllByRole('main')).toHaveLength(1)
    const h1 = screen.getByRole('heading', { level: 1, name: 'file-browser' })
    expect(h1).toHaveClass('visually-hidden')
    await waitFor(() => expect(document.title).toBe('file-browser'))
    await openFolder()
    expect(document.title).toBe('proj - file-browser')
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('names the Preview Header and the Metadata Card with h2 headings', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.keyDown(await row(/a\.txt/), { key: 'Enter' })
    expect(await screen.findByRole('heading', { level: 2, name: 'a.txt' })).toBeInTheDocument()
    fireEvent.keyDown(await row(/b\.zip/), { key: 'Enter' })
    const card = await screen.findByRole('region', { name: 'File details' })
    expect(within(card).getByRole('heading', { level: 2, name: 'b.zip' })).toBeInTheDocument()
  })

  it('shows the unsupported-browser screen as one main with an h1 and nothing else', () => {
    render(<App folderPickerSupported={false} />)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: "This browser can't open folders." })).toBeInTheDocument()
    expect(screen.queryByRole('banner')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('live region (UX-DR22)', () => {
  it('keeps exactly one visually hidden status region through every announcement', async () => {
    render(<App folderPickerSupported />)
    expect(statuses()).toHaveLength(1)
    expect(status()).toHaveClass('visually-hidden')
    await openFolder()
    expect(statuses()).toHaveLength(1)

    fireEvent.keyDown(await row(/a\.txt/), { key: 'Enter' })
    await waitFor(() => expect(status()).toHaveTextContent('Previewing a.txt'))
    expect(statuses()).toHaveLength(1)

    fireEvent.keyDown(await row(/b\.zip/), { key: 'Enter' })
    await waitFor(() => expect(status()).toHaveTextContent('b.zip: no preview available'))
    expect(statuses()).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
    expect(statuses()).toHaveLength(1)
  })

  it('announces on activation only, never on an arrow-key move', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    const first = await row(/\.env/)
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    fireEvent.keyDown(await row(/a\.txt/), { key: 'ArrowDown' })
    expect(status()).toHaveTextContent('Opened proj')
  })

  it('announces "Selection cleared" when hiding the selected dotfile', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.keyDown(await row(/\.env/), { key: 'Enter' })
    await waitFor(() => expect(status()).toHaveTextContent('Previewing .env'))
    fireEvent.click(screen.getByRole('button', { name: 'Hidden files' }))
    expect(status()).toHaveTextContent('Selection cleared')
  })

  it('announces a refused folder in the status region and in a role="alert"', async () => {
    pickerFails = true
    render(<App folderPickerSupported />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
    const message = "Access to that folder wasn't granted. Choose a folder to try again."
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(statuses()).toHaveLength(1)
  })

  it('clears the region before it repeats an identical string, so it is read again', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    const refresh = screen.getByRole('button', { name: 'Refresh' })
    fireEvent.click(refresh)
    await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
    held = []
    fireEvent.click(refresh)
    await waitFor(() => expect(status()).toBeEmptyDOMElement())
    expect(held.length).toBeGreaterThan(0)
    const frames = held
    held = null
    await act(async () => frames.forEach((frame) => frame(0)))
    await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
  })
})

describe('keyboard and tree semantics (FR8, NFR8)', () => {
  it('exposes role, name, level, selected state and one tab stop on the rows', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    const rows = await screen.findAllByRole('treeitem')
    expect(rows.filter((item) => item.getAttribute('tabindex') === '0')).toHaveLength(1)
    const file = await row(/a\.txt/)
    expect(file).toHaveAttribute('aria-level', '1')
    expect(file).toHaveAttribute('aria-selected', 'false')
    fireEvent.keyDown(file, { key: ' ' })
    await waitFor(() => expect(file).toHaveAttribute('aria-selected', 'true'))
    expect(await screen.findByRole('region', { name: 'a.txt' })).toHaveAttribute('tabindex', '0')
  })
})
