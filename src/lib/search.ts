/**
 * Pure search helpers: compile a query into a name matcher, and build the filtered tree.
 */

import type { CompiledSearch, FileItem, SearchOptions, SearchView } from '../types'
import { parentId } from './tree'

/**
 * Escapes text so a regular expression treats it literally.
 *
 * @param text - Literal text.
 * @returns The text with regex metacharacters escaped.
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Turns a wildcard pattern into regex source: `*` is any run, `?` one character, all else literal.
 *
 * @param pattern - The wildcard pattern.
 * @returns Regex source (unanchored).
 */
function wildcardSource(pattern: string): string {
  return [...pattern].map((ch) => (ch === '*' ? '.*' : ch === '?' ? '.' : escapeRegex(ch))).join('')
}

/**
 * Compiles a query into a name matcher. Case-insensitive "contains" by default. With `regex` off,
 * `*` and `?` are wildcards and the pattern then matches the whole name; with `regex` on the
 * query is a JavaScript regular expression. `wholeWord` requires non-alphanumerics (or the name
 * ends) on both sides of a contains or regex match.
 *
 * @param query - The text typed by the user.
 * @param options - Match case, whole word and regex modes.
 * @returns A matcher, or `{ ok: false }` when the regex is invalid.
 */
export function compileMatcher(query: string, options: SearchOptions): CompiledSearch {
  let source: string
  let wholeName = false
  if (options.regex) source = query
  else if (/[*?]/.test(query)) {
    source = `^(?:${wildcardSource(query)})$`
    wholeName = true
  } else source = escapeRegex(query)
  if (options.wholeWord && !wholeName) source = `(?<![A-Za-z0-9])(?:${source})(?![A-Za-z0-9])`
  const flags = options.matchCase ? '' : 'i'
  let test: RegExp
  let global: RegExp
  try {
    test = new RegExp(source, flags)
    global = new RegExp(source, flags + 'g')
  } catch {
    return { ok: false }
  }
  return {
    ok: true,
    matches: (name) => test.test(name),
    ranges: (name) => {
      const found: Array<[number, number]> = []
      for (const match of name.matchAll(global)) {
        if (match[0].length > 0) found.push([match.index, match.index + match[0].length])
      }
      return found
    },
  }
}

/**
 * Builds the filtered tree: the matching entries plus every ancestor folder, ancestors expanded.
 * Sibling order follows the order of `entries`.
 *
 * @param entries - Every crawled entry, each folder before its children.
 * @param matches - Ids of the entries that match.
 * @returns The derived `items`, `rootIds`, `childIds`, `expandedIds` and the match count.
 */
export function buildSearchView(entries: readonly FileItem[], matches: ReadonlySet<string>): SearchView {
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  const shown = new Set<string>()
  const expandedIds = new Set<string>()
  let matchCount = 0
  for (const id of matches) {
    if (!byId.has(id)) continue
    matchCount += 1
    shown.add(id)
    for (let up = parentId(id); up !== ''; up = parentId(up)) {
      if (!byId.has(up)) break
      shown.add(up)
      expandedIds.add(up)
    }
  }
  const items: Record<string, FileItem> = {}
  const rootIds: string[] = []
  const childIds: Record<string, string[]> = {}
  for (const entry of entries) {
    if (!shown.has(entry.id)) continue
    items[entry.id] = entry
    const parent = parentId(entry.id)
    if (parent === '') rootIds.push(entry.id)
    else (childIds[parent] ??= []).push(entry.id)
  }
  return { items, rootIds, childIds, expandedIds, matchCount }
}
