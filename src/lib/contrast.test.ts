import { describe, expect, it } from 'vitest'
import { blendOver, contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('gives 21 for black on white and 1 for identical colours', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBe(21)
    expect(contrastRatio('#808080', '#808080')).toBe(1)
  })

  it('matches known WCAG pairs', () => {
    expect(contrastRatio('#777777', '#FFFFFF')).toBe(4.48)
    expect(contrastRatio('#767676', '#FFFFFF')).toBe(4.54)
    expect(contrastRatio('#0E1115', '#FFFFFF')).toBe(18.92)
  })

  it('ignores argument order and hex case', () => {
    expect(contrastRatio('#1D4ED8', '#FFFFFF')).toBe(contrastRatio('#FFFFFF', '#1D4ED8'))
    expect(contrastRatio('#1d4ed8', '#ffffff')).toBe(contrastRatio('#1D4ED8', '#FFFFFF'))
  })

  it('rounds to 2 places by default and can stay unrounded', () => {
    const raw = contrastRatio('#777777', '#FFFFFF', null)
    expect(raw).not.toBe(4.48)
    expect(raw).toBeCloseTo(4.48, 2)
    expect(contrastRatio('#777777', '#FFFFFF', 0)).toBe(4)
  })

  it('throws on malformed colours', () => {
    for (const bad of ['red', '#FFF', '', '#GGGGGG', 'FFFFFF']) {
      expect(() => contrastRatio(bad, '#FFFFFF')).toThrow(/#RRGGBB/)
      expect(() => contrastRatio('#FFFFFF', bad)).toThrow(/#RRGGBB/)
    }
  })
})

describe('blendOver', () => {
  it('blends at partial opacity', () => {
    expect(blendOver('#000000', '#FFFFFF', 0.6)).toBe('#666666')
  })

  it('returns the foreground at 1 and the background at 0', () => {
    expect(blendOver('#1D4ED8', '#FFFFFF', 1)).toBe('#1D4ED8')
    expect(blendOver('#1D4ED8', '#ffffff', 0)).toBe('#FFFFFF')
  })

  it('throws on a malformed colour or an alpha outside 0 to 1', () => {
    expect(() => blendOver('red', '#FFFFFF', 0.5)).toThrow(/#RRGGBB/)
    expect(() => blendOver('#000000', '#FFF', 0.5)).toThrow(/#RRGGBB/)
    expect(() => blendOver('#000000', '#FFFFFF', 1.1)).toThrow(/alpha/)
    expect(() => blendOver('#000000', '#FFFFFF', Number.NaN)).toThrow(/alpha/)
  })
})
