import { useSyncExternalStore } from 'react'
import { getSnapshot, openWorkspace, select, setShowDotfiles, subscribe, toggle } from '../services/tree'
import type { OpenOutcome, TreeSnapshot } from '../types'

/**
 * Reads the tree store.
 *
 * @returns The current snapshot and the `openWorkspace`, `toggle`, `select` and `setShowDotfiles` intents.
 */
export function useTree(): {
  snapshot: TreeSnapshot
  openWorkspace: () => Promise<OpenOutcome>
  toggle: (id: string) => Promise<void>
  select: (id: string) => void
  setShowDotfiles: (show: boolean) => void
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { snapshot, openWorkspace, toggle, select, setShowDotfiles }
}
