import { useSyncExternalStore } from 'react'
import { getSnapshot, openWorkspace, refresh, reveal, select, setShowDotfiles, subscribe, toggle } from '../services/tree'
import type { OpenOutcome, RefreshOutcome, TreeSnapshot } from '../types'

/**
 * Reads the tree store.
 *
 * @returns The current snapshot and the `openWorkspace`, `toggle`, `select`, `refresh`, `reveal` and `setShowDotfiles` intents.
 */
export function useTree(): {
  snapshot: TreeSnapshot
  openWorkspace: () => Promise<OpenOutcome>
  toggle: (id: string) => Promise<void>
  select: (id: string) => void
  refresh: () => Promise<RefreshOutcome>
  reveal: (id: string) => Promise<boolean>
  setShowDotfiles: (show: boolean) => void
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { snapshot, openWorkspace, toggle, select, refresh, reveal, setShowDotfiles }
}
