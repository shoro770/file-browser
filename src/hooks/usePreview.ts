import { useEffect, useState } from 'react'
import { closePreview, openPreview } from '../services/previewSession'
import type { FileItem, PreviewState } from '../types'

/** How long a load may run before "Loading preview..." shows. */
const LOADING_DELAY_MS = 150

/** Latest outcome, and when it arrived (for the Today/Yesterday labels). */
interface Result {
  state: PreviewState
  now: Date
}

/**
 * Loads the selected file's details through a preview session.
 *
 * The previous result stays in `state` until the new one is ready, and a result from a
 * superseded selection never lands. Clearing the selection resets to idle.
 *
 * @param item - The selected file, or `null`.
 * @returns The latest outcome, the time it arrived, and whether the current load has run past the loading delay.
 */
export function usePreview(item: FileItem | null): { state: PreviewState; now: Date; loading: boolean } {
  const [result, setResult] = useState<Result>(() => ({ state: { status: 'idle' }, now: new Date() }))
  const [loading, setLoading] = useState(false)
  const id = item?.id ?? null
  const name = item?.name ?? ''

  // With nothing selected, drop the old result during render so it can't flash under the next selection.
  if (id === null && result.state.status !== 'idle') {
    setResult({ state: { status: 'idle' }, now: result.now })
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
      setResult({ state: next, now: new Date() })
      setLoading(false)
    })
    return () => {
      current = false
      clearTimeout(timer)
      setLoading(false)
    }
  }, [id, name])

  return { state: result.state, now: result.now, loading }
}
