/**
 * Preview kind resolution and the strings and glyphs that derive from it.
 * Uses the extension, exact names and the device-reported type only; never file contents.
 */

import type { GlyphKind, PreviewKind } from '../types'
import { categorizeFile } from './files'

/** Shown on the Metadata Card when the file could not be read or rendered. */
export const RENDER_FAILED_MESSAGE = "This file couldn't be previewed. It may be damaged or in an unexpected format."

/** Shown on the Metadata Card for types with no preview. */
export const NO_PREVIEW_MESSAGE = 'No preview is available for this type of file.'

/** Shown on the Metadata Card for zero-byte files. */
export const EMPTY_FILE_MESSAGE = 'This file is empty.'

/** Shown on the Metadata Card for legacy `.doc` files. */
export const LEGACY_DOC_MESSAGE = "Legacy .doc files can't be previewed. Only .docx is supported."

/** Recognized text file names (exact, case-sensitive). */
const TEXT_NAMES: readonly string[] = [
  'Makefile', 'GNUmakefile', 'Dockerfile', 'Containerfile', 'Procfile', 'Gemfile',
  'Rakefile', 'Brewfile', 'Vagrantfile', 'LICENSE', 'LICENCE', 'COPYING', 'NOTICE',
  'AUTHORS', 'CONTRIBUTORS', 'CHANGELOG', 'README', 'CODEOWNERS',
  '.gitignore', '.gitattributes', '.gitmodules', '.editorconfig', '.npmrc', '.nvmrc',
  '.prettierrc', '.eslintrc', '.babelrc', '.dockerignore',
]

/** Plain-text extensions beyond the `code` category (lower-case, no dot). */
const PLAIN_TEXT_EXTENSIONS: readonly string[] = ['txt', 'text', 'log', 'csv', 'ini', 'toml', 'xml', 'conf', 'cfg']

/** Extensions shown with the binary glyph: archives, executables, audio and video. */
const BINARY_EXTENSIONS: readonly string[] = [
  'zip', 'tar', 'gz', '7z', 'exe', 'dll', 'bin', 'so', 'dylib',
  'mp3', 'wav', 'flac', 'mp4', 'mov', 'mkv',
]

/** Fixed Type strings from the EXPERIENCE.md map, by extension. */
const TYPE_LABELS: Readonly<Record<string, string>> = {
  doc: 'Word document (legacy)',
  docx: 'Word document',
  pdf: 'PDF document',
  zip: 'Archive', tar: 'Archive', gz: 'Archive', '7z': 'Archive',
  exe: 'Binary file', dll: 'Binary file', bin: 'Binary file', so: 'Binary file', dylib: 'Binary file',
  mp3: 'Audio file', wav: 'Audio file', flac: 'Audio file',
  mp4: 'Video file', mov: 'Video file', mkv: 'Video file',
}

/**
 * Gets a file name's extension.
 *
 * @param name - Base name, e.g. `"report.PDF"`.
 * @returns The lower-case extension without the dot; `''` for no extension and for dotfiles like `".gitignore"`.
 */
export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

/**
 * Tells whether a name is on the exact, case-sensitive text list (or begins with `.env`).
 *
 * @param name - Base name.
 * @returns `true` if the file previews as text by name.
 */
function isTextName(name: string): boolean {
  return TEXT_NAMES.includes(name) || name.startsWith('.env')
}

/**
 * Resolves which renderer a file gets. No content sniffing.
 *
 * Order: zero bytes, `.doc`, text names, extension, then the device-reported type
 * (`text/*`, `image/*`, `application/pdf`); anything else is `metadata`.
 *
 * @param name - Base name of the file.
 * @param mime - Device-reported `File.type`; `''` when unknown.
 * @param size - Size in bytes when known; `0` forces `metadata`. Omit it for tree glyphs, which never read the disk.
 * @returns The preview kind.
 */
export function resolvePreviewKind(name: string, mime = '', size?: number): PreviewKind {
  if (size === 0) return 'metadata'
  const extension = extensionOf(name)
  if (extension === 'doc') return 'metadata'
  if (extension === 'md' || extension === 'markdown') return 'markdown'
  if (extension === 'pdf') return 'pdf'
  if (extension === 'docx') return 'docx'
  if (categorizeFile(name) === 'image') return 'image'
  if (isTextName(name)) return 'text'
  if (PLAIN_TEXT_EXTENSIONS.includes(extension) || categorizeFile(name) === 'code') return 'text'

  const type = mime.toLowerCase()
  if (type === 'application/pdf') return 'pdf'
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('text/')) return 'text'
  return 'metadata'
}

/**
 * Tells whether a name is a PDF, through the kind resolver.
 *
 * @param name - Base name of the file.
 * @returns `true` if the file resolves to the `pdf` kind by its name.
 */
export function isPdfName(name: string): boolean {
  return resolvePreviewKind(name) === 'pdf'
}

/**
 * Chooses the kind glyph for a file from the resolver and the EXPERIENCE.md map, so the
 * tree and the Metadata Card agree.
 *
 * @param name - Base name of the file.
 * @param mime - Device-reported type; `''` when unknown (the tree never knows it).
 * @returns The glyph kind; `"file"` for unknown types.
 */
export function glyphForFile(name: string, mime = ''): GlyphKind {
  const extension = extensionOf(name)
  if (extension === 'doc') return 'document'
  const kind = resolvePreviewKind(name, mime)
  if (kind === 'text' || kind === 'markdown') return 'text'
  if (kind === 'pdf') return 'pdf'
  if (kind === 'docx') return 'document'
  if (kind === 'image') return 'image'
  if (BINARY_EXTENSIONS.includes(extension)) return 'binary'
  const type = mime.toLowerCase()
  if (type.startsWith('audio/') || type.startsWith('video/')) return 'binary'
  return 'file'
}

/**
 * Names a file's type for the Metadata Card, from the extension and device-reported type only.
 *
 * @param name - Base name of the file.
 * @param mime - Device-reported type; `''` when unknown.
 * @returns e.g. `"Word document"`, `"Archive"`, `"XYZ file"`, or `"File"` for an extensionless name.
 */
export function typeLabel(name: string, mime = ''): string {
  const extension = extensionOf(name)
  if (Object.hasOwn(TYPE_LABELS, extension)) return TYPE_LABELS[extension]
  if (extension !== '') return `${extension.toUpperCase()} file`
  if (isTextName(name)) return 'Text file'
  const type = mime.toLowerCase()
  if (type.startsWith('audio/')) return 'Audio file'
  if (type.startsWith('video/')) return 'Video file'
  return 'File'
}

/**
 * Chooses the explanation shown on a Metadata Card.
 *
 * @param name - Base name of the file.
 * @param size - Size in bytes.
 * @returns The empty-file, legacy-`.doc` or no-preview sentence.
 */
export function cardExplanation(name: string, size: number): string {
  if (size === 0) return EMPTY_FILE_MESSAGE
  if (extensionOf(name) === 'doc') return LEGACY_DOC_MESSAGE
  return NO_PREVIEW_MESSAGE
}
