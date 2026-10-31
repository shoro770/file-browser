import { describe, expect, it } from 'vitest'
import type { FileItem, SearchOptions } from '../types'
import { buildSearchView, compileMatcher } from './search'

const OFF: SearchOptions = { matchCase: false, wholeWord: false, regex: false }

/** Names accepted by a query. */
function accepted(query: string, names: string[], options: Partial<SearchOptions> = {}): string[] {
  const compiled = compileMatcher(query, { ...OFF, ...options })
  if (!compiled.ok) throw new Error('invalid')
  return names.filter((name) => compiled.matches(name))
}

describe('compileMatcher', () => {
  it('contains, case-insensitive, dotfiles included', () => {
    expect(accepted('read', ['README.md', '.readme', 'spread', 'other'])).toEqual(['README.md', '.readme', 'spread'])
  })

  it('Match case', () => {
    expect(accepted('read', ['README.md', 'read.md'], { matchCase: true })).toEqual(['read.md'])
  })

  it('wildcards match inside the name', () => {
    expect(accepted('*.test.ts', ['a.test.ts', 'a.test.tsx', 'a.ts'])).toEqual(['a.test.ts', 'a.test.tsx'])
    expect(accepted('a?c', ['abc', 'abcd', 'ac'])).toEqual(['abc', 'abcd'])
    expect(accepted('a.c', ['abc', 'a.c'])).toEqual(['a.c'])
    expect(accepted('file*br', ['file-browser', 'file-system', 'my_file.browser'])).toEqual(['file-browser', 'my_file.browser'])
  })

  it('whole word', () => {
    expect(accepted('log', ['log.txt', 'catalog.txt', 'my-log', 'logs'], { wholeWord: true })).toEqual([
      'log.txt',
      'my-log',
    ])
  })

  it('regex', () => {
    expect(accepted('^\\.env', ['.env', '.env.local', 'x.env'], { regex: true })).toEqual(['.env', '.env.local'])
    expect(accepted('a.c', ['abc'], { regex: true })).toEqual(['abc'])
  })

  it('reports an invalid regex', () => {
    expect(compileMatcher('(', { ...OFF, regex: true })).toEqual({ ok: false })
  })

  it('returns highlight ranges, skipping empty matches', () => {
    const compiled = compileMatcher('a', OFF)
    if (!compiled.ok) throw new Error('invalid')
    expect(compiled.ranges('banana')).toEqual([[1, 2], [3, 4], [5, 6]])
    expect(compiled.ranges('xyz')).toEqual([])
    const empty = compileMatcher('x*', { ...OFF, regex: true })
    if (!empty.ok) throw new Error('invalid')
    expect(empty.ranges('abc')).toEqual([])
  })
})

const file = (id: string): FileItem => ({ id, name: id.split('/').pop()!, path: `/${id}`, isDirectory: false })
const dir = (id: string): FileItem => ({ ...file(id), isDirectory: true })

describe('buildSearchView', () => {
  const entries = [dir('a'), dir('b'), file('z.txt'), file('a/one.txt'), dir('a/deep'), file('a/deep/a.txt'), file('b/x')]

  it('keeps matches and their ancestors, ancestors expanded', () => {
    const view = buildSearchView(entries, new Set(['a/deep/a.txt', 'z.txt']))
    expect(view.rootIds).toEqual(['a', 'z.txt'])
    expect(view.childIds).toEqual({ a: ['a/deep'], 'a/deep': ['a/deep/a.txt'] })
    expect([...view.expandedIds].sort()).toEqual(['a', 'a/deep'])
    expect(view.matchCount).toBe(2)
    expect(Object.keys(view.items).sort()).toEqual(['a', 'a/deep', 'a/deep/a.txt', 'z.txt'])
  })

  it('does not expand a matching folder with no matching children', () => {
    const view = buildSearchView(entries, new Set(['b']))
    expect(view.rootIds).toEqual(['b'])
    expect(view.expandedIds.size).toBe(0)
  })

  it('counts a folder that is both a match and an ancestor once', () => {
    const view = buildSearchView(entries, new Set(['a', 'a/one.txt']))
    expect(view.matchCount).toBe(2)
    expect(view.expandedIds.has('a')).toBe(true)
  })

  it('ignores matches not in the index and handles none', () => {
    expect(buildSearchView(entries, new Set(['nope'])).matchCount).toBe(0)
    expect(buildSearchView([], new Set()).rootIds).toEqual([])
  })
})
