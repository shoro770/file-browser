// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import './testHelpers'

const root = {
  name: 'proj',
  kind: 'directory',
  values: async function* () {
    yield { name: 'a.txt', kind: 'file' }
  },
  getFileHandle: async () => ({ getFile: async () => new File(['hi'], 'a.txt') }),
}
Object.assign(window, { showDirectoryPicker: async () => root })
// jsdom lacks constructable stylesheets, which `usePaneWidth` uses for the tree width.
Object.defineProperty(document, 'adoptedStyleSheets', { value: [], writable: true })
vi.stubGlobal('CSSStyleSheet', class { replaceSync() {} })

beforeEach(() => {
  document.documentElement.dataset.theme = 'light'
  window.localStorage.clear()
})

describe('App theme control', () => {
  it('is in the toolbar and usable with no folder open', () => {
    render(<App folderPickerSupported />)
    const sand = screen.getByRole('radio', { name: 'Warm Sand' })
    fireEvent.click(sand)
    expect(document.documentElement.dataset.theme).toBe('sand')
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument()
  })

  it('keeps the Selection and the preview when the theme changes', async () => {
    render(<App folderPickerSupported />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Open folder' })[0])
    // The Tree remounts once "Opened" is announced, so wait for it before taking a row.
    await waitFor(() => expect(document.querySelector('[role="status"]')).toHaveTextContent('Opened proj'))
    fireEvent.keyDown(await screen.findByRole('treeitem', { name: /a\.txt/ }), { key: 'Enter' })
    await screen.findByRole('region', { name: /a\.txt/ })
    expect(screen.getByRole('treeitem', { name: /a\.txt/ })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('treeitem', { name: /a\.txt/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tree', { name: 'File tree' })).toBeInTheDocument()
  })
})
