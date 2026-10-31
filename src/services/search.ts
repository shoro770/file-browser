/**
 * Read-only crawl of the Workspace Folder for search. Uses only `listChildren` and
 * `openChildDirectory`; it never reads file contents and does not touch the tree store's caches.
 */

import type { FileItem } from '../types'
import { listChildren, openChildDirectory } from './fs'
import type { WorkspaceHandle } from './fs'
import { getRootHandle } from './tree'

/**
 * Walks a folder breadth-first, one listing per folder. A folder that can't be read is skipped.
 *
 * @param root - The folder to crawl.
 * @param signal - Aborting stops the crawl before the next listing.
 * @yields Each folder's children (folders sorted first), a folder always before its own children.
 */
export async function* crawl(root: WorkspaceHandle, signal: AbortSignal): AsyncGenerator<FileItem[]> {
  const handles = new Map<string, WorkspaceHandle>([['', root]])
  const queue: string[] = ['']
  while (queue.length > 0 && !signal.aborted) {
    const id = queue.shift()!
    const handle = handles.get(id)!
    handles.delete(id)
    let children: FileItem[]
    try {
      children = await listChildren(handle, id)
    } catch {
      continue
    }
    if (signal.aborted) return
    for (const child of children) {
      if (signal.aborted) return
      if (!child.isDirectory) continue
      try {
        handles.set(child.id, await openChildDirectory(handle, child.name))
        queue.push(child.id)
      } catch {
        // Unreadable folder: it still shows as an entry, but nothing below it is searched.
      }
    }
    if (children.length > 0) yield children
  }
}

/**
 * Crawls the open Workspace Folder.
 *
 * @param signal - Aborting stops the crawl.
 * @yields Batches of entries, as `crawl` does; nothing when no folder is open.
 */
export async function* crawlWorkspace(signal: AbortSignal): AsyncGenerator<FileItem[]> {
  const root = getRootHandle()
  if (root) yield* crawl(root, signal)
}
