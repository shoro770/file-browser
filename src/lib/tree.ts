/**
 * Pure helpers for tree ids, paths and kind glyphs.
 */

import type { GlyphKind } from '../types'
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
