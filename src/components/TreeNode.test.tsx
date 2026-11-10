// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FileItem, TreeNodeProps } from '../types'
import '../testHelpers'
import TreeNode from './TreeNode'

const LONG = 'a-very-long-document-name-that-does-not-fit-the-tree.final.pdf'

function props(item: FileItem, extra: Partial<TreeNodeProps> = {}): TreeNodeProps {
  return {
    item,
    level: 1,
    setSize: 1,
    posInSet: 1,
    selected: false,
    tabIndex: 0,
    onFocusRow: vi.fn(),
    expanded: false,
    loading: false,
    unavailable: false,
    dotfile: false,
    onToggle: vi.fn(),
    onSelect: vi.fn(),
    ...extra,
  }
}

const file = (name: string): FileItem => ({ id: name, name, isDirectory: false }) as FileItem

describe('TreeNode label', () => {
  it('stays an accessible treeitem with its state and the single tab stop', () => {
    render(<TreeNode {...props(file(LONG), { selected: true })} />)
    const item = screen.getByRole('treeitem', { name: LONG })
    expect(item).toHaveAttribute('aria-selected', 'true')
    expect(item).toHaveAttribute('tabindex', '0')
  })

  it('shows the extension in its own fixed element and keeps the full name as the tooltip', () => {
    const { container } = render(<TreeNode {...props(file(LONG))} />)
    expect(container.querySelector('.tree-row__ext')?.textContent).toBe('.pdf')
    expect(container.querySelector('.tree-row__stem')?.textContent).toBe(LONG.slice(0, -4))
    expect(container.querySelector('.tree-row')).toHaveAttribute('data-full-name', LONG)
  })

  it('does not split a dotfile or a folder name', () => {
    const dot = render(<TreeNode {...props(file('.env'))} />)
    expect(dot.container.querySelector('.tree-row__ext')).toBeNull()
    dot.unmount()
    const folder = render(
      <TreeNode {...props({ id: 'v1.2', name: 'v1.2', isDirectory: true } as FileItem)} />,
    )
    expect(folder.container.querySelector('.tree-row__ext')).toBeNull()
  })

  it('wraps a match that spans the stem and the extension in marks on both sides', () => {
    const { container } = render(<TreeNode {...props(file('notes.md'), { ranges: [[3, 8]] })} />)
    const marks = [...container.querySelectorAll('mark')].map((mark) => mark.textContent)
    expect(marks).toEqual(['es', '.md'])
    expect(container.querySelector('.tree-row__label')?.textContent).toBe('notes.md')
  })

  it('marks the row as truncated on hover only when the stem is cut off', () => {
    const { container } = render(<TreeNode {...props(file(LONG))} />)
    const row = container.querySelector('.tree-row') as HTMLElement
    const stem = container.querySelector('.tree-row__stem') as HTMLElement
    fireEvent.mouseEnter(row)
    expect(row).not.toHaveClass('is-truncated')
    Object.defineProperty(stem, 'scrollWidth', { value: 300, configurable: true })
    Object.defineProperty(stem, 'clientWidth', { value: 100, configurable: true })
    fireEvent.mouseEnter(row)
    expect(row).toHaveClass('is-truncated')
  })
})
