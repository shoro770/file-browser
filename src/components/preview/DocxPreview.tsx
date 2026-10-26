import { use } from 'react'
import { useDocx } from '../../hooks/useDocx'
import type { DocxPreviewProps } from '../../types'
import RenderedContent from './RenderedContent'

/**
 * Shows a Word document's text and basic formatting as inert content. The HTML arrives as a
 * sanitized fragment (the same sanitizer as Markdown) and is appended as nodes, never as a string.
 * A file that cannot be converted rejects to the preview boundary, which shows the Metadata Card.
 */
export default function DocxPreview({ source }: DocxPreviewProps) {
  const fragment = use(useDocx(source))
  return (
    <div className="docx-preview">
      <RenderedContent fragment={fragment} />
    </div>
  )
}
