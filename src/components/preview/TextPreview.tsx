import type { TextPreviewProps } from '../../types'
import TruncationBanner from './TruncationBanner'

/**
 * Shows the leading text of a file as inert monospaced text, with a static banner pinned
 * above it when the file was cut at 1 MB. The text is a child text node, never HTML.
 */
export default function TextPreview({ source }: TextPreviewProps) {
  const content = source.text
  if (!content) throw new Error('text preview needs text content')
  return (
    <div className="text-preview">
      {content.truncated && <TruncationBanner totalSize={content.totalSize} />}
      <pre className="text-preview__content">{content.text}</pre>
    </div>
  )
}
