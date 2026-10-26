/**
 * Word document to inert DOM: convert, sanitize through the same chokepoint as Markdown, then give
 * headings stable ids. This is the only module that imports the converter, and it is loaded only
 * through the lazy Word renderer (AD-9, AD-15).
 */

import { anchorTarget } from '../lib/markdown'
import { addHeadingIds } from './headings'
import { sanitize } from './sanitize'

/**
 * Turns `#bookmark` links with no target in the output into plain text. Sanitizing strips every
 * `id`, so only headings can be reached; a link to anything else would be a dead tab stop.
 *
 * @param fragment - Sanitized fragment with heading ids, edited in place.
 */
function unwrapDeadLinks(fragment: DocumentFragment): void {
  const ids = new Set([...fragment.querySelectorAll('[id]')].map((element) => element.id))
  for (const link of fragment.querySelectorAll('a')) {
    const target = anchorTarget(link.getAttribute('href') ?? '')
    if (target === null || !ids.has(target)) link.replaceWith(...link.childNodes)
  }
}

/**
 * Renders a `.docx` file.
 *
 * @param file - The document; its bytes are read here, in full.
 * @param signal - Aborted when a newer selection replaces this one; a late result is then discarded.
 * @returns A sanitized fragment; rejects if the file is not a readable `.docx`, the converter or
 *   sanitizer throws, or `signal` aborted.
 */
export async function renderDocx(file: File, signal: AbortSignal): Promise<DocumentFragment> {
  const [{ default: mammoth }, arrayBuffer] = await Promise.all([import('mammoth'), file.arrayBuffer()])
  signal.throwIfAborted()
  // An image that cannot be read (a linked one, with external files off) keeps an empty `src`
  // instead of vanishing, so the sanitizer shows the blocked placeholder in its place.
  const convertImage = mammoth.images.imgElement(async (image) => {
    try {
      return { src: `data:${image.contentType};base64,${await image.readAsBase64String()}` }
    } catch {
      return { src: '' }
    }
  })
  // External files stay off even if the default changes; images arrive as in-document `data:` URLs.
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer }, { externalFileAccess: false, convertImage })
  signal.throwIfAborted()
  const fragment = sanitize(html, { allowDataImages: true })
  addHeadingIds(fragment)
  unwrapDeadLinks(fragment)
  return fragment
}
