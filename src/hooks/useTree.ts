import { useSyncExternalStore } from 'react'
import { getSnapshot, openWorkspace, select, subscribe, toggle } from '../services/tree'
import type { OpenOutcome, TreeSnapshot } from '../types'

/**
 * Reads the tree store.
 *
 * @returns The current snapshot and the `openWorkspace`, `toggle` and `select` intents.
 */
export function useTree(): {
  snapshot: TreeSnapshot
  openWorkspace: () => Promise<OpenOutcome>
  toggle: (id: string) => Promise<void>
  select: (id: string) => void
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { snapshot, openWorkspace, toggle, select }
}
