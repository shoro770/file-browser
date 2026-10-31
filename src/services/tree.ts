/**
 * Central tree store: the only holder of folder handles, loaded items, the children
 * cache and expansion state. React reads it through `hooks/useTree`. Opening a folder
 * replaces all state.
 */

import { reconcile } from '../lib/reconcile'
import { filterDotfiles, isDotfileId, parentId } from '../lib/tree'
import type { FileItem, FolderSummary, FreshLevels, OpenOutcome, RefreshOutcome, TreeSnapshot } from '../types'
import { handleName, listChildren, openChildDirectory, pickDirectory, readFile } from './fs'
import type { WorkspaceHandle } from './fs'
import { readShowDotfiles, writeShowDotfiles } from './prefs'

/** How long a first read may run before the Loading state shows. */
const LOADING_DELAY_MS = 150

const EMPTY: TreeSnapshot = {
  rootName: null,
  items: {},
  rootIds: [],
  childIds: {},
  expandedIds: new Set(),
  loadingIds: new Set(),
  unavailableIds: new Set(),
  showDotfiles: true,
  selectedId: null,
  refreshing: false,
  refreshCount: 0,
}

let snapshot: TreeSnapshot = { ...EMPTY, showDotfiles: readShowDotfiles() }
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
    unavailableIds: new Set(),
    showDotfiles: snapshot.showDotfiles,
    selectedId: null,
    refreshing: false,
    refreshCount: 0,
  })
  return { status: 'opened', name, count: children.length }
}

/**
 * Selects a file or folder. Accepts only a loaded id; anything else, and the
 * already-selected id, is a silent no-op.
 *
 * @param id - Id of the row to select.
 */
export function select(id: string): void {
  const item = snapshot.items[id]
  if (!item || id === snapshot.selectedId) return
  publish({ ...snapshot, selectedId: id })
}

/**
 * Gives the search crawl the Workspace Folder's handle. The crawl is read-only and does not touch the store.
 *
 * @returns The root handle, or `null` when no folder is open.
 */
export function getRootHandle(): WorkspaceHandle | null {
  return handles.get('') ?? null
}

/**
 * Makes a search result selectable: when it is not loaded yet, expands its ancestors top-down
 * (each first read is cached, as for any expand) until it appears. A loaded result is left
 * alone. Does not select; stops quietly at a folder that can't be read. Never throws.
 *
 * @param id - Id of the result.
 * @returns `true` when the result is loaded afterwards; `false` when an ancestor can't be read
 * or the folder changed meanwhile.
 */
export async function reveal(id: string): Promise<boolean> {
  if (snapshot.items[id]) return true
  const started = generation
  const chain: string[] = []
  for (let up = parentId(id); up !== ''; up = parentId(up)) chain.unshift(up)
  for (const folder of chain) {
    if (started !== generation || !snapshot.items[folder]) return false
    if (!snapshot.expandedIds.has(folder)) await toggle(folder)
    if (snapshot.unavailableIds.has(folder)) return false
  }
  return started === generation && snapshot.items[id] !== undefined
}

/**
 * Reads a loaded file through its parent folder's handle, without exposing the handle.
 * Used for the Selection only.
 *
 * @param id - Id of a loaded, non-directory item.
 * @returns The file.
 * @throws If the id is unknown, a folder, or the file can't be read.
 */
export function readItemFile(id: string): Promise<File> {
  const item = snapshot.items[id]
  const parent = handles.get(parentId(id))
  if (!item || item.isDirectory || !parent) return Promise.reject(new Error('not a readable file'))
  return readFile(parent, item.name)
}

/**
 * Counts a folder's direct children as the tree shows them (dotfiles follow the toggle). Uses
 * the cached listing when the folder has been listed, else lists it once without caching or
 * expanding it. Never recurses.
 *
 * @param id - Id of a loaded folder.
 * @returns The name, path and counts.
 * @throws If the id is not a loaded folder or it can't be listed.
 */
export async function summarizeFolder(id: string): Promise<FolderSummary> {
  const item = snapshot.items[id]
  if (!item?.isDirectory) throw new Error('not a folder')
  const cached = snapshot.childIds[id]
  let items = snapshot.items
  let ids: readonly string[]
  if (cached) ids = cached
  else {
    const started = generation
    const parent = handles.get(parentId(id))
    if (!parent || snapshot.unavailableIds.has(id)) throw new Error('folder not readable')
    const children = await listChildren(handles.get(id) ?? (await openChildDirectory(parent, item.name)), id)
    if (started !== generation) throw new Error('workspace changed')
    items = Object.fromEntries(children.map((child) => [child.id, child]))
    ids = children.map((child) => child.id)
  }
  const shown = filterDotfiles(ids, items, snapshot.showDotfiles)
  const folderCount = shown.filter((child) => items[child].isDirectory).length
  return { name: item.name, path: item.path, folderCount, fileCount: shown.length - folderCount }
}

/**
 * Shows or hides dotfiles and stores the choice. Reads nothing from disk and leaves
 * expansion alone; hiding clears a selection that is a dotfile or inside a dotfile folder.
 * Setting the current value is a silent no-op.
 *
 * @param show - Whether dotfiles are shown.
 */
