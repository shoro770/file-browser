/**
 * The only module that touches File System Access handles. Strictly read-only:
 * the picker is opened with `mode: 'read'` and folders are listed with `values()`.
 */

import { categorizeFile, compareFileItems } from '../lib/files'
import { toId, toPath } from '../lib/tree'
import type { FileItem } from '../types'

/** Opaque handle to a chosen folder; only this module looks inside it. */
export type WorkspaceHandle = FileSystemDirectoryHandle

/** Types the bundled DOM lib lacks: the picker, and async iteration over a directory. */
type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: 'read' }) => Promise<FileSystemDirectoryHandle>
}
type IterableDirectory = FileSystemDirectoryHandle & {
  values(): AsyncIterable<FileSystemHandle>
}

/** Outcome of showing the folder picker. */
export type PickOutcome =
  | { status: 'picked'; handle: WorkspaceHandle }
  | { status: 'cancelled' }
  | { status: 'denied' }

/**
 * Whether this browser can open a folder picker.
 *
 * @returns `true` if `showDirectoryPicker` exists.
 */
export function isFolderPickerSupported(): boolean {
  return typeof (window as PickerWindow).showDirectoryPicker === 'function'
}

/**
 * Shows the read-only system folder picker.
 *
 * @returns The chosen folder, or a typed `cancelled` / `denied` outcome. Never throws.
 */
export async function pickDirectory(): Promise<PickOutcome> {
  const picker = (window as PickerWindow).showDirectoryPicker
  if (!picker) return { status: 'denied' }
  try {
    return { status: 'picked', handle: await picker.call(window, { mode: 'read' }) }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return { status: 'cancelled' }
    return { status: 'denied' }
  }
}

/**
 * Lists a folder's immediate children in one pass, reading names and kinds only.
 *
 * @param handle - The folder to list.
 * @param parentId - Id of that folder; `''` for the Workspace Folder.
 * @returns The children as `FileItem`s, folders first then natural name order.
 * @throws If the folder can't be read.
 */
export async function listChildren(handle: WorkspaceHandle, parentId: string): Promise<FileItem[]> {
  const items: FileItem[] = []
  for await (const entry of (handle as IterableDirectory).values()) {
    const id = toId(parentId, entry.name)
    const isDirectory = entry.kind === 'directory'
    items.push({
      id,
      name: entry.name,
      path: toPath(id),
      isDirectory,
      ...(isDirectory ? {} : { category: categorizeFile(entry.name) }),
    })
  }
  return items.sort(compareFileItems)
}

/**
 * Opens a child folder of a folder handle (read-only; never creates it).
 *
 * @param parent - The containing folder.
 * @param name - Base name of the child folder.
 * @returns The child folder's handle.
 * @throws If the child can't be opened.
 */
export function openChildDirectory(parent: WorkspaceHandle, name: string): Promise<WorkspaceHandle> {
  return parent.getDirectoryHandle(name)
}

/**
 * Reads the name of a folder handle.
 *
 * @param handle - The folder.
 * @returns Its base name.
 */
export function handleName(handle: WorkspaceHandle): string {
  return handle.name
}
