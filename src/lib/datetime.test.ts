import { describe, expect, it } from 'vitest'
import { formatModified, toIsoDateTime } from './datetime'

// Local-time constructors keep these tests independent of the machine's time zone.
const now = new Date(2026, 9, 25, 15, 0)

describe('formatModified', () => {
  it('says Today for the same day', () => {
    expect(formatModified(new Date(2026, 9, 25, 11, 4), now)).toBe('Today at 11:04 AM')
  })
  it('says Yesterday for the previous day', () => {
    expect(formatModified(new Date(2026, 9, 24, 16, 30), now)).toBe('Yesterday at 4:30 PM')
  })
  it('uses the full date for older days', () => {
    expect(formatModified(new Date(2026, 9, 21, 15, 12), now)).toBe('Oct 21, 2026 at 3:12 PM')
    expect(formatModified(new Date(2026, 9, 23, 9, 5), now)).toBe('Oct 23, 2026 at 9:05 AM')
  })
  it('handles the midnight boundaries', () => {
    expect(formatModified(new Date(2026, 9, 25, 0, 0), now)).toBe('Today at 12:00 AM')
    expect(formatModified(new Date(2026, 9, 24, 23, 59), now)).toBe('Yesterday at 11:59 PM')
    expect(formatModified(new Date(2026, 9, 23, 23, 59), now)).toBe('Oct 23, 2026 at 11:59 PM')
  })
  it('handles noon', () => {
    expect(formatModified(new Date(2026, 9, 25, 12, 0), now)).toBe('Today at 12:00 PM')
  })
  it('crosses month and year boundaries', () => {
    expect(formatModified(new Date(2026, 9, 31, 8, 0), new Date(2026, 10, 1, 0, 5))).toBe('Yesterday at 8:00 AM')
    expect(formatModified(new Date(2025, 11, 31, 8, 0), new Date(2026, 0, 1, 9, 0))).toBe('Yesterday at 8:00 AM')
  })
  it('does not call a future time Yesterday', () => {
    expect(formatModified(new Date(2026, 9, 26, 8, 0), now)).toBe('Oct 26, 2026 at 8:00 AM')
  })
})

describe('toIsoDateTime', () => {
  it('returns an ISO string', () => {
    expect(toIsoDateTime(new Date(Date.UTC(2026, 9, 25, 11, 4)))).toBe('2026-10-25T11:04:00.000Z')
  })
})
