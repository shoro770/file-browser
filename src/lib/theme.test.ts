import { describe, expect, it } from 'vitest'
import { parseTheme, resolveTheme } from './theme'

describe('parseTheme', () => {
  it('accepts the three theme names', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('dark')).toBe('dark')
    expect(parseTheme('sand')).toBe('sand')
  })

  it('rejects anything else', () => {
    for (const value of ['purple', 'Light', '', null, undefined, 3, {}]) expect(parseTheme(value)).toBeNull()
  })
})

describe('resolveTheme', () => {
  it('prefers a valid stored theme over the system setting', () => {
    expect(resolveTheme('sand', true)).toBe('sand')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('follows the system setting when nothing valid is stored, and never picks sand', () => {
    expect(resolveTheme(null, true)).toBe('dark')
    expect(resolveTheme(null, false)).toBe('light')
    expect(resolveTheme('purple', true)).toBe('dark')
    expect(resolveTheme('purple', false)).toBe('light')
  })
})
