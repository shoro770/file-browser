// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import './testHelpers'

type Entry = { name: string; kind: 'file' | 'directory' }

const getFile = vi.fn(async () => new File(['hi'], 'a.txt'))
let gate: Promise<void> = Promise.resolve()

/** A fake folder handle listing whatever `entries()` returns when it is read. */
function fakeDir(name: string, entries: () => Entry[], children: Record<string, unknown> = {}) {
  return {
    name,
    kind: 'directory',
    values: async function* () {
      await gate
      yield* entries()
    },
    getDirectoryHandle: async (child: string) => children[child],
    getFileHandle: async () => ({ getFile }),
  }
}

const dEntries: Entry[] = [{ name: 'x', kind: 'file' }]
const rootEntries: Entry[] = [
  { name: 'd', kind: 'directory' },
  { name: 'a.txt', kind: 'file' },
]
let rootFails = false
const root = fakeDir(
  'proj',
  () => {
    if (rootFails) throw new Error('unreadable')
    return rootEntries
  },
  { d: fakeDir('d', () => dEntries) },
)

/** Frames run at once, unless a test holds them to see the cleared region in between. */
let held: FrameRequestCallback[] | null = null
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
  if (held) held.push(callback)
  else callback(0)
  return 0
})
Object.assign(window, { showDirectoryPicker: async () => root })
// jsdom lacks constructable stylesheets, which `usePaneWidth` uses for the tree width.
Object.defineProperty(document, 'adoptedStyleSheets', { value: [], writable: true })
vi.stubGlobal('CSSStyleSheet', class { replaceSync() {} })

// The preview pane has its own status regions; this is the app's live region.
const status = () => document.querySelector<HTMLElement>('.visually-hidden[role="status"]')!
const refreshButton = () => screen.getByRole('button', { name: 'Refresh' })

async function openFolder() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
  await screen.findByRole('tree', { name: 'File tree' })
  // "Opened" is set together with the move of focus to the first row; wait so it can't land later.
  await waitFor(() => expect(status()).toHaveTextContent('Opened proj'))
}

