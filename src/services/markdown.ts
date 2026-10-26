/**
 * Markdown to inert DOM: parse, sanitize, then give headings stable ids. This is the only
 * module that imports the parser, and it is loaded only through the lazy Markdown renderer
 * (AD-9, AD-15).
 */

import { marked } from 'marked'
import { trimToLastLine } from '../lib/text'
import type { TextContent } from '../types'
import { addHeadingIds } from './headings'
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
  addHeadingIds(fragment)
  return fragment
}
