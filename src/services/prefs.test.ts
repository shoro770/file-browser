// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readShowDotfiles, readTheme, systemPrefersDark, writeShowDotfiles, writeTheme } from './prefs'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

/** Makes every localStorage call throw, as when storage is blocked. */
function breakStorage() {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
}

describe('theme preference', () => {
  it('round-trips and writes only the theme key', () => {
    expect(readTheme()).toBeNull()
    writeTheme('sand')
    expect(readTheme()).toBe('sand')
    expect(window.localStorage.length).toBe(1)
    expect(window.localStorage.getItem('theme')).toBe('sand')
    expect(window.localStorage.getItem('showDotfiles')).toBeNull()
  })

  it('returns an invalid stored value untouched for the caller to reject', () => {
    window.localStorage.setItem('theme', 'purple')
    expect(readTheme()).toBe('purple')
  })

  it('does not throw when storage is unavailable', () => {
    breakStorage()
    expect(readTheme()).toBeNull()
    expect(() => writeTheme('dark')).not.toThrow()
  })
})

describe('dotfile preference', () => {
  it('defaults to shown, stores false, and survives broken storage', () => {
    expect(readShowDotfiles()).toBe(true)
    writeShowDotfiles(false)
    expect(readShowDotfiles()).toBe(false)
    breakStorage()
    expect(readShowDotfiles()).toBe(true)
    expect(() => writeShowDotfiles(true)).not.toThrow()
  })
})

describe('systemPrefersDark', () => {
  it('reflects the media query and is false when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(systemPrefersDark()).toBe(true)
    vi.stubGlobal('matchMedia', undefined)
    expect(systemPrefersDark()).toBe(false)
  })
})