export function setShowDotfiles(show: boolean): void {
  if (show === snapshot.showDotfiles) return
  writeShowDotfiles(show)
  const { selectedId } = snapshot
  const clears = !show && selectedId !== null && isDotfileId(selectedId)
  publish({ ...snapshot, showDotfiles: show, selectedId: clears ? null : selectedId })
}

/** Fresh listings gathered by a Refresh, with the handle each folder was read through. */
interface Gathered extends FreshLevels {
  opened: Map<string, WorkspaceHandle>
}

/**
 * Lists the root, then each currently expanded folder level by level (siblings in
 * parallel), through freshly opened handles. Collapsed and in-flight folders are not read.
 *
 * @returns The levels, or `null` when the root itself can't be listed.
 */
async function gatherLevels(root: WorkspaceHandle, expanded: ReadonlySet<string>): Promise<Gathered | null> {
  let top: FileItem[]
  try {
    top = await listChildren(root, '')
  } catch {
    return null
  }
  const levels: Record<string, FileItem[]> = { '': top }
  const opened = new Map<string, WorkspaceHandle>([['', root]])
  const failed = new Set<string>()
  let frontier = top
  while (frontier.length > 0) {
    const folders = frontier.filter((item) => item.isDirectory && expanded.has(item.id) && !pending.has(item.id))
    const results = await Promise.all(
      folders.map(async (folder) => {
        try {
          const handle = await openChildDirectory(opened.get(parentId(folder.id))!, folder.name)
          return { folder, handle, children: await listChildren(handle, folder.id) }
        } catch {
          return { folder, handle: null, children: null }
        }
      }),
    )
    frontier = []
    for (const { folder, handle, children } of results) {
      if (!handle || !children) {
        failed.add(folder.id)
        continue
      }
      levels[folder.id] = children
      opened.set(folder.id, handle)
      frontier.push(...children)
    }
  }
  return { levels, failed, opened }
}

/**
 * Re-reads the root and every currently expanded folder, replaces each cached level and keeps
 * expansion and the Selection for every id that still exists (names and kinds only). A surviving
 * Selection is then read once with `getFile()`; if that fails it is cleared too. Collapsed and never-expanded folders are not read, and dotfile visibility is
 * untouched. A second call while one runs is ignored.
 *
 * @returns `refreshed` (with whether the Selection was cleared, and its name if so), `failed` when the root can't
 * be read (state untouched), or `skipped` when nothing is open, one is already running, or a
 * new folder replaced the tree meanwhile. Never throws.
 */
export async function refresh(): Promise<RefreshOutcome> {
  const root = handles.get('')
  if (snapshot.rootName === null || !root || snapshot.refreshing) return { status: 'skipped' }

  const started = generation
  publish({ ...snapshot, refreshing: true })
  try {
    const gathered = await gatherLevels(root, snapshot.expandedIds)
    if (started !== generation) return { status: 'skipped' }
    if (!gathered) return { status: 'failed' }

    let next = reconcile(snapshot, gathered)
    // A Selection that survived the listing must still be readable; probe it once, before publishing.
    const probedId = next.selectedId
    let unreadable = false
    if (probedId !== null && !next.items[probedId].isDirectory) {
      const parent = gathered.opened.get(parentId(probedId)) ?? handles.get(parentId(probedId))
      try {
        if (!parent) throw new Error('no handle')
        await readFile(parent, next.items[probedId].name)
      } catch {
        unreadable = true
      }
      if (started !== generation) return { status: 'skipped' }
      // The snapshot may have moved while the probe ran.
      next = reconcile(snapshot, gathered)
    }
    if (unreadable && next.selectedId === probedId) next = { ...next, selectedId: null, selectionCleared: true }
    const clearedName =
      next.selectionCleared && snapshot.selectedId !== null ? (snapshot.items[snapshot.selectedId]?.name ?? null) : null
    // Keep the handle of every surviving, readable folder; re-read folders get their fresh one.
    const kept = new Map<string, WorkspaceHandle>()
    for (const [id, handle] of handles) {
      if (id === '' || (next.items[id]?.isDirectory && !gathered.failed.has(id))) kept.set(id, handle)
    }
    for (const [id, handle] of gathered.opened) if (id === '' || next.items[id]?.isDirectory) kept.set(id, handle)
    handles = kept
    publish({
      ...snapshot,
      items: next.items,
      rootIds: next.rootIds,
      childIds: next.childIds,
      expandedIds: next.expandedIds,
      unavailableIds: next.unavailableIds,
      selectedId: next.selectedId,
      refreshing: false,
      refreshCount: snapshot.refreshCount + 1,
    })
    return { status: 'refreshed', selectionCleared: next.selectionCleared, clearedName }
  } finally {
    // Every path that did not publish above (failed, a throw) still ends the busy state.
    if (started === generation && snapshot.refreshing) publish({ ...snapshot, refreshing: false })
  }
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
 * their expansion state across collapse. A failed read marks the folder unavailable, keeps
 * it expanded and caches that outcome: later toggles never re-read.
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
  if (snapshot.childIds[id] || snapshot.unavailableIds.has(id)) {
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
    publish({
      ...snapshot,
      unavailableIds: withMember(snapshot.unavailableIds, id, true),
      loadingIds,
    })
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
