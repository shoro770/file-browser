/**
 * Human-readable formatting helpers for file metadata.
 */

/** Bytes per unit step. Binary (1024), matching `ls -lh` and `du -h`. */
const STEP = 1024

/** Units above bytes, in ascending order; each is `STEP` times the previous. */
const UNITS = ['KB', 'MB', 'GB', 'TB'] as const

/**
 * Formats a byte count as a short human-readable size.
 *
 * - Under 1 KB the exact count is shown: `"0 bytes"`, `"1 byte"`, `"842 bytes"`.
 * - From 1 KB up, the largest fitting unit with one decimal: `"1.2 MB"`, `"14.0 GB"`.
 * - Negative values (e.g. a size change) keep their sign: `"-1.5 KB"`.
 *
 * @param bytes - Size in bytes; fractional values are rounded to whole bytes.
 * @returns The formatted size.
 * @throws {RangeError} If `bytes` is `NaN` or infinite.
 */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes)) {
    throw new RangeError(`formatSize: expected a finite number, got ${bytes}`)
  }

  const abs = Math.round(Math.abs(bytes))
  // Decide the sign after rounding so -0 and -0.4 print as "0 bytes", not "-0 bytes".
  const sign = bytes < 0 && abs > 0 ? '-' : ''

  if (abs < STEP) {
    return `${sign}${abs} ${abs === 1 ? 'byte' : 'bytes'}`
  }

  let value = abs / STEP
  let unit = 0
  // Step up while the value would display as 1024.0 or more, so 1048575 bytes
  // reads "1.0 MB" instead of "1024.0 KB".
  while (unit < UNITS.length - 1 && Number(value.toFixed(1)) >= STEP) {
    value /= STEP
    unit++
  }

  return `${sign}${value.toFixed(1)} ${UNITS[unit]}`
}
