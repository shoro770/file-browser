import { useEffect, useRef, useState } from 'react'
import type { TreeProps } from '../types'
import TreeNode from './TreeNode'

/**
 * The file tree (`role="tree"`, named "File tree"). Owns roving tabindex: exactly one
 * row is the tab stop (the last focused row, else the selected one, else the first).
 * Mount it with a new `key` per opened folder so focus state starts fresh.
 */
export default function Tree({ items, selectedId, focusToken }: TreeProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)

  useEffect(() => {
    if (focusToken === 0) return
    listRef.current?.querySelector<HTMLElement>('[role="treeitem"]')?.focus()
  }, [focusToken])

  const has = (id: string | null) => id !== null && items.some((item) => item.id === id)
  const tabStopId = has(focusedId) ? focusedId : has(selectedId) ? selectedId : (items[0]?.id ?? null)

  return (
    <ul ref={listRef} className="tree" role="tree" aria-label="File tree">
      {items.map((item, index) => (
        <TreeNode
          key={item.id}
          item={item}
          level={1}
          setSize={items.length}
          posInSet={index + 1}
          selected={item.id === selectedId}
          tabIndex={item.id === tabStopId ? 0 : -1}
          onFocusRow={setFocusedId}
        />
      ))}
    </ul>
  )
}
