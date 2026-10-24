/**
 * Pure helpers for tree ids, paths and kind glyphs.
 */

import type { FileItem, GlyphKind, VisibleRow } from '../types'
import { categorizeFile } from './files'

/** Extensions (lower-case, no dot) shown with the text glyph. */
const TEXT_EXTENSIONS: readonly string[] = ['md', 'markdown', 'txt']

/** Extensions shown with the document glyph. */
const DOCUMENT_EXTENSIONS: readonly string[] = ['doc', 'docx']

/** Extensions shown with the binary glyph: archives, executables, audio and video. */
const BINARY_EXTENSIONS: readonly string[] = [
  'zip', 'tar', 'gz', '7z', 'exe', 'dll', 'bin', 'so', 'dylib',
  'mp3', 'wav', 'flac', 'mp4', 'mov', 'mkv',
]

/** Recognized text file names (exact, case-sensitive). */
const TEXT_NAMES: readonly string[] = [
  'Makefile', 'GNUmakefile', 'Dockerfile', 'Containerfile', 'Procfile', 'Gemfile',
  'Rakefile', 'Brewfile', 'Vagrantfile', 'LICENSE', 'LICENCE', 'COPYING', 'NOTICE',
  'AUTHORS', 'CONTRIBUTORS', 'CHANGELOG', 'README', 'CODEOWNERS',
  '.gitignore', '.gitattributes', '.gitmodules', '.editorconfig', '.npmrc', '.nvmrc',
  '.prettierrc', '.eslintrc', '.babelrc', '.dockerignore',
]

/**
 * Builds an item id from its parent's id and its own name.
 *
 * @param parentId - Id of the parent folder; `''` for the Workspace Folder.
 * @param name - Base name of the entry.
 * @returns The normalized relative path: `/`-separated, no leading or trailing slash.
 */
export function toId(parentId: string, name: string): string {
  return parentId === '' ? name : `${parentId}/${name}`
}

/**
 * Gets the id of an item's parent folder.
 *
 * @param id - A normalized relative path.
 * @returns The parent's id; `''` (the Workspace Folder) for top-level items.
 */
export function parentId(id: string): string {
  const slash = id.lastIndexOf('/')
  return slash < 0 ? '' : id.slice(0, slash)
}

/**
 * Builds the display path for an item id.
 *
 * @param id - A normalized relative path (`''` for the root).
 * @returns `"/"` followed by the id.
 */
export function toPath(id: string): string {
  return `/${id}`
}

/**
 * Chooses the kind glyph for an entry from its name, per the EXPERIENCE.md map.
 *
 * @param name - Base name of the entry, e.g. `"report.PDF"`.
 * @param isDirectory - Whether the entry is a folder.
 * @returns The glyph kind; `"file"` for unknown types.
 */
export function glyphForName(name: string, isDirectory: boolean): GlyphKind {
  if (isDirectory) return 'folder'
  if (TEXT_NAMES.includes(name) || name.startsWith('.env')) return 'text'

  const dot = name.lastIndexOf('.')
  const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
  if (extension === 'pdf') return 'pdf'
  if (DOCUMENT_EXTENSIONS.includes(extension)) return 'document'
  if (TEXT_EXTENSIONS.includes(extension)) return 'text'
  if (BINARY_EXTENSIONS.includes(extension)) return 'binary'
  if (categorizeFile(name) === 'image') return 'image'
  return 'file'
}

/** Prefix of placeholder row keys; real ids are relative paths and never start with `/`. */
export const PLACEHOLDER_PREFIX = '/placeholder:'

/**
 * Builds the row key of a folder's placeholder row.
 *
 * @param folderId - Id of the folder the placeholder sits in.
 * @returns The key, `PLACEHOLDER_PREFIX` followed by the folder id.
 */
export function placeholderKey(folderId: string): string {
  return PLACEHOLDER_PREFIX + folderId
}

/**
 * Flattens the tree into the rows currently visible, in display order, including the
 * "Loading..." and "Empty folder" placeholder rows.
 *
 * @param items - Every loaded item, keyed by id.
 * @param rootIds - Ids of the top-level rows.
 * @param childIds - Ordered child ids of every listed folder.
 * @param expandedIds - Ids of expanded folders.
 * @param loadingIds - Ids of folders showing a loading state.
 * @returns The visible rows; placeholder keys are `placeholderKey(folderId)`.
 */
export function visibleRows(
  items: Readonly<Record<string, FileItem>>,
  rootIds: readonly string[],
  childIds: Readonly<Record<string, readonly string[]>>,
  expandedIds: ReadonlySet<string>,
  loadingIds: ReadonlySet<string>,
): VisibleRow[] {
  const rows: VisibleRow[] = []
  const walk = (ids: readonly string[], parentKey: string | null) => {
    for (const id of ids) {
      const item = items[id]
      const expanded = item.isDirectory && expandedIds.has(id)
      rows.push({ key: id, itemId: id, parentKey, isDirectory: item.isDirectory, expanded, name: item.name })
      if (!expanded) continue
      const childList = childIds[id]
      const placeholder: VisibleRow = {
        key: placeholderKey(id), itemId: null, parentKey: id, isDirectory: false, expanded: false, name: '',
      }
      if (loadingIds.has(id)) rows.push(placeholder)
      else if (childList?.length === 0) rows.push(placeholder)
      else if (childList) walk(childList, id)
    }
  }
  walk(rootIds, null)
  return rows
}

/**
 * Finds the next row whose item name starts with the query, wrapping around.
 *
 * @param rows - The visible rows.
 * @param fromIndex - Index of the focused row, or `-1` if none.
 * @param query - The accumulated type-ahead text; a single character starts after `fromIndex`.
 * @returns The matching row index, or `-1` when nothing matches.
 */
export function findTypeAhead(rows: readonly VisibleRow[], fromIndex: number, query: string): number {
  if (rows.length === 0 || query === '') return -1
  const needle = query.toLowerCase()
  const start = query.length === 1 ? fromIndex + 1 : Math.max(fromIndex, 0)
  for (let offset = 0; offset < rows.length; offset++) {
    const index = (start + offset) % rows.length
    const row = rows[index]
    if (row.itemId !== null && row.name.toLowerCase().startsWith(needle)) return index
  }
  return -1
}

/**
 * Computes how many rows PageUp/PageDown move.
 *
 * @param clientHeight - Visible height of the tree container in px.
 * @param rowHeight - Height of one row in px.
 * @returns `floor(clientHeight / rowHeight)`, at least 1.
 */
export function pageStep(clientHeight: number, rowHeight: number): number {
  return Math.max(1, Math.floor(clientHeight / rowHeight))
}
