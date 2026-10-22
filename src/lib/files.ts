/**
 * Classification and ordering helpers for file items.
 */

import type { FileCategory, FileItem } from '../types'

/** Lower-case extensions (without the dot) for each category except `other`. */
const EXTENSIONS: Record<Exclude<FileCategory, 'other'>, readonly string[]> = {
  document: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic', 'tiff', 'ico'],
  video: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'],
  archive: ['zip', 'tar', 'gz', 'tgz', 'rar', '7z', 'bz2', 'dmg'],
  code: ['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'rb', 'sh', 'swift', 'yml', 'yaml'],
}

/**
 * Picks a file category from the file name's extension.
 *
 * @param name - Base name of the file, e.g. `"report.PDF"`.
 * @returns The matching category (case-insensitive on the extension), or `"other"`
 * for unknown extensions, names without an extension and dotfiles like `".gitignore"`.
 */
export function categorizeFile(name: string): FileCategory {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return 'other'

  const extension = name.slice(dot + 1).toLowerCase()
  for (const category of Object.keys(EXTENSIONS) as (keyof typeof EXTENSIONS)[]) {
    if (EXTENSIONS[category].includes(extension)) return category
  }
  return 'other'
}

/**
 * Comparator that lists directories before files, then orders by name
 * (case-insensitive, numbers compared by value so `"file2"` precedes `"file10"`).
 *
 * @param a - First item.
 * @param b - Second item.
 * @returns A negative number if `a` sorts first, positive if `b` does, `0` if equal.
 */
export function compareFileItems(
  a: Pick<FileItem, 'name' | 'isDirectory'>,
  b: Pick<FileItem, 'name' | 'isDirectory'>,
): number {
  if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
  return a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true })
}
