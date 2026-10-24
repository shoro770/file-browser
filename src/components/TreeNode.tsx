import type { KeyboardEvent } from 'react'
import { glyphForName } from '../lib/tree'
import type { TreeNodeProps, TreePlaceholderProps } from '../types'
import Glyph, { Chevron, Spinner } from './Glyph'

/** One 16px indent step per level above the first, drawn as spacer elements (no inline style). */
function Indent({ level }: { level: number }) {
  return Array.from({ length: level - 1 }, (_, index) => (
    <span key={index} className="tree-row__indent" aria-hidden="true" />
  ))
}

/** A disabled, non-selectable row such as "Loading..." or "Empty folder". */
export function TreePlaceholder({ label, level }: TreePlaceholderProps) {
  return (
    <li
      className="tree-item"
      role="treeitem"
      aria-level={level}
      aria-setsize={1}
      aria-posinset={1}
      aria-disabled="true"
      tabIndex={-1}
    >
      <div className="tree-row tree-row--placeholder">
        <Indent level={level} />
        <span className="tree-row__twisty" />
        <span className="tree-row__label">{label}</span>
      </div>
    </li>
  )
}

/**
 * One row of the tree: indent, chevron (folders), kind glyph and truncating label, plus
 * the folder's children inside a `role="group"`. Roving tabindex comes from `Tree`.
 */
export default function TreeNode({
  item,
  level,
  setSize,
  posInSet,
  selected,
  tabIndex,
  onFocusRow,
  expanded,
  loading,
  onToggle,
  children,
}: TreeNodeProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (item.isDirectory && !event.repeat) onToggle(item.id)
    } else if (event.key === 'ArrowRight' && item.isDirectory && !expanded) {
      event.preventDefault()
      onToggle(item.id)
    }
  }

  const classes = ['tree-row']
  if (selected) classes.push('is-selected')
  if (expanded) classes.push('is-expanded')

  return (
    <li
      className="tree-item"
      role="treeitem"
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={item.isDirectory ? expanded : undefined}
      aria-selected={item.isDirectory ? undefined : selected}
      tabIndex={tabIndex}
      data-id={item.id}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onFocusRow(item.id)
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className={classes.join(' ')}
        title={item.name}
        onClick={item.isDirectory ? () => onToggle(item.id) : undefined}
      >
        <Indent level={level} />
        <span className="tree-row__twisty">
          {item.isDirectory && (loading ? <Spinner /> : <Chevron />)}
        </span>
        <Glyph kind={glyphForName(item.name, item.isDirectory)} />
        <span className="tree-row__label">{item.name}</span>
      </div>
      {item.isDirectory && expanded && children && (
        <ul className="tree-group" role="group">
          {children}
        </ul>
      )}
    </li>
  )
}
