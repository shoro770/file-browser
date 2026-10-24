import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { findTypeAhead, PLACEHOLDER_PREFIX, pageStep, parentId, placeholderKey, visibleRows } from '../lib/tree'
import type { TreeProps } from '../types'
import TreeNode, { TreePlaceholder } from './TreeNode'

/** Height of one tree row in px (matches the 28px row in `App.css`). */
const ROW_HEIGHT = 28

/** How long, in ms, typed characters keep accumulating into one type-ahead query. */
const TYPE_AHEAD_MS = 500

/**
 * The file tree (`role="tree"`, named "File tree"). Owns the full keyboard map and roving
 * tabindex: exactly one visible row (placeholders included) is the tab stop - the focused
 * row, else the nearest visible ancestor of the last focused row, else the selected row,
 * else the first. Mount it with a new `key` per opened folder so focus state starts fresh.
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
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  const typeAhead = useRef({ query: '', time: 0 })

  useEffect(() => {
    if (focusToken === 0) return
    listRef.current?.querySelector<HTMLElement>('[role="treeitem"]')?.focus()
  }, [focusToken])

  const rows = visibleRows(items, rootIds, childIds, expandedIds, loadingIds)
  const visibleKeys = new Set(rows.map((row) => row.key))

  /** Finds the last focused row, or its nearest ancestor that is still visible. */
  const survivingKey = (key: string | null): string | null => {
    if (key === null) return null
    if (visibleKeys.has(key)) return key
    let id = key.startsWith(PLACEHOLDER_PREFIX) ? key.slice(PLACEHOLDER_PREFIX.length) : parentId(key)
    while (id !== '') {
      if (visibleKeys.has(id)) return id
      id = parentId(id)
    }
    return null
  }
  const tabStopKey =
    survivingKey(focusedKey) ??
    (selectedId !== null && visibleKeys.has(selectedId) ? selectedId : null) ??
    rows[0]?.key ??
    null

  const focusRow = (key: string) => {
    const selector = '[data-key="' + CSS.escape(key) + '"]'
    listRef.current?.querySelector<HTMLElement>(selector)?.focus()
  }

  // A focused row that was removed (e.g. "Loading..." replaced by children) drops focus
  // to <body>; hand it to the repaired tab stop.
  useEffect(() => {
    if (
      focusedKey !== null &&
      !visibleKeys.has(focusedKey) &&
      tabStopKey !== null &&
      document.activeElement === document.body
    ) {
      focusRow(tabStopKey)
    }
  })

  const handleKeyDown =(event: KeyboardEvent<HTMLUListElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const key = (event.target as HTMLElement).dataset.key
    if (key === undefined) return
    const index = rows.findIndex((row) => row.key === key)
    if (index < 0) return
    const row = rows[index]
    const moveTo = (next: number) => {
      focusRow(rows[Math.min(rows.length - 1, Math.max(0, next))].key)
    }
    // The list grows with its rows; the scrolling pane around it sets the visible page.
    const page = () => pageStep(listRef.current?.parentElement?.clientHeight ?? 0, ROW_HEIGHT)

    switch (event.key) {
      case 'ArrowDown':
        moveTo(index + 1)
        break
      case 'ArrowUp':
        moveTo(index - 1)
        break
      case 'Home':
        moveTo(0)
        break
      case 'End':
        moveTo(rows.length - 1)
        break
      case 'PageDown':
        moveTo(index + page())
        break
      case 'PageUp':
        moveTo(index - page())
        break
      case 'ArrowRight':
        if (row.itemId !== null && row.isDirectory) {
          if (!row.expanded) onToggle(row.itemId)
          else if (rows[index + 1]?.parentKey === row.key) focusRow(rows[index + 1].key)
        }
        break
      case 'ArrowLeft':
        if (row.itemId !== null && row.isDirectory && row.expanded) onToggle(row.itemId)
        else if (row.parentKey !== null) focusRow(row.parentKey)
        break
      case 'Enter':
      case ' ':
        if (!event.repeat && row.itemId !== null) {
          if (row.isDirectory) onToggle(row.itemId)
          else onSelect(row.itemId)
        }
        break
      default: {
        if (event.key.length !== 1) return
        const buffer = typeAhead.current
        const now = event.timeStamp
        buffer.query = now - buffer.time <= TYPE_AHEAD_MS ? buffer.query + event.key : event.key
        buffer.time = now
        const found = findTypeAhead(rows, index, buffer.query)
        if (found >= 0) focusRow(rows[found].key)
      }
    }
    event.preventDefault()
  }

  const renderRows = (ids: readonly string[], level: number): ReactNode =>
    ids.map((id, index) => {
      const item = items[id]
      const expanded = item.isDirectory && expandedIds.has(id)
      const loading = item.isDirectory && loadingIds.has(id)
      let children: ReactNode = null
      if (expanded) {
        const childList = childIds[id]
        const rowKey = placeholderKey(id)
        const placeholder = (label: string) => (
          <TreePlaceholder
            label={label}
            level={level + 1}
            rowKey={rowKey}
            tabIndex={rowKey === tabStopKey ? 0 : -1}
            onFocusRow={setFocusedKey}
          />
        )
        if (loading) children = placeholder('Loading...')
        else if (childList?.length === 0) children = placeholder('Empty folder')
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
          tabIndex={id === tabStopKey ? 0 : -1}
          onFocusRow={setFocusedKey}
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
    <ul ref={listRef} className="tree" role="tree" aria-label="File tree" onKeyDown={handleKeyDown}>
      {renderRows(rootIds, 1)}
    </ul>
  )
}
