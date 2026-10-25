import { describe, expect, it } from 'vitest'
import type { FileItem } from '../types'
import { findTypeAhead, glyphForName, pageStep, parentId, placeholderKey, toId, toPath, visibleRows } from './tree'

describe('parentId', () => {
  it('is the root for top-level ids', () => {
    expect(parentId('src')).toBe('')
    expect(parentId('')).toBe('')
  })
  it('drops the last segment', () => {
    expect(parentId('src/lib/tree.ts')).toBe('src/lib')
  })
  it('inverts toId', () => {
    expect(parentId(toId('a/b', 'c'))).toBe('a/b')
  })
})

describe('toId', () => {
  it('uses the bare name under the root', () => {
    expect(toId('', 'src')).toBe('src')
  })
  it('joins with a single slash', () => {
    expect(toId('src/lib', 'tree.ts')).toBe('src/lib/tree.ts')
  })
  it('gives identical ids on repeat reads', () => {
    expect(toId('a', 'b')).toBe(toId('a', 'b'))
  })
})

describe('toPath', () => {
  it('prefixes a slash', () => {
    expect(toPath('')).toBe('/')
    expect(toPath('src/a.ts')).toBe('/src/a.ts')
  })
})

describe('glyphForName', () => {
  it.each([
    ['proj', true, 'folder'],
    ['photo.PNG', false, 'image'],
    ['a.pdf', false, 'pdf'],
    ['a.docx', false, 'document'],
    ['notes.md', false, 'text'],
    ['Makefile', false, 'text'],
    ['.env.local', false, 'text'],
    ['a.zip', false, 'binary'],
    ['a.xyz', false, 'file'],
    ['noext', false, 'file'],
  ] as const)('%s (dir=%s) -> %s', (name, isDirectory, expected) => {
    expect(glyphForName(name, isDirectory)).toBe(expected)
  })
})

const file = (id: string): FileItem => ({ id, name: id.split('/').pop()!, path: `/${id}`, isDirectory: false })
const dir = (id: string): FileItem => ({ ...file(id), isDirectory: true })

describe('visibleRows', () => {
  const items = { a: dir('a'), 'a/x': file('a/x'), b: dir('b'), c: dir('c'), d: file('d') }
  const rootIds = ['a', 'b', 'c', 'd']

  it('lists only top-level rows when nothing is expanded', () => {
    const rows = visibleRows(items, rootIds, {}, new Set(), new Set(), new Set())
    expect(rows.map((r) => r.key)).toEqual(['a', 'b', 'c', 'd'])
    expect(rows[0].parentKey).toBeNull()
  })
  it('includes children of expanded folders with parent keys', () => {
    const rows = visibleRows(items, rootIds, { a: ['a/x'] }, new Set(['a']), new Set(), new Set())
    expect(rows.map((r) => r.key)).toEqual(['a', 'a/x', 'b', 'c', 'd'])
    expect(rows[1].parentKey).toBe('a')
    expect(rows[0].expanded).toBe(true)
  })
  it('adds an Empty folder placeholder', () => {
    const rows = visibleRows(items, rootIds, { b: [] }, new Set(['b']), new Set(), new Set())
    expect(rows[2]).toMatchObject({ key: placeholderKey('b'), itemId: null, parentKey: 'b' })
  })
  it('keeps a file named like a placeholder distinct from the placeholder key', () => {
    expect(placeholderKey('x')).not.toBe('placeholder:x')
  })
  it('adds a loading placeholder when loading', () => {
    const rows = visibleRows(items, rootIds, {}, new Set(['c']), new Set(['c']), new Set())
    expect(rows.map((r) => r.key)).toContain(placeholderKey('c'))
  })
  it('adds a placeholder for an expanded unavailable folder, none when collapsed', () => {
    const open = visibleRows(items, rootIds, {}, new Set(['c']), new Set(), new Set(['c']))
    expect(open.map((r) => r.key)).toEqual(['a', 'b', 'c', placeholderKey('c'), 'd'])
    expect(open[3]).toMatchObject({ itemId: null, parentKey: 'c' })
    const closed = visibleRows(items, rootIds, {}, new Set(), new Set(), new Set(['c']))
    expect(closed).toHaveLength(4)
  })
  it('adds nothing for an expanded folder not yet listed or loading', () => {
    const rows = visibleRows(items, rootIds, {}, new Set(['c']), new Set(), new Set())
    expect(rows).toHaveLength(4)
  })
})

describe('findTypeAhead', () => {
  // rows: e, placeholder:e, readme, report, src
  const rows = visibleRows(
    { readme: file('readme'), report: file('report'), src: dir('src'), e: dir('e') },
    ['e', 'readme', 'report', 'src'],
    { e: [] },
    new Set(['e']),
    new Set(),
    new Set(),
  )
  it('starts after the focused row for one character', () => {
    expect(findTypeAhead(rows, 2, 'r')).toBe(3)
  })
  it('wraps around', () => {
    expect(findTypeAhead(rows, 3, 'r')).toBe(2)
  })
  it('starts at the focused row for longer queries', () => {
    expect(findTypeAhead(rows, 2, 're')).toBe(2)
    expect(findTypeAhead(rows, 2, 'rep')).toBe(3)
  })
  it('is case-insensitive', () => {
    expect(findTypeAhead(rows, 0, 'S')).toBe(4)
  })
  it('returns -1 with no match', () => {
    expect(findTypeAhead(rows, 0, 'zz')).toBe(-1)
  })
  it('never matches placeholders or an empty query', () => {
    expect(findTypeAhead(rows, 0, '')).toBe(-1)
    expect(findTypeAhead(rows, 4, 'p')).toBe(-1)
  })
})

describe('pageStep', () => {
  it('floors the row count', () => {
    expect(pageStep(290, 28)).toBe(10)
  })
  it('is at least one', () => {
    expect(pageStep(10, 28)).toBe(1)
    expect(pageStep(0, 28)).toBe(1)
  })
})
