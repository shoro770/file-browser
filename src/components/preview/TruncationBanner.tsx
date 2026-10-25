import { truncationNotice } from '../../lib/text'
import type { TruncationBannerProps } from '../../types'

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

/** Static banner pinned above a preview that was cut at 1 MB. Not dismissible, not a live region. */
export default function TruncationBanner({ totalSize }: TruncationBannerProps) {
  return (
    <p className="truncation-banner">
      <InfoGlyph />
      {truncationNotice(totalSize)}
    </p>
  )
}
