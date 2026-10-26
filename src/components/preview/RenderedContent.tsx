import { useLayoutEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { anchorTarget } from '../../lib/markdown'
import type { RenderedContentProps } from '../../types'

/**
 * Appends a sanitized fragment as nodes, never as a string, and keeps `#anchor` clicks inside
 * the pane: they scroll to and focus the target heading. Every other link was already made
 * plain text by the sanitizer. Shared by the Markdown and Word renderers.
 */
export default function RenderedContent({ fragment }: RenderedContentProps) {
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

  return <div className="rendered-content" ref={content} onClick={scrollToAnchor} />
}
