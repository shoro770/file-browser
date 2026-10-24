import { useSyncExternalStore } from 'react'
import { getSnapshot, openWorkspace, subscribe, toggle } from '../services/tree'
import type { OpenOutcome, TreeSnapshot } from '../types'

/**
 * Reads the tree store.
 *
 * @returns The current snapshot and the `openWorkspace` and `toggle` intents.
 */
export function useTree(): {
  snapshot: TreeSnapshot
  openWorkspace: () => Promise<OpenOutcome>
  toggle: (id: string) => Promise<void>
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { snapshot, openWorkspace, toggle }
}
