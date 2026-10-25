import { use, useLayoutEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { useMarkdown } from '../../hooks/useMarkdown'
import { anchorTarget } from '../../lib/markdown'
import type { MarkdownPreviewProps } from '../../types'
import TruncationBanner from './TruncationBanner'

/**
 * Shows a Markdown file as formatted, inert content. The HTML arrives as a sanitized
 * fragment and is appended as nodes, never as a string. No click navigates the app:
 * `#anchor` links scroll inside the pane and every other link was already made plain text.
 * A render that rejects throws to the preview boundary, which shows the Metadata Card.
 */
export default function MarkdownPreview({ source }: MarkdownPreviewProps) {
  const fragment = use(useMarkdown(source))
  const content = useRef<HTMLDivElement>(null)

  // A clone, so a repeated effect run (StrictMode) still has nodes to append.
  useLayoutEffect(() => {
    content.current?.replaceChildren(fragment.cloneNode(true))
  }, [fragment])

  const scrollToAnchor = (event: MouseEvent<HTMLDivElement>) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null
    if (!link) return
    event.preventDefault()
    const id = anchorTarget(link.getAttribute('href') ?? '')
    const target = id === null ? undefined : [...event.currentTarget.querySelectorAll('[id]')].find((el) => el.id === id)
    // Focus moves with the view, so keyboard and screen-reader users land on the heading.
    if (target instanceof HTMLElement) target.focus({ preventScroll: true })
    target?.scrollIntoView?.()
  }

  return (
    <div className="markdown-preview">
      {source.text?.truncated && <TruncationBanner totalSize={source.text.totalSize} />}
      <div className="markdown-preview__content" ref={content} onClick={scrollToAnchor} />
    </div>
  )
}
