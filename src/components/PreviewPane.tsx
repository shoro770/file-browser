import { useEffect } from 'react'
import type { PreviewPaneProps } from '../types'
import MetadataCard from './MetadataCard'
import PreviewHeader from './PreviewHeader'

/** Id of the header `h2` that names the preview region. */
const TITLE_ID = 'preview-title'

/**
 * Preview Pane for a selected file: a named, focusable region holding the header and the
 * renderer for the file's kind. Until the renderers land, every kind shows the Metadata Card.
 * The previous file stays on screen until the new one is ready.
 */
export default function PreviewPane({ state, now, loading, onAnnounce }: PreviewPaneProps) {
  useEffect(() => {
    if (state.status === 'ready') onAnnounce(`${state.source.meta.name}: no preview available`)
    else if (state.status === 'failed') onAnnounce(`${state.name}: no preview available`)
  }, [state, onAnnounce])

  const named = state.status === 'ready'
  return (
    <div
      className="preview"
      role="region"
      aria-labelledby={named ? TITLE_ID : undefined}
      aria-label={named ? undefined : 'Preview'}
      tabIndex={0}
    >
      {state.status === 'ready' && (
        <>
          <PreviewHeader meta={state.source.meta} titleId={TITLE_ID} now={now} />
          <div className="preview__body">
            <MetadataCard meta={state.source.meta} name={state.source.meta.name} now={now} />
          </div>
        </>
      )}
      {state.status === 'failed' && (
        <div className="preview__body">
          <MetadataCard meta={null} name={state.name} now={now} />
        </div>
      )}
      {/* Always mounted, so assistive technology sees the text change instead of a new element. */}
      <p className="preview__loading" role="status">
        {loading ? 'Loading preview...' : ''}
      </p>
    </div>
  )
}
