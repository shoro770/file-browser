import { describe, expect, it } from 'vitest'
import { MAX_TEXT_BYTES, trimPartialUtf8, trimToLastLine, truncationNotice } from './text'

describe('trimToLastLine', () => {
  it('leaves untruncated text alone', () => {
    expect(trimToLastLine('a\nb', false)).toBe('a\nb')
  })

  it('drops the partial last line of truncated text', () => {
    expect(trimToLastLine('a\n```js\nlet x', true)).toBe('a\n```js\n')
    expect(trimToLastLine('a\nb\n', true)).toBe('a\nb\n')
  })

  it('keeps a single unbroken line', () => {
    expect(trimToLastLine('one long line', true)).toBe('one long line')
  })

  it('cuts at a lone CR, and never leaves only blank space', () => {
    expect(trimToLastLine('a\rb\rpartial', true)).toBe('a\rb\r')
    expect(trimToLastLine('\nminified-one-line', true)).toBe('\nminified-one-line')
  })
})

const bytes = (...values: number[]) => new Uint8Array(values)

describe('trimPartialUtf8', () => {
  it('keeps complete ASCII and empty input', () => {
    expect(trimPartialUtf8(bytes())).toEqual(bytes())
    expect(trimPartialUtf8(bytes(0x61, 0x62))).toEqual(bytes(0x61, 0x62))
  })

  it('keeps complete multibyte characters', () => {
    expect(trimPartialUtf8(bytes(0x61, 0xc3, 0xa9))).toEqual(bytes(0x61, 0xc3, 0xa9))
    expect(trimPartialUtf8(bytes(0xe2, 0x82, 0xac))).toEqual(bytes(0xe2, 0x82, 0xac))
    expect(trimPartialUtf8(bytes(0xf0, 0x9f, 0x98, 0x80))).toEqual(bytes(0xf0, 0x9f, 0x98, 0x80))
  })

  it('leaves stray continuation bytes alone', () => {
    expect(trimPartialUtf8(bytes(0x80, 0x80, 0x80))).toEqual(bytes(0x80, 0x80, 0x80))
  })

  it('drops a cut two-, three- and four-byte character', () => {
    expect(trimPartialUtf8(bytes(0x61, 0xc3))).toEqual(bytes(0x61))
    expect(trimPartialUtf8(bytes(0x61, 0xe2))).toEqual(bytes(0x61))
    expect(trimPartialUtf8(bytes(0x61, 0xe2, 0x82))).toEqual(bytes(0x61))
    expect(trimPartialUtf8(bytes(0x61, 0xf0))).toEqual(bytes(0x61))
    expect(trimPartialUtf8(bytes(0x61, 0xf0, 0x9f, 0x98))).toEqual(bytes(0x61))
  })
})

describe('truncationNotice', () => {
  it('names the full size', () => {
    expect(MAX_TEXT_BYTES).toBe(1024 * 1024)
    expect(truncationNotice(4.2 * 1024 * 1024)).toBe(
      "Showing the first 1 MB of 4.2 MB. The rest of the file isn't shown.",
    )
  })
})
