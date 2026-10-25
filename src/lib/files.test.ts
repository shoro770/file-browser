import { describe, expect, it } from 'vitest'
import { compareFileItems } from './files'

const dir = (name: string) => ({ name, isDirectory: true })
const file = (name: string) => ({ name, isDirectory: false })

describe('compareFileItems', () => {
  it('lists folders first, then natural case-insensitive order', () => {
    const items = [file('b.txt'), dir('Zeta'), file('a10'), file('a2'), dir('alpha')]
    const names = [...items].sort(compareFileItems).map((item) => item.name)
    expect(names).toEqual(['alpha', 'Zeta', 'a2', 'a10', 'b.txt'])
  })
})
