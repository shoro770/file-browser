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

const deep = fakeDir('deep', [{ name: 'a.txt', kind: 'file' }])
const sub = fakeDir('sub', [{ name: 'deep', kind: 'directory' }, { name: 'log.txt', kind: 'file' }], { deep })
const root = fakeDir(
  'proj',
  [
    { name: 'sub', kind: 'directory' },
    { name: '.env', kind: 'file' },
    { name: 'catalog.txt', kind: 'file' },
    { name: 'README.md', kind: 'file' },
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

const box = () => screen.getByRole('textbox', { name: 'Search files and folders' })
const type = (text: string) => fireEvent.change(box(), { target: { value: text } })
const treeitem = (name: RegExp) => screen.getByRole('treeitem', { name })
const tabStops = () => screen.getAllByRole('treeitem').filter((item) => item.getAttribute('tabindex') === '0')

async function openFolder() {
  render(<App folderPickerSupported />)
  fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
  await screen.findByRole('tree', { name: 'File tree' })
}

describe('App search', () => {
  it('finds a never-expanded file under expanded ancestors, with a11y roles intact', async () => {
    await openFolder()
    type('a.txt')
    const result = await screen.findByRole('treeitem', { name: /^a\.txt/ })
    expect(result).toHaveAttribute('aria-level', '3')
    expect(treeitem(/^sub/)).toHaveAttribute('aria-expanded', 'true')
    expect(treeitem(/^deep/)).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('group').length).toBe(2)
    expect(screen.queryByRole('treeitem', { name: /README/ })).not.toBeInTheDocument()
    expect(tabStops()).toHaveLength(1)
    expect(result.querySelector('mark')).toHaveTextContent('a.txt')
  })

  it('searches dotfiles, and supports wildcard, whole word and regex modes', async () => {
    await openFolder()
    type('env')
    await screen.findByText('1 match')
    expect(treeitem(/\.env/)).toBeInTheDocument()
    expect(screen.queryByRole('treeitem', { name: /README/ })).not.toBeInTheDocument()

    type('*.txt')
    await waitFor(() => expect(screen.queryByRole('treeitem', { name: /\.env/ })).not.toBeInTheDocument())
    expect(treeitem(/^catalog\.txt/)).toBeInTheDocument()

    type('log')
    await screen.findByRole('treeitem', { name: /^log\.txt/ })
    await waitFor(() => expect(screen.queryByRole('treeitem', { name: /\.env/ })).not.toBeInTheDocument())
    expect(screen.getByRole('treeitem', { name: /^catalog\.txt/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Whole word' }))
    expect(screen.getByRole('button', { name: 'Whole word' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(screen.queryByRole('treeitem', { name: /^catalog\.txt/ })).not.toBeInTheDocument())
    expect(treeitem(/^log\.txt/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Whole word' }))
    fireEvent.click(screen.getByRole('button', { name: 'Regex' }))
    type('^\\.env')
    await waitFor(() => expect(screen.getByRole('treeitem', { name: /\.env/ })).toBeInTheDocument())
    expect(screen.queryByRole('treeitem', { name: /catalog/ })).not.toBeInTheDocument()
  })

  it('shows Invalid pattern and keeps the last good results', async () => {
    await openFolder()
    fireEvent.click(screen.getByRole('button', { name: 'Regex' }))
    type('^README')
    await screen.findByText('1 match')
    type('(')
    expect(await screen.findByText('Invalid pattern')).toBeInTheDocument()
    expect(treeitem(/README/)).toBeInTheDocument()
  })

  it('says No matches', async () => {
    await openFolder()
    type('zzz')
    expect(await screen.findByText('No matches')).toBeInTheDocument()
    await waitFor(() => expect(document.querySelector('[role="status"]')).toHaveTextContent('No matches'))
  })

  it('selects and previews a result that was not loaded, and Escape restores the tree', async () => {
    await openFolder()
    type('a.txt')
    const result = await screen.findByRole('treeitem', { name: /^a\.txt/ })
    fireEvent.click(result.querySelector('.tree-row')!)
    await waitFor(() => expect(document.querySelector('[role="status"]')).toHaveTextContent('Previewing a.txt'))
    await waitFor(() => expect(treeitem(/^a\.txt/)).toHaveAttribute('aria-selected', 'true'))

    fireEvent.keyDown(box(), { key: 'Escape' })
    expect(box()).toHaveValue('')
    expect(treeitem(/^README/)).toBeInTheDocument()
    expect(treeitem(/^a\.txt/)).toHaveAttribute('aria-selected', 'true')
    expect(tabStops()).toHaveLength(1)
  })

  it('restores the previous expansion and selection when nothing was picked', async () => {
    await openFolder()
    type('readme')
    await screen.findByText('1 match')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(treeitem(/^sub/)).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('treeitem', { name: /^deep/ })).not.toBeInTheDocument()
    expect(tabStops()).toHaveLength(1)
  })

  it('moves the preview with keyboard focus on a not-yet-loaded result', async () => {
    await openFolder()
    type('a.txt')
    await screen.findByRole('treeitem', { name: /^a\.txt/ })
    fireEvent.keyDown(treeitem(/^deep/), { key: 'ArrowDown' })
    await waitFor(() => expect(document.querySelector('[role="status"]')).toHaveTextContent('1 match'))
    await waitFor(() => expect(screen.getByRole('treeitem', { name: /^a\.txt/ })).toHaveAttribute('aria-selected', 'true'))
  })

  it('keeps focus in the box when the query is emptied, and ArrowDown moves it to the results', async () => {
    await openFolder()
    await new Promise((resolve) => setTimeout(resolve, 300))
    box().focus()
    type('a.txt')
    await screen.findByText('1 match')
    expect(box()).toHaveFocus()
    fireEvent.keyDown(box(), { key: 'ArrowDown' })
    await waitFor(() => expect(screen.getByRole('treeitem', { name: /^sub/ })).toHaveFocus())
    box().focus()
    type('')
    expect(box()).toHaveFocus()
  })
})
