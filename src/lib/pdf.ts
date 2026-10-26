/**
 * PDF detection helper.
 */

import type { FileItem } from '../types'
import { isPdfName } from './preview'

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
  return !item.isDirectory && isPdfName(item.name)
}
