import { useLayoutEffect, useRef } from 'react'
import type { PdfPreviewProps } from '../../types'

/**
 * Shows a PDF through the browser's own viewer: `<object type="application/pdf">` over the
 * session's `blob:` URL. The viewer scrolls the pages continuously, so there are no page or
 * zoom controls here. The fallback text shows only if the browser cannot embed PDFs.
 */
export default function PdfPreview({ source, onError }: PdfPreviewProps) {
  const url = source.pdfUrl
  const object = useRef<HTMLObjectElement>(null)
  // The pane passes a new `onError` every render; the listener reads the latest one.
  const latest = useRef(onError)
  useLayoutEffect(() => {
    latest.current = onError
  })

  // React does not wire `onError` on `<object>`, so listen natively. A layout effect attaches
  // it at commit, before any load task can report a failure.
  useLayoutEffect(() => {
    const element = object.current
    if (!element) return
    const report = () => latest.current?.()
    element.addEventListener('error', report)
    return () => element.removeEventListener('error', report)
  }, [url])

  if (!url) throw new Error('pdf preview needs an object URL')

  return (
    <div className="pdf-preview">
      <object ref={object} className="pdf-preview__object" type="application/pdf" data={url} title={source.meta.name}>
        This browser can't display PDF files here.
      </object>
    </div>
  )
}
