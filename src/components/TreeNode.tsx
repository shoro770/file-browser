import { glyphForName } from '../lib/tree'
import type { TreeNodeProps, TreePlaceholderProps } from '../types'
import Glyph, { Chevron, Spinner, Warning } from './Glyph'

/** Id of the shared visually hidden description that unavailable rows point to. */
export const UNAVAILABLE_DESCRIPTION_ID = 'tree-unavailable-description'

/** Text of the shared description. */
export const UNAVAILABLE_DESCRIPTION = "Unavailable, can't be read"

/** One 16px indent step per level above the first, drawn as spacer elements (no inline style). */
function Indent({ level }: { level: number }) {
  return Array.from({ length: level - 1 }, (_, index) => (
    <span key={index} className="tree-row__indent" aria-hidden="true" />
  ))
}

/** A disabled, non-selectable row such as "Loading..." or "Empty folder". */
export function TreePlaceholder({ label, level, rowKey, tabIndex, onFocusRow }: TreePlaceholderProps) {
  return (
    <li
      className="tree-item"
      role="treeitem"
      aria-level={level}
      aria-setsize={1}
      aria-posinset={1}
      aria-disabled="true"
      tabIndex={tabIndex}
      data-key={rowKey}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onFocusRow(rowKey)
      }}
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
  unavailable,
  onToggle,
  onSelect,
  children,
}: TreeNodeProps) {
  function activate() {
    if (item.isDirectory) onToggle(item.id)
    else onSelect(item.id)
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
      aria-describedby={unavailable ? UNAVAILABLE_DESCRIPTION_ID : undefined}
      tabIndex={tabIndex}
      data-key={item.id}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onFocusRow(item.id)
      }}
    >
      <div
        className={classes.join(' ')}
        title={item.name}
        onClick={activate}
      >
        <Indent level={level} />
        <span className="tree-row__twisty">
          {item.isDirectory && (loading ? <Spinner /> : <Chevron />)}
        </span>
        <Glyph kind={glyphForName(item.name, item.isDirectory)} />
        <span className="tree-row__label">{item.name}</span>
        {unavailable && (
          <span className="tree-row__suffix" aria-hidden="true">
            <Warning />
            Unavailable
          </span>
        )}
      </div>
      {item.isDirectory && expanded && children && (
        <ul className="tree-group" role="group">
          {children}
        </ul>
      )}
    </li>
  )
}
