import { useEffect, useState } from 'react'
import { countPdfPages } from '../lib/pdf'
import type { PdfPreviewProps } from '../types'

/** Shown instead of the document when it has no usable source or can't be loaded. */
const UNAVAILABLE_MESSAGE = 'Preview unavailable for this file'

/** Load outcome for one URL; `pages` is `null` when it couldn't be determined. */
interface LoadResult {
  url: string
  failed: boolean
  pages: number | null
}

/**
 * Preview pane for a PDF: a header with the file name and page count, and the
 * document embedded below via `<object>` (with a download link as fallback for
 * browsers that can't render PDFs inline). If the item has no `url`, the
 * download fails, the response isn't a PDF, or the embed errors, the document is
 * replaced by a "Preview unavailable" message; the rest of the app is unaffected.
 */
export function PdfPreview({ item }: PdfPreviewProps) {
  const url = item.url?.trim() || undefined
  const [result, setResult] = useState<LoadResult | null>(null)

  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.arrayBuffer()
      })
      .then((buffer) => {
        const source = new TextDecoder('latin1').decode(buffer)
        // Servers (e.g. SPA fallbacks) may answer 200 with an HTML page.
        if (!source.trimStart().startsWith('%PDF-')) throw new Error('Not a PDF')
        setResult({ url, failed: false, pages: countPdfPages(source) })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ url, failed: true, pages: null })
        }
      })
    return () => controller.abort()
  }, [url])

  // Ignore a result that belongs to a previously selected file.
  const current = result !== null && result.url === url ? result : null
  const unavailable = !url || current?.failed === true
  const pages = current?.pages ?? null
  const pagesLabel = unavailable
    ? 'Pages: —'
    : pages === null
      ? 'Pages: …'
      : `${pages} ${pages === 1 ? 'page' : 'pages'}`

  return (
    <section className="pdf-preview" aria-label={`Preview of ${item.name}`}>
      <header className="pdf-preview-header">
        <h2>{item.name}</h2>
        <span className="pdf-preview-meta">{pagesLabel}</span>
      </header>
      {unavailable ? (
        <p className="pdf-preview-empty" role="status">
          {UNAVAILABLE_MESSAGE}
        </p>
      ) : (
        <object
          className="pdf-preview-frame"
          data={url}
          type="application/pdf"
          onError={() => setResult({ url, failed: true, pages: null })}
        >
          <p>
            Your browser can't display this PDF. <a href={url}>Download it</a>.
          </p>
        </object>
      )}
    </section>
  )
}
