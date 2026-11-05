// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import './testHelpers'

type Entry = { name: string; kind: 'file' | 'directory' }

/** A fake folder handle; `children` maps a child folder name to its handle. */
function fakeDir(name: string, entries: Entry[], children: Record<string, unknown> = {}) {
  return {
    name,
    kind: 'directory',
    values: async function* () {
      yield* entries
    },
    getDirectoryHandle: async (child: string) => children[child],
    getFileHandle: async () => ({ getFile: async () => new File(['hi'], 'a.txt') }),
  }
}

const sub = fakeDir('sub', [{ name: 'x.pdf', kind: 'file' }])
const root = fakeDir(
  'proj',
  [
    { name: 'sub', kind: 'directory' },
    { name: 'a.html', kind: 'file' },
    { name: 'B.HTML', kind: 'file' },
    { name: 'c.pdf', kind: 'file' },
    { name: 'Makefile', kind: 'file' },
  ],
  { sub },
)

vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
  callback(0)
  return 0
})
Object.assign(window, { showDirectoryPicker: async () => root })
Object.defineProperty(document, 'adoptedStyleSheets', { value: [], writable: true })
vi.stubGlobal('CSSStyleSheet', class { replaceSync() {} })

const select = () => screen.getByRole('combobox', { name: 'File type' }) as HTMLSelectElement
const names = () => screen.getAllByRole('treeitem').map((item) => item.textContent)
const tabStops = () => screen.getAllByRole('treeitem').filter((item) => item.getAttribute('tabindex') === '0')

async function openFolder() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
  await screen.findByRole('tree', { name: 'File tree' })
}

describe('App file type filter', () => {
  it('filters the tree to one type, keeps folders, and keeps the a11y numbers right', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    expect([...select().options].map((option) => option.textContent)).toEqual(['All files', '.html', '.pdf'])

    fireEvent.change(select(), { target: { value: 'html' } })
    expect(names()).toEqual(['sub', 'a.html', 'B.HTML'])
    const first = screen.getByRole('treeitem', { name: 'a.html' })
    expect(first).toHaveAttribute('aria-setsize', '3')
    expect(first).toHaveAttribute('aria-posinset', '2')
    expect(screen.getByRole('tree')).toBeInTheDocument()
    expect(tabStops()).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Showing only .html files')

    fireEvent.change(select(), { target: { value: '' } })
    expect(names()).toHaveLength(5)
    expect(screen.getByRole('status')).toHaveTextContent('Showing all files')
  })

  it('shows "No matching files" in a folder without that type', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.change(select(), { target: { value: 'html' } })
    fireEvent.click(screen.getByText('sub'))
    expect(await screen.findByRole('treeitem', { name: 'No matching files' })).toHaveAttribute('aria-disabled', 'true')
    expect(tabStops()).toHaveLength(1)
  })

  it('keeps a hidden selection, with one repaired tab stop', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.click(screen.getByRole('treeitem', { name: 'c.pdf' }).querySelector('.tree-row')!)
    await waitFor(() => expect(screen.getByRole('treeitem', { name: 'c.pdf' })).toHaveAttribute('aria-selected', 'true'))
    fireEvent.change(select(), { target: { value: 'html' } })
    expect(screen.queryByRole('treeitem', { name: 'c.pdf' })).toBeNull()
    expect(screen.getByRole('region')).toBeInTheDocument()
    expect(tabStops()).toHaveLength(1)
  })

  it('resets to all files when a folder is opened', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.change(select(), { target: { value: 'pdf' } })
    await openFolder()
    await waitFor(() => expect(select().value).toBe(''))
  })

  it('does not filter search results', async () => {
    render(<App folderPickerSupported />)
    await openFolder()
    fireEvent.change(select(), { target: { value: 'html' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Search files and folders' }), { target: { value: 'c.pdf' } })
    expect(await screen.findByRole('treeitem', { name: /^c\.pdf/ })).toBeInTheDocument()
  })
})
