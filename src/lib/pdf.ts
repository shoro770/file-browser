/**
 * PDF detection and metadata helpers.
 */

import type { FileItem } from '../types'

/**
 * Tells whether a file item is a PDF, judged by its extension.
 *
 * Only the name is checked, because `FileItem` carries no MIME type; a
 * `document`-category file is a PDF only if it is named `*.pdf`.
 *
 * @param item - The item to test; directories are never PDFs.
 * @returns `true` if the item is a regular file whose name ends in `.pdf` (case-insensitive).
 */
export function isPdf(item: Pick<FileItem, 'name' | 'isDirectory'>): boolean {
  return !item.isDirectory && /\.pdf$/i.test(item.name)
}

/**
 * Reads the page count from raw PDF source, without a PDF parser.
 *
 * Uses the largest `/Count` of a `/Type /Pages` node (the root holds the total),
 * and falls back to counting `/Type /Page` objects. Documents that keep their
 * page tree in compressed object streams can't be read this way.
 *
 * @param source - PDF bytes decoded as Latin-1 text.
 * @returns The page count, or `null` if it can't be determined.
 */
export function countPdfPages(source: string): number | null {
  let max = 0
  for (const match of source.matchAll(/\/Type\s*\/Pages\b(?:(?!endobj)[^])*?\/Count\s+(\d+)/g)) {
    max = Math.max(max, Number(match[1]))
  }
  if (max > 0) return max

  const pages = source.match(/\/Type\s*\/Page(?![A-Za-z])/g)
  return pages ? pages.length : null
}
