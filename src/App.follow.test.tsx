// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import './testHelpers'

type Entry = { name: string; kind: 'file' | 'directory' }

const getFile = vi.fn(async () => new File(['hello'], 'x.txt', { type: 'text/plain' }))
let dFails = false

/** A fake folder handle listing a fixed set of entries. */
function fakeDir(name: string, entries: () => Entry[], children: Record<string, unknown> = {}) {
  return {
    name,
    kind: 'directory',
    values: async function* () {
      yield* entries()
    },
    getDirectoryHandle: async (child: string) => children[child],
    getFileHandle: async () => ({ getFile }),
  }
}

const rootEntries: Entry[] = []
const root = fakeDir('proj', () => rootEntries, {
  d: fakeDir('d', () => {
    if (dFails) throw new Error('unreadable')
    return [
      { name: 's', kind: 'directory' },
      { name: 'x', kind: 'file' },
      { name: 'y', kind: 'file' },
    ]
  }),
  e: fakeDir('e', () => []),
  '.git': fakeDir('.git', () => [{ name: 'config', kind: 'file' }]),
})

vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
  callback(0)
  return 0
})
Object.assign(window, { showDirectoryPicker: async () => root })
Object.defineProperty(document, 'adoptedStyleSheets', { value: [], writable: true })
vi.stubGlobal('CSSStyleSheet', class { replaceSync() {} })

const status = () => document.querySelector<HTMLElement>('.visually-hidden[role="status"]')!
/** The tree row with this id (an expanded folder's accessible name includes its children). */
const row = (id: string) => screen.getAllByRole('treeitem').find((item) => item.dataset.key === id)!
const press = (id: string, key: string) => {
  row(id).focus()
  fireEvent.keyDown(row(id), { key })
}

async function openFolder() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
  await screen.findByRole('tree', { name: 'File tree' })
  await waitFor(() => expect(status()).toHaveTextContent('Opened proj'))
}

describe('preview follows keyboard focus', () => {
  beforeEach(() => {
    getFile.mockClear()
    dFails = false
    rootEntries.splice(
      0,
      rootEntries.length,
      { name: 'd', kind: 'directory' },
      { name: 'e', kind: 'directory' },
      { name: 'a.txt', kind: 'file' },
      { name: 'b.txt', kind: 'file' },
    )
  })

  it('selects and previews the file Down lands on, without Enter or an announcement', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    press('a.txt', 'ArrowDown')
    expect(row('b.txt')).toHaveAttribute('aria-selected', 'true')
    await screen.findByRole('region', { name: 'b.txt' })
    expect(status()).not.toHaveTextContent('Previewing')
  })

  it('shows the folder card with direct counts and no size when a folder is reached', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    press('a.txt', 'Home')
    const region = await screen.findByRole('region', { name: 'd' })
    expect(region).toHaveTextContent('Location')
    expect(region).toHaveTextContent('/d')
    expect(region).toHaveTextContent('1 folder, 2 files')
    expect(region).not.toHaveTextContent(/size/i)
    expect(row('d')).toHaveAttribute('aria-selected', 'true')
  })

  it('says Empty for an empty folder', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    press('d', 'ArrowDown')
    expect(await screen.findByRole('region', { name: 'e' })).toHaveTextContent('Empty')
  })

  it('says the folder cannot be read when it cannot be listed', async () => {
    dFails = true
    render(<App folderPickerSupported />)
    await openFolder()
    press('a.txt', 'Home')
    await screen.findByText("This folder can't be read.")
  })

  it('moves onto a placeholder row without changing the selection', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    press('e', 'ArrowRight')
    await screen.findByText('Empty folder')
    fireEvent.keyDown(row('e'), { key: 'ArrowDown' })
    expect(document.activeElement).toHaveTextContent('Empty folder')
    expect(row('e')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('region', { name: 'e' })).toBeInTheDocument()
  })

  it('reads only where a quick run of Down presses stops', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    row('d').focus()
    fireEvent.keyDown(row('d'), { key: 'ArrowDown' })
    fireEvent.keyDown(row('e'), { key: 'ArrowDown' })
    fireEvent.keyDown(row('a.txt'), { key: 'ArrowDown' })
    await screen.findByRole('region', { name: 'b.txt' })
    expect(getFile).toHaveBeenCalledTimes(1)
  })

  it('toggles a folder on Enter and keeps it selected and shown', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    press('d', 'Enter')
    await screen.findByRole('treeitem', { name: 'x' })
    expect(row('d')).toHaveAttribute('aria-expanded', 'true')
    expect(row('d')).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByRole('region', { name: 'd' })).toBeInTheDocument()
  })

  it('expands a folder on click and shows its card', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.click(screen.getByText('e'))
    expect(row('e')).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('region', { name: 'e' })).toBeInTheDocument()
  })

  it('still announces Previewing on Enter for a file', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    press('a.txt', 'Enter')
    await waitFor(() => expect(status()).toHaveTextContent('Previewing a.txt'))
  })

  it('clears a selected hidden folder when dotfiles are hidden', async () => {
    rootEntries.unshift({ name: '.git', kind: 'directory' })
    render(<App folderPickerSupported />)
    await openFolder()
    press('d', 'ArrowUp')
    await screen.findByRole('region', { name: '.git' })
    fireEvent.click(screen.getByRole('button', { name: /Hidden files/ }))
    await screen.findByText('Select a file to preview it.')
  })

  it('keeps exactly one tab stop while moving', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    press('d', 'ArrowDown')
    fireEvent.keyDown(row('e'), { key: 'End' })
    const stops = screen.getAllByRole('treeitem').filter((item) => item.tabIndex === 0)
    expect(stops).toHaveLength(1)
    expect(stops[0]).toHaveAccessibleName('b.txt')
  })
})