describe('App refresh', () => {
  beforeEach(() => {
    getFile.mockClear()
    gate = Promise.resolve()
    rootFails = false
    held = null
    dEntries.splice(0, dEntries.length, { name: 'x', kind: 'file' })
    rootEntries.splice(0, rootEntries.length, { name: 'd', kind: 'directory' }, { name: 'a.txt', kind: 'file' })
  })

  it('disables Refresh until a folder is open', async () => {
    render(<App folderPickerSupported />)
    expect(refreshButton()).toBeDisabled()
    await openFolder()
    expect(refreshButton()).toBeEnabled()
  })

  it('shows added and removed entries, announces, busy state, and keeps focus on the button', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    rootEntries.push({ name: 'new.md', kind: 'file' })
    rootEntries.splice(1, 1)
    refreshButton().focus()

    let release = () => {}
    gate = new Promise((resolve) => {
      release = resolve
    })
    fireEvent.click(refreshButton())
    await waitFor(() => expect(refreshButton()).toHaveAttribute('aria-busy', 'true'))
    expect(refreshButton()).toHaveAccessibleName('Refresh')
    expect(status()).toHaveTextContent('Refreshing...')
    await act(async () => release())

    await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
    expect(refreshButton()).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByRole('treeitem', { name: /new\.md/ })).toBeInTheDocument()
    expect(screen.queryByRole('treeitem', { name: /a\.txt/ })).not.toBeInTheDocument()
    expect(refreshButton()).toHaveFocus()
    expect(getFile).not.toHaveBeenCalled()
  })

  it('keeps exactly one tab stop when the focused row vanishes', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.keyDown(screen.getByRole('treeitem', { name: /^d/ }), { key: 'ArrowRight' })
    const row = await screen.findByRole('treeitem', { name: /x/ })
    fireEvent.focus(row)
    dEntries.splice(0)
    refreshButton().focus()
    fireEvent.click(refreshButton())
    await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
    await waitFor(() => expect(screen.queryByRole('treeitem', { name: /^x/ })).not.toBeInTheDocument())
    const stops = screen.getAllByRole('treeitem').filter((item) => item.getAttribute('tabindex') === '0')
    expect(stops).toHaveLength(1)
    expect(refreshButton()).toHaveFocus()
  })

  it('clears the region before setting identical text, so a repeat is announced again', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.click(refreshButton())
    await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))

    held = []
    fireEvent.click(refreshButton())
    await waitFor(() => expect(refreshButton()).toHaveAttribute('aria-busy', 'false'))
    expect(status()).toBeEmptyDOMElement()
    act(() => held!.splice(0).forEach((frame) => frame(0)))
    expect(status()).toHaveTextContent('Refreshed.')
  })

  it('keeps the tree and ends the busy state when the folder cannot be read', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    rootFails = true
    fireEvent.click(refreshButton())
    await waitFor(() => expect(refreshButton()).toHaveAttribute('aria-busy', 'false'))
    expect(status()).not.toHaveTextContent('Refreshing...')
    expect(status()).not.toHaveTextContent('Refreshed.')
    expect(screen.getByRole('treeitem', { name: /a\.txt/ })).toBeInTheDocument()
  })

  it('clears a selection that no longer exists', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.keyDown(screen.getByRole('treeitem', { name: /a\.txt/ }), { key: 'Enter' })
    await screen.findByRole('region', { name: /a\.txt/ })
    rootEntries.splice(1, 1)
    fireEvent.click(refreshButton())
    await waitFor(() => expect(status()).toHaveTextContent('Selection cleared'))
    expect(screen.getByText('Select a file to preview it.')).toBeInTheDocument()
  })

  describe('selected file preview', () => {
    const text = (content: string, modified: number) =>
      new File([content], 'a.txt', { type: 'text/plain', lastModified: modified })
    const select = async () => {
      fireEvent.keyDown(screen.getByRole('treeitem', { name: /a\.txt/ }), { key: 'Enter' })
      await screen.findByRole('region', { name: /a\.txt/ })
    }

    it('shows new content and stamp, calls getFile for the Selection only, announces once', async () => {
      getFile.mockImplementation(async () => text('old text', Date.UTC(2026, 0, 5, 12)))
      render(<App folderPickerSupported />)
      await openFolder()
      await select()
      await screen.findByText('old text')
      const pane = document.querySelector('.preview')
      const stamp = document.querySelector('time')!.textContent
      expect(getFile).toHaveBeenCalledTimes(1)

      getFile.mockImplementation(async () => text('new text', Date.UTC(2026, 5, 6, 12)))
      fireEvent.click(refreshButton())
      await screen.findByText('new text')
      await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
      expect(document.querySelector('time')!.textContent).not.toBe(stamp)
      expect(getFile).toHaveBeenCalledTimes(2)
      expect(document.querySelector('.preview')).toBe(pane)
    })

    it('keeps the header for an unchanged file', async () => {
      getFile.mockImplementation(async () => text('same', Date.UTC(2026, 0, 5, 12)))
      render(<App folderPickerSupported />)
      await openFolder()
      await select()
      await screen.findByText('same')
      fireEvent.click(refreshButton())
      await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
      expect(screen.getByRole('region', { name: /a\.txt/ })).toBeInTheDocument()
      expect(screen.getByText('same')).toBeInTheDocument()
    })

    it('shows the empty card when the file became empty', async () => {
      getFile.mockImplementation(async () => text('some', 1))
      render(<App folderPickerSupported />)
      await openFolder()
      await select()
      await screen.findByText('some')
      getFile.mockImplementation(async () => text('', 1))
      fireEvent.click(refreshButton())
      await screen.findByText('This file is empty.')
    })

    it('shows a card, not the old content, when the reload rejects', async () => {
      getFile.mockImplementation(async () => text('some', 1))
      render(<App folderPickerSupported />)
      await openFolder()
      await select()
      await screen.findByText('some')
      getFile.mockImplementation(async () => {
        throw new Error('gone')
      })
      fireEvent.click(refreshButton())
      await waitFor(() => expect(screen.queryByText('some')).not.toBeInTheDocument())
      expect(screen.getByRole('heading', { name: 'a.txt' })).toBeInTheDocument()
      await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
    })

    it('announces Refreshed. only after the reloaded preview lands', async () => {
      getFile.mockImplementation(async () => text('old text', 1))
      render(<App folderPickerSupported />)
      await openFolder()
      await select()
      await screen.findByText('old text')
      let release = () => {}
      const slow = new Promise<void>((resolve) => {
        release = resolve
      })
      getFile.mockImplementation(async () => {
        await slow
        return text('new text', 2)
      })
      fireEvent.click(refreshButton())
      await waitFor(() => expect(refreshButton()).toHaveAttribute('aria-busy', 'false'))
      expect(screen.getByText('old text')).toBeInTheDocument()
      expect(status()).not.toHaveTextContent('Refreshed.')
      await act(async () => release())
      await screen.findByText('new text')
      await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
    })

    it('drops the result and the announcement when another file is selected mid-reload', async () => {
      rootEntries.push({ name: 'b.txt', kind: 'file' })
      getFile.mockImplementation(async () => text('old text', 1))
      render(<App folderPickerSupported />)
      await openFolder()
      await select()
      await screen.findByText('old text')
      let release = () => {}
      const slow = new Promise<void>((resolve) => {
        release = resolve
      })
      getFile.mockImplementation(async () => {
        await slow
        return text('late text', 2)
      })
      fireEvent.click(refreshButton())
      await waitFor(() => expect(refreshButton()).toHaveAttribute('aria-busy', 'false'))
      getFile.mockImplementation(async () => text('b text', 3))
      fireEvent.keyDown(screen.getByRole('treeitem', { name: /b\.txt/ }), { key: 'Enter' })
      await screen.findByText('b text')
      await act(async () => release())
      expect(screen.queryByText('late text')).not.toBeInTheDocument()
      expect(status()).toHaveTextContent('Previewing b.txt')
    })

    it('announces Refreshed. again for a refresh after opening another folder', async () => {
      getFile.mockImplementation(async () => text('some', 1))
      render(<App folderPickerSupported />)
      await openFolder()
      await select()
      await screen.findByText('some')
      fireEvent.click(refreshButton())
      await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))

      fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
      await waitFor(() => expect(status()).toHaveTextContent('Opened proj'))
      await select()
      await screen.findByText('some')
      fireEvent.click(refreshButton())
      await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
    })

    it('opens no session on a refresh with no selection', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      getFile.mockClear()
      fireEvent.click(refreshButton())
      await waitFor(() => expect(status()).toHaveTextContent('Refreshed.'))
      expect(getFile).not.toHaveBeenCalled()
    })
  })
})
