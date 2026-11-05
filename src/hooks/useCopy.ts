import { useCallback } from 'react'
import { copyText } from '../services/clipboard'

/**
 * Bridges components to the clipboard service. Returns a function that copies text produced by
 * `read` and announces `done` on success (re-readable if repeated) or "Couldn't copy" if reading or copying fails.
 *
 * @param onAnnounce - Called with the status text after each copy.
 * @returns `copy(read, done)`, which resolves to whether the copy worked; never throws.
 */
export function useCopy(onAnnounce: (text: string) => void) {
  return useCallback(
    async (read: () => string | Promise<string>, done: string) => {
      let ok = false
      try {
        ok = await copyText(await read())
      } catch {
        ok = false
      }
      // Clear first so copying twice in a row is announced twice (the status region ignores identical text).
      onAnnounce('')
      requestAnimationFrame(() => onAnnounce(ok ? done : "Couldn't copy"))
      return ok
    },
    [onAnnounce],
  )
}
