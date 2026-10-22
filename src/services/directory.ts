/**
 * Reads a folder from the user's computer through the File System Access API
 * (Chromium browsers). Impure by nature, so it lives outside `src/lib`.
 */

import { categorizeFile, compareFileItems } from '../lib/files'
import { isPdf } from '../lib/pdf'
import type { FileItem } from '../types'

/** Types the bundled DOM lib lacks: the picker, and async iteration over a directory. */
type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}
type IterableDirectory = FileSystemDirectoryHandle & {
  values(): AsyncIterable<FileSystemHandle>
}

/** A folder read from disk. */
export interface OpenedFolder {
  /** Name of the chosen folder. */
  name: string
  /** Its direct children, directories first, hidden entries (dotfiles) left out. */
  items: FileItem[]
}

/** Whether this browser can open a folder picker. */
export function isFolderPickerSupported(): boolean {
  return typeof (window as PickerWindow).showDirectoryPicker === 'function'
}

/**
 * Shows the system folder picker and lists the chosen folder.
 * PDFs get a `blob:` URL for the preview; release them with `revokeItemUrls`.
 *
 * @returns The folder, or `null` if the user cancelled the picker.
 * @throws If the picker is unsupported or the folder can't be read.
 */
export async function pickFolder(): Promise<OpenedFolder | null> {
  const picker = (window as PickerWindow).showDirectoryPicker
  if (!picker) throw new Error('Opening folders is not supported in this browser')

  let handle: FileSystemDirectoryHandle
  try {
    handle = await picker.call(window, { mode: 'read' })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null
    throw error
  }

  const items: FileItem[] = []
  for await (const entry of (handle as IterableDirectory).values()) {
    if (entry.name.startsWith('.')) continue
    items.push(await toFileItem(entry))
  }
  items.sort(compareFileItems)
  return { name: handle.name, items }
}

/** Frees the `blob:` URLs created by `pickFolder` for the given items. */
export function revokeItemUrls(items: FileItem[]): void {
  for (const item of items) {
    if (item.url) URL.revokeObjectURL(item.url)
  }
}

/** Converts a directory entry into a `FileItem` (`path` is relative to the opened folder). */
async function toFileItem(entry: FileSystemHandle): Promise<FileItem> {
  const base = {
    id: crypto.randomUUID(),
    name: entry.name,
    path: `/${entry.name}`,
  }

  if (entry.kind === 'directory') {
    // Directory handles expose no size or modification time.
    return { ...base, size: 0, isDirectory: true, updatedAt: null, category: 'other' }
  }

  const file = await (entry as FileSystemFileHandle).getFile()
  const item: FileItem = {
    ...base,
    size: file.size,
    isDirectory: false,
    updatedAt: new Date(file.lastModified),
    category: categorizeFile(entry.name),
  }
  return isPdf(item) ? { ...item, url: URL.createObjectURL(file) } : item
}
