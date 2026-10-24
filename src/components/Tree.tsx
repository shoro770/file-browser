import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { TreeProps } from '../types'
import TreeNode, { TreePlaceholder } from './TreeNode'

/**
 * The file tree (`role="tree"`, named "File tree"). Owns roving tabindex: exactly one
 * visible row is the tab stop (the last focused row, else the selected one, else the
 * first). Mount it with a new `key` per opened folder so focus state starts fresh.
 */
export default function Tree({
  items,
  rootIds,
  childIds,
  expandedIds,
  loadingIds,
  onToggle,
  onSelect,
  selectedId,
  focusToken,
}: TreeProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)

  useEffect(() => {
    if (focusToken === 0) return
    listRef.current?.querySelector<HTMLElement>('[role="treeitem"]')?.focus()
  }, [focusToken])

  const visible = new Set<string>()
  const collect = (ids: readonly string[]) => {
    for (const id of ids) {
      visible.add(id)
      if (expandedIds.has(id)) collect(childIds[id] ?? [])
    }
  }
  collect(rootIds)

  const has = (id: string | null) => id !== null && visible.has(id)
  const tabStopId = has(focusedId) ? focusedId : has(selectedId) ? selectedId : (rootIds[0] ?? null)

  const renderRows = (ids: readonly string[], level: number): ReactNode =>
    ids.map((id, index) => {
      const item = items[id]
      const expanded = item.isDirectory && expandedIds.has(id)
      const loading = item.isDirectory && loadingIds.has(id)
      let children: ReactNode = null
      if (expanded) {
        const childList = childIds[id]
        if (loading) children = <TreePlaceholder label="Loading..." level={level + 1} />
        else if (childList?.length === 0) children = <TreePlaceholder label="Empty folder" level={level + 1} />
        else if (childList) children = renderRows(childList, level + 1)
      }
      return (
        <TreeNode
          key={id}
          item={item}
          level={level}
          setSize={ids.length}
          posInSet={index + 1}
          selected={id === selectedId}
          tabIndex={id === tabStopId ? 0 : -1}
          onFocusRow={setFocusedId}
          expanded={expanded}
          loading={loading}
          onToggle={onToggle}
          onSelect={onSelect}
        >
          {children}
        </TreeNode>
      )
    })

  return (
    <ul ref={listRef} className="tree" role="tree" aria-label="File tree">
      {renderRows(rootIds, 1)}
    </ul>
  )
}
