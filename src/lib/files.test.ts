import { describe, expect, it } from 'vitest'
import { compareFileItems, extensionOf, fileExtensions, splitName } from './files'

const dir = (name: string) => ({ name, isDirectory: true })
const file = (name: string) => ({ name, isDirectory: false })

describe('compareFileItems', () => {
  it('lists folders first, then natural case-insensitive order', () => {
    const items = [file('b.txt'), dir('Zeta'), file('a10'), file('a2'), dir('alpha')]
    const names = [...items].sort(compareFileItems).map((item) => item.name)
    expect(names).toEqual(['alpha', 'Zeta', 'a2', 'a10', 'b.txt'])
  })
})

describe('splitName', () => {
  it('keeps the extension apart', () => {
    expect(splitName('report.final.pdf')).toEqual(['report.final', '.pdf'])
  })
  it('does not split names without an extension, dotfiles or a trailing dot', () => {
    expect(splitName('Makefile')).toEqual(['Makefile', ''])
    expect(splitName('.env')).toEqual(['.env', ''])
    expect(splitName('archive.')).toEqual(['archive.', ''])
  })
  it('does not split a very long tail', () => {
    expect(splitName('a.thisisnotanextension')).toEqual(['a.thisisnotanextension', ''])
  })
  it('always joins back to the name', () => {
    for (const name of ['a.b', 'x.tar.gz', '.a.b', 'noext']) expect(splitName(name).join('')).toBe(name)
  })
})

describe('extensionOf and fileExtensions', () => {
  it('lower-cases the extension and has none for dotfiles or bare names', () => {
    expect(extensionOf('Report.PDF')).toBe('pdf')
    expect(extensionOf('archive.tar.gz')).toBe('gz')
    expect(extensionOf('.env')).toBe('')
    expect(extensionOf('Makefile')).toBe('')
  })
  it('lists each extension once, sorted, ignoring folders and extensionless files', () => {
    const items = {
      a: { name: 'a.PDF', isDirectory: false },
      b: { name: 'b.pdf', isDirectory: false },
      c: { name: 'c.html', isDirectory: false },
      d: { name: 'v1.2', isDirectory: true },
      e: { name: 'Makefile', isDirectory: false },
    }
    expect(fileExtensions(items)).toEqual(['html', 'pdf'])
  })
})
