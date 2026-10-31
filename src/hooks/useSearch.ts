import { useEffect, useMemo, useState } from 'react'
import { buildSearchView, compileMatcher } from '../lib/search'
import { crawlWorkspace } from '../services/search'
import type { CompiledSearch, FileItem, SearchMatcher, SearchOptions, SearchView } from '../types'

/** Longest wait, in ms, before crawled entries are added to the results. */
const FLUSH_MS = 100

/** How long typing pauses before the query is applied. */
const DEBOUNCE_MS = 120

const DEFAULT_OPTIONS: SearchOptions = { matchCase: false, wholeWord: false, regex: false }
const NO_VIEW: SearchView = { items: {}, rootIds: [], childIds: {}, expandedIds: new Set(), matchCount: 0 }

/**
 * Search state: query and modes, a debounced read-only crawl of the Workspace Folder, and the
 * filtered tree it yields as entries arrive. The crawl starts with the first non-empty query
 * and is cancelled when the query is cleared; a new folder or a completed Refresh restarts it
 * so results are never stale. An invalid regex keeps the last good results.
 *
 * @param workspace - Top-level ids of the open folder; a new array means a new folder.
 * @param refreshCount - Bumped by every Refresh.
 * @returns The query, modes, setters, `active`, the derived `view`, the matcher (for highlights),
 * `invalid`, and `statusText` ("Searching...", "N matches", "No matches", or '').
 */
export function useSearch(workspace: readonly string[], refreshCount: number) {
  const [query, setQueryState] = useState('')
  const [applied, setApplied] = useState('')
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_OPTIONS)
  const [entries, setEntries] = useState<readonly FileItem[]>([])
  const [crawling, setCrawling] = useState(false)
  const [lastGood, setLastGood] = useState<SearchMatcher | null>(null)

  const active = applied !== ''

  useEffect(() => {
    if (query === '') return
    const timer = setTimeout(() => setApplied(query), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    setEntries([])
    setCrawling(true)
    let pending: FileItem[] = []
    let timer: ReturnType<typeof setTimeout> | undefined
    /** Adds the entries gathered so far in one update, not one per folder. */
    const flush = () => {
      timer = undefined
      if (controller.signal.aborted || pending.length === 0) return
      const batch = pending
      pending = []
      setEntries((previous) => previous.concat(batch))
    }
    void (async () => {
      try {
        for await (const batch of crawlWorkspace(controller.signal)) {
          if (controller.signal.aborted) return
          pending.push(...batch)
          timer ??= setTimeout(flush, FLUSH_MS)
        }
      } catch {
        // An unexpected failure ends the crawl with what was found.
      }
      clearTimeout(timer)
      flush()
      if (!controller.signal.aborted) setCrawling(false)
    })()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [active, workspace, refreshCount])

  const compiled: CompiledSearch = useMemo(() => compileMatcher(applied, options), [applied, options])
  if (active && compiled.ok && compiled !== lastGood) setLastGood(compiled)
  const matcher = active ? (compiled.ok ? compiled : lastGood) : null

  const view = useMemo(() => {
    if (!matcher) return NO_VIEW
    const ids = new Set(entries.filter((entry) => matcher.matches(entry.name)).map((entry) => entry.id))
    return buildSearchView(entries, ids)
  }, [entries, matcher])

  const invalid = active && !compiled.ok
  let statusText = ''
  if (active && !invalid) {
    if (crawling) statusText = 'Searching...'
    else if (view.matchCount === 0) statusText = 'No matches'
    else statusText = view.matchCount === 1 ? '1 match' : `${view.matchCount} matches`
  }

  /** Sets the box text; emptying it applies at once, so the normal tree returns without delay. */
  function setQuery(next: string): void {
    setQueryState(next)
    if (next !== '') return
    setApplied('')
    setEntries([])
    setCrawling(false)
    setLastGood(null)
  }

  return { query, options, setQuery, setOptions, active, view, matcher, invalid, crawling, statusText }
}
