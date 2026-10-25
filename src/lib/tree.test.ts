import { describe, expect, it } from 'vitest'
import type { FileItem } from '../types'
import {
  filterDotfiles,
  findTypeAhead,
  glyphForName,
  isDotfileId,
  pageStep,
  parentId,
  placeholderKey,
  previousVisibleKey,
  toId,
  toPath,
  visibleRows,
} from './tree'

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
    const rows = visibleRows(items, rootIds, {}, new Set(), new Set(), new Set(), true)
    expect(rows.map((r) => r.key)).toEqual(['a', 'b', 'c', 'd'])
    expect(rows[0].parentKey).toBeNull()
  })
  it('includes children of expanded folders with parent keys', () => {
    const rows = visibleRows(items, rootIds, { a: ['a/x'] }, new Set(['a']), new Set(), new Set(), true)
    expect(rows.map((r) => r.key)).toEqual(['a', 'a/x', 'b', 'c', 'd'])
    expect(rows[1].parentKey).toBe('a')
    expect(rows[0].expanded).toBe(true)
  })
  it('adds an Empty folder placeholder', () => {
    const rows = visibleRows(items, rootIds, { b: [] }, new Set(['b']), new Set(), new Set(), true)
    expect(rows[2]).toMatchObject({ key: placeholderKey('b'), itemId: null, parentKey: 'b' })
  })
  it('keeps a file named like a placeholder distinct from the placeholder key', () => {
    expect(placeholderKey('x')).not.toBe('placeholder:x')
  })
  it('adds a loading placeholder when loading', () => {
    const rows = visibleRows(items, rootIds, {}, new Set(['c']), new Set(['c']), new Set(), true)
    expect(rows.map((r) => r.key)).toContain(placeholderKey('c'))
  })
  it('adds a placeholder for an expanded unavailable folder, none when collapsed', () => {
    const open = visibleRows(items, rootIds, {}, new Set(['c']), new Set(), new Set(['c']), true)
    expect(open.map((r) => r.key)).toEqual(['a', 'b', 'c', placeholderKey('c'), 'd'])
    expect(open[3]).toMatchObject({ itemId: null, parentKey: 'c' })
    const closed = visibleRows(items, rootIds, {}, new Set(), new Set(), new Set(['c']), true)
    expect(closed).toHaveLength(4)
  })
  it('adds nothing for an expanded folder not yet listed or loading', () => {
    const rows = visibleRows(items, rootIds, {}, new Set(['c']), new Set(), new Set(), true)
    expect(rows).toHaveLength(4)
  })

  describe('with dotfiles', () => {
    const dotItems = {
      '.git': dir('.git'),
      '.git/config': file('.git/config'),
      src: dir('src'),
      'src/.env': file('src/.env'),
      'src/a.ts': file('src/a.ts'),
      lib: dir('lib'),
      'lib/.keep': file('lib/.keep'),
      '.env': file('.env'),
    }
    const dotRoot = ['.git', 'src', 'lib', '.env']
    const dotChildren = { '.git': ['.git/config'], src: ['src/.env', 'src/a.ts'], lib: ['lib/.keep'] }
    const all = new Set(['.git', 'src', 'lib'])

    it('keeps dotfiles when shown', () => {
      const rows = visibleRows(dotItems, dotRoot, dotChildren, all, new Set(), new Set(), true)
      expect(rows.map((r) => r.key)).toEqual([
        '.git', '.git/config', 'src', 'src/.env', 'src/a.ts', 'lib', 'lib/.keep', '.env',
      ])
    })
    it('drops hidden dotfiles with their subtrees and keeps expansion', () => {
      const rows = visibleRows(dotItems, dotRoot, dotChildren, all, new Set(), new Set(), false)
      expect(rows.map((r) => r.key)).toEqual(['src', 'src/a.ts', 'lib', placeholderKey('lib')])
      expect(rows[0].expanded).toBe(true)
    })
    it('adds a placeholder when every child is hidden, and still for a truly empty folder', () => {
      const rows = visibleRows(dotItems, dotRoot, { ...dotChildren, src: [] }, all, new Set(), new Set(), false)
      expect(rows.map((r) => r.key)).toEqual(['src', placeholderKey('src'), 'lib', placeholderKey('lib')])
    })
  })
})

describe('isDotfileId', () => {
  it('is true for a name or any ancestor beginning with a dot', () => {
    expect(isDotfileId('.env')).toBe(true)
    expect(isDotfileId('src/.env')).toBe(true)
    expect(isDotfileId('.git/objects/ab')).toBe(true)
  })
  it('is false otherwise, including dots inside or after a name', () => {
    expect(isDotfileId('')).toBe(false)
    expect(isDotfileId('src/a.ts')).toBe(false)
    expect(isDotfileId('node_modules/x')).toBe(false)
    expect(isDotfileId('a.b/c.')).toBe(false)
  })
})

describe('previousVisibleKey', () => {
  const keys = ['a', '.b', '.b/x', 'c']
  it('picks the nearest earlier row that is still visible', () => {
    expect(previousVisibleKey(keys, '.b', new Set(['a', 'c']))).toBe('a')
    expect(previousVisibleKey(keys, '.b/x', new Set(['a', 'c']))).toBe('a')
    expect(previousVisibleKey(keys, 'c', new Set(['a', '.b']))).toBe('.b')
  })
  it('is null when the first row goes, nothing earlier survives, or the key is unknown', () => {
    expect(previousVisibleKey(keys, 'a', new Set(['c']))).toBeNull()
    expect(previousVisibleKey(keys, '.b', new Set(['c']))).toBeNull()
    expect(previousVisibleKey(keys, 'zzz', new Set(keys))).toBeNull()
  })
})

describe('filterDotfiles', () => {
  const items = { '.a': file('.a'), b: file('b'), 'x/.c': file('x/.c'), 'x/d': file('x/d') }
  it('returns the same list when dotfiles are shown', () => {
    const ids = ['.a', 'b']
    expect(filterDotfiles(ids, items, true)).toBe(ids)
  })
  it('drops names beginning with a dot when hidden', () => {
    expect(filterDotfiles(['.a', 'b'], items, false)).toEqual(['b'])
    expect(filterDotfiles(['x/.c', 'x/d'], items, false)).toEqual(['x/d'])
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
    true,
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
