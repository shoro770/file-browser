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
    getFileHandle: async (child: string) => {
      if (!entries().some((entry) => entry.name === child && entry.kind === 'file')) {
        throw new DOMException('gone', 'NotFoundError')
      }
      return { getFile }
    },
  }
}

const dEntries: Entry[] = [{ name: 'x', kind: 'file' }]
const rootEntries: Entry[] = [
  { name: 'd', kind: 'directory' },
  { name: 'a.txt', kind: 'file' },
]
let rootFails = false
let dFails = false
const root = fakeDir(
  'proj',
  () => {
    if (rootFails) throw new Error('unreadable')
    return rootEntries
  },
  {
    d: fakeDir('d', () => {
      if (dFails) throw new Error('unreadable')
      return dEntries
    }),
  },
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
    getFile.mockReset()
    getFile.mockImplementation(async () => new File(['hi'], 'a.txt'))
    gate = Promise.resolve()
    rootFails = false
    dFails = false
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

  describe('missing selection and unreadable folders', () => {
    const removed = (name: string) => `${name} was removed or can no longer be read, so the selection was cleared.`
    const ACCESS = "Access to that folder wasn't granted. Choose a folder to try again."
    const activate = (name: string | RegExp) => fireEvent.keyDown(screen.getByRole('treeitem', { name }), { key: 'Enter' })
    const selectA = async () => {
      activate(/a\.txt/)
      await screen.findByRole('region', { name: /a\.txt/ })
    }
    const noticeEl = () => document.querySelector('.preview__notice')
    const noticeText = (text: string) => waitFor(() => expect(noticeEl()).toHaveTextContent(text))

    it('keeps the tree and selection, and shows the alert, when the folder cannot be read', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      await selectA()
      rootFails = true
      fireEvent.click(refreshButton())
      expect(await screen.findByRole('alert')).toHaveTextContent(ACCESS)
      expect(refreshButton()).toHaveAttribute('aria-busy', 'false')
      expect(status()).not.toHaveTextContent('Refreshed.')
      expect(screen.getByRole('treeitem', { name: /a\.txt/ })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: /a\.txt/ })).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Open folder' })[0]).toBeEnabled()
    })

    it('dismisses the access alert on the next action', async () => {
      rootEntries.push({ name: 'b.txt', kind: 'file' })
      render(<App folderPickerSupported />)
      await openFolder()
      rootFails = true
      fireEvent.click(refreshButton())
      await screen.findByRole('alert')
      activate(/b\.txt/)
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    })

    it('clears a deleted selection with the notice above the prompt, mirrored to the status', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      await selectA()
      rootEntries.splice(1, 1)
      refreshButton().focus()
      fireEvent.click(refreshButton())
      await waitFor(() => expect(status()).toHaveTextContent(removed('a.txt')))
      const message = noticeEl()!
      const prompt = screen.getByText('Select a file to preview it.')
      expect(message.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(refreshButton()).toHaveFocus()
      const stops = screen.getAllByRole('treeitem').filter((item) => item.getAttribute('tabindex') === '0')
      expect(stops).toHaveLength(1)
    })

    it('keeps the notice until the next selection, then removes it', async () => {
      rootEntries.push({ name: 'b.txt', kind: 'file' })
      render(<App folderPickerSupported />)
      await openFolder()
      await selectA()
      rootEntries.splice(1, 1)
      fireEvent.click(refreshButton())
      await noticeText(removed('a.txt'))
      fireEvent.click(refreshButton())
      await waitFor(() => expect(refreshButton()).toHaveAttribute('aria-busy', 'false'))
      expect(noticeEl()).toBeInTheDocument()
      activate(/b\.txt/)
      await screen.findByRole('region', { name: /b\.txt/ })
      expect(noticeEl()).not.toBeInTheDocument()
    })

    it('removes the notice when another folder is opened', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      await selectA()
      rootEntries.splice(1, 1)
      fireEvent.click(refreshButton())
      await noticeText(removed('a.txt'))
      fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
      await waitFor(() => expect(noticeEl()).not.toBeInTheDocument())
    })

    it('shows the notice over the empty-folder pane when nothing is left', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      await selectA()
      rootEntries.splice(0)
      fireEvent.click(refreshButton())
      await noticeText(removed('a.txt'))
      expect(screen.getByText('This folder is empty.')).toBeInTheDocument()
    })

    it('dismisses the access alert on a folder toggle and on the Hidden files toggle', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      rootFails = true
      fireEvent.click(refreshButton())
      await screen.findByRole('alert')
      fireEvent.keyDown(screen.getByRole('treeitem', { name: /^d/ }), { key: 'ArrowRight' })
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())

      fireEvent.click(refreshButton())
      await screen.findByRole('alert')
      fireEvent.click(screen.getByRole('button', { name: 'Hidden files' }))
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
      fireEvent.click(screen.getByRole('button', { name: 'Hidden files' }))
    })

    it('clears a listed selection that can no longer be read and keeps its row', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      await selectA()
      getFile.mockImplementation(async () => {
        throw new DOMException('denied', 'NotAllowedError')
      })
      fireEvent.click(refreshButton())
      await noticeText(removed('a.txt'))
      expect(screen.getByText('Select a file to preview it.')).toBeInTheDocument()
      expect(screen.getByRole('treeitem', { name: /a\.txt/ })).toBeInTheDocument()
    })

    it('removes the parent row and clears the selection when the parent folder is gone', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      fireEvent.keyDown(screen.getByRole('treeitem', { name: /^d/ }), { key: 'ArrowRight' })
      await screen.findByRole('treeitem', { name: 'x' })
      activate('x')
      await screen.findByRole('region', { name: 'x' })
      rootEntries.splice(0, 1)
      fireEvent.click(refreshButton())
      await noticeText(removed('x'))
      expect(screen.queryByRole('treeitem', { name: /^d/ })).not.toBeInTheDocument()
    })

    it('clears a selection deleted under a collapsed folder', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      const folder = screen.getByRole('treeitem', { name: /^d/ })
      fireEvent.keyDown(folder, { key: 'ArrowRight' })
      await screen.findByRole('treeitem', { name: 'x' })
      activate('x')
      await screen.findByRole('region', { name: 'x' })
      fireEvent.keyDown(screen.getByRole('treeitem', { name: /^d/ }), { key: 'ArrowLeft' })
      await waitFor(() => expect(screen.queryByRole('treeitem', { name: 'x' })).not.toBeInTheDocument())
      dEntries.splice(0)
      fireEvent.click(refreshButton())
      await noticeText(removed('x'))
    })

    it('marks an expanded folder that became unreadable and keeps the rest working', async () => {
      render(<App folderPickerSupported />)
      await openFolder()
      fireEvent.keyDown(screen.getByRole('treeitem', { name: /^d/ }), { key: 'ArrowRight' })
      await screen.findByRole('treeitem', { name: 'x' })
      dFails = true
      fireEvent.click(refreshButton())
      await screen.findByText("This folder can't be read.")
      expect(screen.getByRole('treeitem', { name: /^d/ })).toHaveAccessibleDescription(/Unavailable/)
      expect(noticeEl()).not.toBeInTheDocument()
      await selectA()
    })

    it('keeps a selection whose path now holds a different file, and reloads it', async () => {
      getFile.mockImplementation(async () => new File(['old'], 'a.txt', { type: 'text/plain' }))
      render(<App folderPickerSupported />)
      await openFolder()
      await selectA()
      await screen.findByText('old')
      getFile.mockImplementation(async () => new File(['replaced'], 'a.txt', { type: 'text/plain' }))
      fireEvent.click(refreshButton())
      await screen.findByText('replaced')
      expect(noticeEl()).not.toBeInTheDocument()

      // The store outlives the test; end with no selection so the next test mounts clean.
      rootEntries.splice(1, 1)
      fireEvent.click(refreshButton())
      await noticeText(removed('a.txt'))
    })
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
      expect(getFile).toHaveBeenCalledTimes(3) // select, then the Refresh probe and the reload
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

    it('shows a card, not the old content, when the reload fails to render', async () => {
      getFile.mockImplementation(async () => text('some', 1))
      render(<App folderPickerSupported />)
      await openFolder()
      await select()
      await screen.findByText('some')
      getFile.mockImplementationOnce(async () => text('some', 1)) // the Refresh probe reads fine
      getFile.mockImplementation(async () => {
        const broken = text('some', 1)
        broken.slice = () => {
          throw new Error('cannot read')
        }
        return broken
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
      getFile.mockImplementationOnce(async () => text('old text', 1)) // the Refresh probe
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
      getFile.mockImplementationOnce(async () => text('old text', 1)) // the Refresh probe
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
