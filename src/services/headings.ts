/**
 * Gives the headings of a sanitized fragment stable, prefixed ids so `#anchor` links can reach them.
 * Shared by the Markdown and Word renderers; sanitizing strips every `id`, so these are the only ones.
 */

import { headingIds } from '../lib/markdown'

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

/**
 * Adds a prefixed, de-duplicated `id` and `tabindex="-1"` to every heading, in place.
 *
 * @param fragment - Sanitized fragment, edited in place.
 */
export function addHeadingIds(fragment: DocumentFragment): void {
  const headings = [...fragment.querySelectorAll('h1, h2, h3, h4, h5, h6')]
  const ids = headingIds(headings.map(headingText))
  headings.forEach((heading, index) => {
    heading.setAttribute('id', ids[index])
    // Focusable by script only, so an in-page link can move keyboard and screen-reader focus here.
    heading.setAttribute('tabindex', '-1')
  })
}
