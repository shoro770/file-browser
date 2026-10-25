import { truncationNotice } from '../../lib/text'
import type { TextPreviewProps } from '../../types'

/** Info glyph for the truncation banner. Decorative. */
function InfoGlyph() {
  return (
    <svg
      className="truncation-banner__glyph"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25V11M8 5v.01" />
    </svg>
  )
}

/**
 * Shows the leading text of a file as inert monospaced text, with a static banner pinned
 * above it when the file was cut at 1 MB. The text is a child text node, never HTML.
 */
export default function TextPreview({ source }: TextPreviewProps) {
  const content = source.text
  if (!content) throw new Error('text preview needs text content')
  return (
    <div className="text-preview">
      {content.truncated && (
        <p className="truncation-banner">
          <InfoGlyph />
          {truncationNotice(content.totalSize)}
        </p>
      )}
      <pre className="text-preview__content">{content.text}</pre>
    </div>
  )
}
