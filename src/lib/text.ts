/**
 * Pure helpers for bounded text previews: the size limit, UTF-8 boundary trimming and the banner sentence.
 */

import { formatSize } from './format'

/** Most bytes of a text file that are read and shown (1 MB). */
export const MAX_TEXT_BYTES = 1_048_576

/**
 * Drops an incomplete UTF-8 sequence at the end of a byte run, so cutting a file at a byte
 * limit never leaves a replacement character at the cut. Looks back at most 3 bytes.
 *
 * @param bytes - Leading bytes of a file, possibly cut mid-character.
 * @returns The same bytes, or a shorter view without the trailing partial character.
 */
export function trimPartialUtf8(bytes: Uint8Array): Uint8Array {
  const length = bytes.length
  for (let back = 1; back <= Math.min(3, length); back++) {
    const byte = bytes[length - back]
    if ((byte & 0xc0) === 0x80) continue // continuation byte, keep looking for its lead
    const expected = byte >= 0xf0 ? 4 : byte >= 0xe0 ? 3 : byte >= 0xc0 ? 2 : 1
    return expected > back ? bytes.subarray(0, length - back) : bytes
  }
  return bytes
}

/**
 * Words the truncation banner.
 *
 * @param totalSize - Full size of the file in bytes.
 * @returns The banner sentence, e.g. "Showing the first 1 MB of 4.2 MB. The rest of the file isn't shown."
 */
export function truncationNotice(totalSize: number): string {
  return `Showing the first 1 MB of ${formatSize(totalSize)}. The rest of the file isn't shown.`
}

/**
 * Drops the partial final line of a cut text, so a construct split by the byte limit is never rendered half-formed.
 *
 * @param text - Decoded leading text of a file.
 * @param truncated - Whether the file was cut at the byte limit.
 * @returns The text unchanged when not truncated, when it holds no line break, or when cutting would leave only blank space; else the text up to and including its last line break (LF or CR).
 */
export function trimToLastLine(text: string, truncated: boolean): string {
  if (!truncated) return text
  const cut = Math.max(text.lastIndexOf('\n'), text.lastIndexOf('\r'))
  const trimmed = cut === -1 ? text : text.slice(0, cut + 1)
  return trimmed.trim() === '' ? text : trimmed
}
