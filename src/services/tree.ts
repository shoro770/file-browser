/**
 * Central tree store: the only holder of folder handles, loaded items, the children
 * cache and expansion state. React reads it through `hooks/useTree`. Opening a folder
 * replaces all state.
 */

import { parentId } from '../lib/tree'
import type { FileItem, OpenOutcome, TreeSnapshot } from '../types'
import { handleName, listChildren, openChildDirectory, pickDirectory } from './fs'
import type { WorkspaceHandle } from './fs'

/** How long a first read may run before the Loading state shows. */
const LOADING_DELAY_MS = 150

const EMPTY: TreeSnapshot = {
  rootName: null,
  items: {},
  rootIds: [],
  childIds: {},
  expandedIds: new Set(),
  loadingIds: new Set(),
  selectedId: null,
}

let snapshot: TreeSnapshot = EMPTY
/** Handles of the root (`''`) and of every folder that has been expanded, by id. */
let handles = new Map<string, WorkspaceHandle>()
/** Folders with a first read in flight, each with its loading-delay timer. */
const pending = new Map<string, ReturnType<typeof setTimeout>>()
/** Bumped whenever a new workspace replaces the old one; guards stale reads. */
let generation = 0
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

  generation += 1
  pending.forEach((timer) => clearTimeout(timer))
  pending.clear()
  handles = new Map([['', picked.handle]])
  const items: Record<string, FileItem> = {}
  for (const child of children) items[child.id] = child
  const name = handleName(picked.handle)
  publish({
    rootName: name,
    items,
    rootIds: children.map((child) => child.id),
    childIds: {},
    expandedIds: new Set(),
    loadingIds: new Set(),
    selectedId: null,
  })
  return { status: 'opened', name, count: children.length }
}

/**
 * Selects a file. Accepts only a loaded, non-directory id; anything else, and the
 * already-selected id, is a silent no-op.
 *
 * @param id - Id of the file row to select.
 */
export function select(id: string): void {
  const item = snapshot.items[id]
  if (!item || item.isDirectory || id === snapshot.selectedId) return
  publish({ ...snapshot, selectedId: id })
}

/** Returns a copy of `set` with `id` added or removed. */
function withMember(set: ReadonlySet<string>, id: string, present: boolean): Set<string> {
  const next = new Set(set)
  if (present) next.add(id)
  else next.delete(id)
  return next
}

/**
 * Expands or collapses a folder. The first expand lists one level (names and kinds
 * only) and caches it; later expands reuse the cache with no read. Descendants keep
 * their expansion state across collapse. A failed read leaves the folder collapsed.
 *
 * @param id - Id of the folder row.
 * @returns Resolves when the toggle (including any first read) has settled; never throws.
 */
export async function toggle(id: string): Promise<void> {
  const item = snapshot.items[id]
  if (!item?.isDirectory || pending.has(id)) return

  if (snapshot.expandedIds.has(id)) {
    publish({ ...snapshot, expandedIds: withMember(snapshot.expandedIds, id, false) })
    return
  }
  if (snapshot.childIds[id]) {
    publish({ ...snapshot, expandedIds: withMember(snapshot.expandedIds, id, true) })
    return
  }

  const parentHandle = handles.get(parentId(id))
  if (!parentHandle) return

  const started = generation
  const timer = setTimeout(() => {
    if (started !== generation || !pending.has(id)) return
    publish({ ...snapshot, loadingIds: withMember(snapshot.loadingIds, id, true) })
  }, LOADING_DELAY_MS)
  pending.set(id, timer)
  publish({ ...snapshot, expandedIds: withMember(snapshot.expandedIds, id, true) })

  let handle: WorkspaceHandle | null = null
  let children: FileItem[] | null = null
  try {
    handle = await openChildDirectory(parentHandle, item.name)
    children = await listChildren(handle, id)
  } catch {
    children = null
  }

  if (started !== generation) return
  clearTimeout(timer)
  pending.delete(id)
  const loadingIds = withMember(snapshot.loadingIds, id, false)

  if (!handle || !children) {
    publish({ ...snapshot, expandedIds: withMember(snapshot.expandedIds, id, false), loadingIds })
    return
  }

  handles.set(id, handle)
  const items: Record<string, FileItem> = { ...snapshot.items }
  for (const child of children) items[child.id] = child
  publish({
    ...snapshot,
    items,
    childIds: { ...snapshot.childIds, [id]: children.map((child) => child.id) },
    loadingIds,
  })
}
