import { glyphForName } from '../lib/tree'
import type { TreeNodeProps } from '../types'
import Glyph from './Glyph'

/** One row of the tree: kind glyph and truncating label. Roving tabindex comes from `Tree`. */
export default function TreeNode({
  item,
  level,
  setSize,
  posInSet,
  selected,
  tabIndex,
  onFocusRow,
}: TreeNodeProps) {
  return (
    <li
      className={selected ? 'tree-row is-selected' : 'tree-row'}
      role="treeitem"
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={item.isDirectory ? false : undefined}
      aria-selected={item.isDirectory ? undefined : selected}
      tabIndex={tabIndex}
      data-id={item.id}
      title={item.name}
      onFocus={() => onFocusRow(item.id)}
    >
      <Glyph kind={glyphForName(item.name, item.isDirectory)} />
      <span className="tree-row__label">{item.name}</span>
    </li>
  )
}
