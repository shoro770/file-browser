/** Suspense fallback for a lazy renderer: a visible status, never a blank body. */
export default function PreviewLoading() {
  return (
    <p className="preview__loading" role="status">
      Loading preview...
    </p>
  )
}
