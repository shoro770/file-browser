/**
 * Central tree store: the only holder of the folder handle and loaded items.
 * React reads it through `hooks/useTree`. Opening a folder replaces all state.
 */

import type { FileItem, OpenOutcome, TreeSnapshot } from '../types'
import { handleName, listChildren, pickDirectory } from './fs'
import type { WorkspaceHandle } from './fs'

const EMPTY: TreeSnapshot = { rootName: null, items: {}, rootIds: [], selectedId: null }

let snapshot: TreeSnapshot = EMPTY
let handle: WorkspaceHandle | null = null
const listeners = new Set<() => void>()

/** Replaces the snapshot and notifies subscribers. */
function publish(next: TreeSnapshot): void {
  snapshot = next
  listeners.forEach((listener) => listener())
}

/**
 * Subscribes to store changes.
 *
 * @param listener - Called after every change.
 * @returns A function that unsubscribes.
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Reads the current immutable snapshot (same object until the next change).
 *
 * @returns The snapshot.
 */
export function getSnapshot(): TreeSnapshot {
  return snapshot
}

/**
 * Asks the user for a folder and, if one is chosen, replaces the tree with its top level.
 * Cancel and denial leave the current state untouched.
 *
 * @returns A typed outcome; never throws.
 */
export async function openWorkspace(): Promise<OpenOutcome> {
  const picked = await pickDirectory()
  if (picked.status !== 'picked') return { status: picked.status }

  let children: FileItem[]
  try {
    children = await listChildren(picked.handle, '')
  } catch {
    return { status: 'denied' }
  }

  handle = picked.handle
  const items: Record<string, FileItem> = {}
  for (const child of children) items[child.id] = child
  const name = handleName(handle)
  publish({ rootName: name, items, rootIds: children.map((child) => child.id), selectedId: null })
  return { status: 'opened', name, count: children.length }
}
