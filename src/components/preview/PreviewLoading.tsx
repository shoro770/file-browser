import { useEffect } from 'react'

/**
 * Suspense fallback for a lazy renderer: visible text, never a blank body. It is not a live
 * region; the single status region carries the announcement (UX-DR22).
 *
 * @param props.onAnnounce - Sends "Loading preview..." to the status region once it shows.
 */
export default function PreviewLoading({ onAnnounce }: { onAnnounce: (text: string) => void }) {
  useEffect(() => {
    onAnnounce('Loading preview...')
  }, [onAnnounce])
  return <p className="preview__loading">Loading preview...</p>
}
