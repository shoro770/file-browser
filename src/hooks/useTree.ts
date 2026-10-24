import { useSyncExternalStore } from 'react'
import { getSnapshot, openWorkspace, subscribe } from '../services/tree'
import type { OpenOutcome, TreeSnapshot } from '../types'

/**
 * Reads the tree store.
 *
 * @returns The current snapshot and the `openWorkspace` intent.
 */
export function useTree(): { snapshot: TreeSnapshot; openWorkspace: () => Promise<OpenOutcome> } {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { snapshot, openWorkspace }
}
