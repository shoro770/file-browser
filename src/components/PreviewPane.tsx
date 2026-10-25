import { useEffect, useState } from 'react'
import { rendererFor } from '../lib/preview'
import type { PreviewPaneProps, PreviewSource } from '../types'
import MetadataCard from './MetadataCard'
import PreviewHeader from './PreviewHeader'
import ImagePreview from './preview/ImagePreview'
import PreviewBoundary from './preview/PreviewBoundary'
import TextPreview from './preview/TextPreview'

/** Id of the header `h2` that names the preview region. */
const TITLE_ID = 'preview-title'

/** Which renderer draws a ready source; the dispatch and the announcement share it. */
function rendererOf({ meta, text, imageUrl }: PreviewSource) {
  return rendererFor(meta.kind, !!text, !!imageUrl)
}

/** Keys a renderer's boundary by source, so a new file or image URL remounts it. */
function sourceKey(id: string, { imageUrl }: PreviewSource): string {
  return `${id}:${imageUrl ?? ''}`
}

/**
 * Preview Pane for a selected file: a named, focusable region holding the header and the
 * renderer for the file's kind. Kinds without a renderer yet show the Metadata Card.
 * The previous file stays on screen until the new one is ready. A renderer that throws or
 * cannot decode its file is replaced by the Metadata Card with the render-failure text.
 */
export default function PreviewPane({ state, now, loading, onAnnounce }: PreviewPaneProps) {
  const [failedSource, setFailedSource] = useState<PreviewSource | null>(null)
  const key = state.status === 'ready' ? sourceKey(state.id, state.source) : null
  // Every session builds a new source object, so a reselected file gets a fresh attempt.
  const renderFailed = state.status === 'ready' && failedSource === state.source

  useEffect(() => {
    // Text and image previews are announced on activation only ("Previewing {name}"); cards, including a render failure, get the no-preview text.
    if (state.status === 'ready') {
      if (renderFailed || rendererOf(state.source) === 'card') onAnnounce(`${state.source.meta.name}: no preview available`)
    } else if (state.status === 'failed') onAnnounce(`${state.name}: no preview available`)
  }, [state, renderFailed, onAnnounce])

  const named = state.status === 'ready'
  const renderer = state.status === 'ready' && !renderFailed ? rendererOf(state.source) : 'card'
  // Bound to this source: a late failure from an old source cannot fail the new one.
  const fail = () => {
    if (state.status === 'ready') setFailedSource(state.source)
  }
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
          {renderer === 'text' ? (
            <PreviewBoundary key={key} onFail={fail}>
              <TextPreview source={state.source} />
            </PreviewBoundary>
          ) : renderer === 'image' ? (
            <PreviewBoundary key={key} onFail={fail}>
              <ImagePreview source={state.source} onError={fail} />
            </PreviewBoundary>
          ) : (
            <div className="preview__body">
              <MetadataCard meta={state.source.meta} name={state.source.meta.name} now={now} failed={renderFailed} />
            </div>
          )}
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
