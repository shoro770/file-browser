import { Suspense, lazy, useEffect, useState } from 'react'
import { rendererFor } from '../lib/preview'
import type { PreviewPaneProps, PreviewSource } from '../types'
import FolderCard from './FolderCard'
import MetadataCard from './MetadataCard'
import PreviewHeader from './PreviewHeader'
import ImagePreview from './preview/ImagePreview'
import PreviewBoundary from './preview/PreviewBoundary'
import PreviewLoading from './preview/PreviewLoading'
import TextPreview from './preview/TextPreview'

/** The Markdown renderer and its parser and sanitizer load on first use (AD-9, AD-15). */
const MarkdownPreview = lazy(() => import('./preview/MarkdownPreview'))

/** The Word renderer and its converter load on first use (AD-9, AD-15). */
const DocxPreview = lazy(() => import('./preview/DocxPreview'))

/** The PDF renderer loads on first use too (AD-9); it has no dependency, only the embed. */
const PdfPreview = lazy(() => import('./preview/PdfPreview'))

/** Id of the header `h2` that names the preview region. */
const TITLE_ID = 'preview-title'

/** Which renderer draws a ready source; the dispatch and the announcement share it. */
function rendererOf({ meta, text, imageUrl, pdfUrl }: PreviewSource) {
  return rendererFor(meta.kind, !!text, !!imageUrl, !!pdfUrl)
}

/** Keys a renderer's boundary by source, so a new file or object URL remounts it. */
function sourceKey(id: string, { imageUrl, pdfUrl }: PreviewSource): string {
  return `${id}:${imageUrl ?? ''}:${pdfUrl ?? ''}`
}

/**
 * Preview Pane for a selected file or folder: a named, focusable region holding the header and the
 * renderer for the file's kind. Kinds without a renderer yet show the Metadata Card.
 * The previous file stays on screen until the new one is ready. A renderer that throws or
 * cannot decode its file is replaced by the Metadata Card with the render-failure text.
 */
export default function PreviewPane({ state, now, loading, onAnnounce, rootName }: PreviewPaneProps) {
  const [failedSource, setFailedSource] = useState<PreviewSource | null>(null)
  const key = state.status === 'ready' ? sourceKey(state.id, state.source) : null
  // Every session builds a new source object, so a reselected file gets a fresh attempt.
  const renderFailed = state.status === 'ready' && failedSource === state.source

  useEffect(() => {
    // Text, Markdown, Word, PDF and image previews are announced on activation only ("Previewing {name}"); cards, including a render failure, get the no-preview text.
    if (state.status === 'ready') {
      if (renderFailed || rendererOf(state.source) === 'card') onAnnounce(`${state.source.meta.name}: no preview available`)
    } else if (state.status === 'failed' && !state.directory) onAnnounce(`${state.name}: no preview available`)
  }, [state, renderFailed, onAnnounce])

  // The visible text below is not a live region; the single status region speaks it (UX-DR22).
  useEffect(() => {
    if (loading) onAnnounce('Loading preview...')
  }, [loading, onAnnounce])

  const named = state.status === 'ready' || state.status === 'folder'
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
          <PreviewHeader
            meta={state.source.meta}
            titleId={TITLE_ID}
            now={now}
            id={state.id}
            rootName={rootName}
            file={state.source.file}
            onAnnounce={onAnnounce}
          />
          {renderer === 'text' ? (
            <PreviewBoundary key={key} onFail={fail}>
              <TextPreview source={state.source} />
            </PreviewBoundary>
          ) : renderer === 'markdown' ? (
            <PreviewBoundary key={key} onFail={fail}>
              <Suspense fallback={<PreviewLoading onAnnounce={onAnnounce} />}>
                <MarkdownPreview source={state.source} />
              </Suspense>
            </PreviewBoundary>
          ) : renderer === 'docx' ? (
            <PreviewBoundary key={key} onFail={fail}>
              <Suspense fallback={<PreviewLoading onAnnounce={onAnnounce} />}>
                <DocxPreview source={state.source} />
              </Suspense>
            </PreviewBoundary>
          ) : renderer === 'pdf' ? (
            <PreviewBoundary key={key} onFail={fail}>
              <Suspense fallback={<PreviewLoading onAnnounce={onAnnounce} />}>
                <PdfPreview source={state.source} onError={fail} />
              </Suspense>
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
      {state.status === 'folder' && (
        <div className="preview__body">
          <FolderCard summary={state.summary} name={state.summary.name} titleId={TITLE_ID} />
        </div>
      )}
      {state.status === 'failed' && (
        <div className="preview__body">
          {state.directory ? (
            <FolderCard summary={null} name={state.name} />
          ) : (
            <MetadataCard meta={null} name={state.name} now={now} />
          )}
        </div>
      )}
      <p className="preview__loading">
        {loading ? 'Loading preview...' : ''}
      </p>
    </div>
  )
}
