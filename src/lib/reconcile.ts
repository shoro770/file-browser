/**
 * Pure reconciliation of cached tree state against freshly read folder levels (Refresh).
 */

import type { FileItem, FreshLevels, ReconcileResult, ReconcileState } from '../types'

/**
 * Tells whether an id is inside a folder's subtree.
 *
 * @param id - A normalized relative path.
 * @param folderId - Id of a folder.
 * @returns `true` if `id` is a strict descendant of `folderId`.
 */
function isDescendant(id: string, folderId: string): boolean {
  return id.startsWith(`${folderId}/`)
}

/**
 * Merges freshly read levels into the cached tree. Entries that are gone, or whose kind
 * changed (file to folder or the reverse), lose their expansion, cache, unavailable mark and
 * descendants, and a Selection inside them is cleared. Everything that survives keeps its
 * state. An expanded folder that could not be read is marked unavailable and loses its
 * cached children. Levels that were not re-read are left as they were.
 *
 * @param prev - The cached state.
 * @param fresh - The freshly read levels and the folders that failed to read.
 * @returns The new state and whether the Selection was cleared; `prev` is not modified.
 */
export function reconcile(prev: ReconcileState, fresh: FreshLevels): ReconcileResult {
  const items: Record<string, FileItem> = { ...prev.items }
  const childIds: Record<string, readonly string[]> = { ...prev.childIds }
  const expandedIds = new Set(prev.expandedIds)
  const unavailableIds = new Set(prev.unavailableIds)
  let rootIds = prev.rootIds
  let selectedId = prev.selectedId

  /** Drops everything below `folderId`, and `folderId` itself when `includeSelf`. */
  const drop = (folderId: string, includeSelf: boolean) => {
    // A file has no subtree, so skip the scans: emptying a 1,000-entry folder stays cheap.
    if (includeSelf && prev.items[folderId]?.isDirectory === false) {
      delete items[folderId]
      if (selectedId === folderId) selectedId = null
      return
    }
    const goes = (id: string) => isDescendant(id, folderId) || (includeSelf && id === folderId)
    for (const id of Object.keys(items)) if (goes(id)) delete items[id]
    for (const id of Object.keys(childIds)) if (goes(id)) delete childIds[id]
    for (const id of [...expandedIds]) if (goes(id)) expandedIds.delete(id)
    for (const id of [...unavailableIds]) if (goes(id)) unavailableIds.delete(id)
    if (selectedId !== null && goes(selectedId)) selectedId = null
  }

  for (const [parent, list] of Object.entries(fresh.levels)) {
    const before = parent === '' ? prev.rootIds : (prev.childIds[parent] ?? [])
    const now = new Map(list.map((item) => [item.id, item]))
    for (const id of before) {
      const next = now.get(id)
      if (!next || prev.items[id]?.isDirectory !== next.isDirectory) drop(id, true)
    }
    for (const item of list) {
      const kept = items[item.id]
      items[item.id] = kept && kept.isDirectory === item.isDirectory ? kept : item
    }
    const ids = list.map((item) => item.id)
    if (parent === '') rootIds = ids
    else {
      childIds[parent] = ids
      unavailableIds.delete(parent)
    }
  }

  for (const id of fresh.failed) {
    drop(id, false)
    delete childIds[id]
    unavailableIds.add(id)
  }

  return {
    items,
    rootIds,
    childIds,
    expandedIds,
    unavailableIds,
    selectedId,
    selectionCleared: prev.selectedId !== null && selectedId === null,
  }
}
