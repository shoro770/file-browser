/**
 * Date formatting for the Preview Header and Metadata Card.
 */

/** Month names, English, abbreviated. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** Formats a time as 12-hour clock, e.g. `"4:30 PM"`. */
function clock(date: Date): string {
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`
}

/** Gets the calendar day number of a date in local time. */
function dayNumber(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
}

/**
 * Formats a last-modified time relative to now, in the viewer's local time.
 *
 * @param updatedAt - The modification time.
 * @param now - The current time (passed in so the function stays pure).
 * @returns `"Today at 11:04 AM"`, `"Yesterday at 4:30 PM"`, or `"Oct 21, 2026 at 3:12 PM"` for any other day.
 */
export function formatModified(updatedAt: Date, now: Date): string {
  const days = dayNumber(now) - dayNumber(updatedAt)
  if (days === 0) return `Today at ${clock(updatedAt)}`
  if (days === 1) return `Yesterday at ${clock(updatedAt)}`
  return `${MONTHS[updatedAt.getMonth()]} ${updatedAt.getDate()}, ${updatedAt.getFullYear()} at ${clock(updatedAt)}`
}

/**
 * Formats a time for a `<time datetime>` attribute.
 *
 * @param date - The time.
 * @returns The ISO 8601 string in UTC.
 */
export function toIsoDateTime(date: Date): string {
  return date.toISOString()
}
