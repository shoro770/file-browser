import { describe, expect, it } from 'vitest'
import { clampTreeWidth, nextTreeWidth, treeWidthBounds } from './layout'

describe('treeWidthBounds', () => {
  it('uses 220 to 480 in a wide window', () => {
    expect(treeWidthBounds(1200)).toEqual({ min: 220, max: 480 })
  })
  it('limits max to 40% of the window', () => {
    expect(treeWidthBounds(1000).max).toBe(400)
    expect(treeWidthBounds(800).max).toBe(320)
    expect(treeWidthBounds(600).max).toBe(240)
  })
  it('lets the minimum win in a narrow window', () => {
    expect(treeWidthBounds(500)).toEqual({ min: 220, max: 220 })
    expect(treeWidthBounds(100).max).toBe(220)
  })
})

describe('clampTreeWidth', () => {
  it('raises a width below the minimum', () => {
    expect(clampTreeWidth(100, 1200)).toBe(220)
  })
  it('lowers a width above the maximum', () => {
    expect(clampTreeWidth(700, 1000)).toBe(400)
  })
  it('keeps a width in range', () => {
    expect(clampTreeWidth(300, 1200)).toBe(300)
  })
})

describe('nextTreeWidth', () => {
  it('steps by 16 and by 64 with Shift', () => {
    expect(nextTreeWidth(280, 'ArrowRight', false, 1200)).toBe(296)
    expect(nextTreeWidth(280, 'ArrowRight', true, 1200)).toBe(344)
    expect(nextTreeWidth(280, 'ArrowLeft', false, 1200)).toBe(264)
  })
  it('jumps to the limits with Home and End', () => {
    expect(nextTreeWidth(280, 'Home', false, 1200)).toBe(220)
    expect(nextTreeWidth(280, 'End', false, 1200)).toBe(480)
  })
  it('resets to 280 with Enter', () => {
    expect(nextTreeWidth(400, 'Enter', false, 1200)).toBe(280)
  })
  it('clamps at the ends', () => {
    expect(nextTreeWidth(225, 'ArrowLeft', true, 1200)).toBe(220)
    expect(nextTreeWidth(470, 'ArrowRight', true, 1200)).toBe(480)
  })
  it('ignores other keys', () => {
    expect(nextTreeWidth(280, 'a', false, 1200)).toBeNull()
  })
})
