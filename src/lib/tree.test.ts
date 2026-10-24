import { describe, expect, it } from 'vitest'
import { glyphForName, parentId, toId, toPath } from './tree'

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
