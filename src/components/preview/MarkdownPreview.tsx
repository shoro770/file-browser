import { use } from 'react'
import { useMarkdown } from '../../hooks/useMarkdown'
import type { MarkdownPreviewProps } from '../../types'
import RenderedContent from './RenderedContent'
import TruncationBanner from './TruncationBanner'

/**
 * Shows a Markdown file as formatted, inert content. The HTML arrives as a sanitized
 * fragment and is appended as nodes, never as a string.
 * A render that rejects throws to the preview boundary, which shows the Metadata Card.
 */
export default function MarkdownPreview({ source }: MarkdownPreviewProps) {
  const fragment = use(useMarkdown(source))
  return (
    <div className="markdown-preview">
      {source.text?.truncated && <TruncationBanner totalSize={source.text.totalSize} />}
      <RenderedContent fragment={fragment} />
    </div>
  )
}
