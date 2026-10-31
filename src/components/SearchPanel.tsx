import { useEffect, useRef, useState } from 'react'
import { useSearch } from '../hooks/useSearch'
import type { SearchPanelProps } from '../types'
import SearchBox from './SearchBox'
import Tree from './Tree'

const NONE: ReadonlySet<string> = new Set()

/**
 * The tree pane's search: the box on top, then either `children` (the normal tree) while the
 * query is empty or a filtered tree of matches and their expanded ancestors. Results not yet
 * loaded are revealed before they are selected. The count goes to the status region.
 */
export default function SearchPanel({
  workspace,
  refreshCount,
  selectedId,
  reveal,
  onSelect,
  onFollow,
  onAnnounce,
  children,
}: SearchPanelProps) {
  const search = useSearch(workspace, refreshCount)
  const { view, matcher, statusText } = search
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(NONE)
  const [lastQuery, setLastQuery] = useState(search.query)
  const latest = useRef(0)

  // A new query shows its folders expanded again.
  if (lastQuery !== search.query) {
    setLastQuery(search.query)
    setCollapsed(NONE)
  }

  useEffect(() => {
    if (statusText !== '') onAnnounce(statusText)
  }, [statusText, onAnnounce])

  /** Reveals a result, then runs `act`; a newer pick supersedes an older one still loading. */
  function pick(id: string, act: () => void) {
    const ticket = ++latest.current
    void reveal(id).then((loaded) => {
      if (loaded && ticket === latest.current) act()
    })
  }

  function handleToggle(id: string) {
    if (!view.expandedIds.has(id)) return
    setCollapsed((previous) => {
      const next = new Set(previous)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const expandedIds = new Set([...view.expandedIds].filter((id) => !collapsed.has(id)))

  if (workspace.length === 0) return <>{children}</>

  let body = children
  if (search.active) {
    body =
      view.rootIds.length > 0 && (
        <Tree
          key="search"
          items={view.items}
          rootIds={view.rootIds}
          childIds={view.childIds}
          expandedIds={expandedIds}
          loadingIds={NONE}
          unavailableIds={NONE}
          showDotfiles
          onToggle={handleToggle}
          onSelect={(id) => pick(id, () => onSelect(id, view.items[id]))}
          onFollow={(id) => pick(id, () => onFollow(id))}
          selectedId={selectedId}
          focusToken={0}
          highlight={matcher ? (name) => matcher.ranges(name) : undefined}
        />
      )
  }

  return (
    <>
      <SearchBox
        query={search.query}
        options={search.options}
        invalid={search.invalid}
        statusText={statusText}
        onQueryChange={search.setQuery}
        onOptionsChange={search.setOptions}
        onClear={() => search.setQuery('')}
      />
      {body}
    </>
  )
}
