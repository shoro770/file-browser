/**
 * Markdown to inert DOM: parse, sanitize, then give headings stable ids. This is the only
 * module that imports the parser, and it is loaded only through the lazy Markdown renderer
 * (AD-9, AD-15).
 */

import { marked } from 'marked'
import { headingIds } from '../lib/markdown'
import { trimToLastLine } from '../lib/text'
import type { TextContent } from '../types'
import { sanitize } from './sanitize'

/**
 * Renders the leading text of a Markdown file.
 *
 * @param content - Leading text as read by the preview session.
 * @returns A sanitized fragment; rejects if the parser or sanitizer throws.
 */
export async function renderMarkdown(content: TextContent): Promise<DocumentFragment> {
  const markdown = trimToLastLine(content.text, content.truncated)
  const fragment = sanitize(marked.parse(markdown, { async: false }))
  const headings = [...fragment.querySelectorAll('h1, h2, h3, h4, h5, h6')]
  const ids = headingIds(headings.map(headingText))
  headings.forEach((heading, index) => {
    heading.setAttribute('id', ids[index])
    // Focusable by script only, so an in-page link can move keyboard and screen-reader focus here.
    heading.setAttribute('tabindex', '-1')
  })
  return fragment
}

/**
 * Reads a heading's text for its id, leaving out the blocked-image label so an image in a
 * heading contributes its alt text, not "Remote image blocked".
 *
 * @param heading - A heading from the sanitized fragment.
 * @returns The heading's visible text.
 */
function headingText(heading: Element): string {
  const copy = heading.cloneNode(true) as Element
  for (const label of copy.querySelectorAll('.blocked-resource__label')) label.remove()
  return copy.textContent ?? ''
}
