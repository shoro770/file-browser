import { useEffect, useState } from 'react'
import { closePreview, openPreview } from '../services/previewSession'
import type { FileItem, PreviewState } from '../types'

/** How long a load may run before "Loading preview..." shows. */
const LOADING_DELAY_MS = 150

/** Latest outcome, and when it arrived (for the Today/Yesterday labels). */
interface Result {
  state: PreviewState
  now: Date
  /** The reload key this result was opened with. */
  key: number
}

/**
 * Loads the selected file's details through a preview session.
 *
 * The previous result stays in `state` until the new one is ready, and a result from a
 * superseded selection never lands. Clearing the selection resets to idle. Changing
 * `reloadKey` re-opens a session for the same file without clearing the old result.
 *
 * @param item - The selected file, or `null`.
 * @param reloadKey - Changing it reloads the same file; the old result stays until the new one lands.
 * @returns The latest outcome, the time it arrived, whether the current load has run past the loading delay, and the reload key of the last result that landed.
 */
export function usePreview(
  item: FileItem | null,
  reloadKey = 0,
): { state: PreviewState; now: Date; loading: boolean; settledKey: number } {
  const [result, setResult] = useState<Result>(() => ({
    state: { status: 'idle' },
    now: new Date(),
    key: reloadKey,
  }))
  const [loading, setLoading] = useState(false)
  const id = item?.id ?? null
  const name = item?.name ?? ''

  // With nothing selected, drop the old result during render so it can't flash under the next selection.
  if (id === null && result.state.status !== 'idle') {
    setResult({ state: { status: 'idle' }, now: result.now, key: result.key })
  }

  useEffect(() => {
    if (id === null) {
      closePreview()
      return
    }

    let current = true
    const timer = setTimeout(() => {
      if (current) setLoading(true)
    }, LOADING_DELAY_MS)
    openPreview(id, name).then((next) => {
      if (!current || next === null) return
      clearTimeout(timer)
      setResult({ state: next, now: new Date(), key: reloadKey })
      setLoading(false)
    })
    return () => {
      current = false
      clearTimeout(timer)
      setLoading(false)
    }
  }, [id, name, reloadKey])

  return { state: result.state, now: result.now, loading, settledKey: result.key }
}
