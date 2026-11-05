import type { MouseEvent, ReactNode } from 'react'
import { splitName } from '../lib/files'
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

/** `text` (starting at `offset` in the full name) with each overlapping matched range wrapped in a `<mark>`. */
function marked(text: string, offset: number, ranges: TreeNodeProps['ranges']): ReactNode[] {
  const parts: ReactNode[] = []
  let at = 0
  for (const [rangeStart, rangeEnd] of ranges ?? []) {
    const start = Math.max(rangeStart - offset, 0)
    const end = Math.min(rangeEnd - offset, text.length)
    if (end <= start) continue
    if (start > at) parts.push(text.slice(at, start))
    parts.push(<mark key={start}>{text.slice(start, end)}</mark>)
    at = end
  }
  if (at < text.length) parts.push(text.slice(at))
  return parts
}

/**
 * The name as a shrinkable stem and a fixed extension, so a long name is cut in the middle and
 * the extension stays visible. Each matched range is wrapped in a `<mark>`; the text itself is unchanged.
 */
function nameParts(name: string, isDirectory: boolean, ranges: TreeNodeProps['ranges']) {
  const [stem, extension] = isDirectory ? [name, ''] : splitName(name)
  return (
    <>
      <span className="tree-row__stem">{marked(stem, 0, ranges)}</span>
      {extension !== '' && <span className="tree-row__ext">{marked(extension, stem.length, ranges)}</span>}
    </>
  )
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
  dotfile,
  onToggle,
  onSelect,
  ranges,
  children,
}: TreeNodeProps) {
  function activate() {
    if (item.isDirectory) onToggle(item.id)
    onSelect(item.id)
  }

  /** Lets CSS show the full name quickly, only when the stem is actually cut. */
  function markIfTruncated(event: MouseEvent<HTMLDivElement>) {
    const stem = event.currentTarget.querySelector<HTMLElement>('.tree-row__stem')
    event.currentTarget.classList.toggle('is-truncated', stem !== null && stem.scrollWidth > stem.clientWidth)
  }

  const classes = ['tree-row']
  if (selected) classes.push('is-selected')
  if (expanded) classes.push('is-expanded')
  if (dotfile) classes.push('tree-row--dotfile')

  return (
    <li
      className="tree-item"
      role="treeitem"
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={item.isDirectory ? expanded : undefined}
      aria-selected={selected}
      aria-describedby={unavailable ? UNAVAILABLE_DESCRIPTION_ID : undefined}
      tabIndex={tabIndex}
      data-key={item.id}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onFocusRow(item.id)
      }}
    >
      <div
        className={classes.join(' ')}
        data-full-name={item.name}
        onMouseEnter={markIfTruncated}
        onClick={activate}
      >
        <Indent level={level} />
        <span className="tree-row__twisty">
          {item.isDirectory && (loading ? <Spinner /> : <Chevron />)}
        </span>
        <Glyph kind={glyphForName(item.name, item.isDirectory)} />
        <span className="tree-row__label">{nameParts(item.name, item.isDirectory, ranges)}</span>
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
