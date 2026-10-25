/**
 * The one chokepoint that turns untrusted HTML (Markdown output, later DOCX output) into inert DOM.
 * It is an allowlist: anything not named here is removed. The result is a `DocumentFragment`
 * that the caller appends with `replaceChildren`, so no `innerHTML` is ever needed.
 * Needs the DOM, so it lives in `services/` (AD-1, AD-11).
 */

import DOMPurify from 'dompurify'
import type { SanitizeOptions } from '../types'

/** Label and accessible name of the stand-in for an image that is not shown. */
export const BLOCKED_IMAGE_LABEL = 'Remote image blocked'

/** Elements that survive. No script, style, frame, object, embed, form, svg or math. */
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'em', 'strong', 'b', 'i', 'u', 's', 'del', 'ins',
  'sub', 'sup', 'kbd', 'a', 'img', 'input',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
]

/** Attributes that survive. No `class`, `id`, `style`, `name` or `on*`; `src` only when data images are allowed. */
const ALLOWED_ATTR = ['href', 'alt', 'colspan', 'rowspan', 'align', 'start', 'type', 'checked', 'disabled']

/** Inline raster images, the only `data:` URLs that can ever stay. SVG is excluded. */
const DATA_IMAGE = /^data:image\/(?:png|jpe?g|gif|webp);base64,/i

/**
 * Attribute values DOMPurify lets through: anything without a URL scheme (so plain values like
 * `colspan="2"` survive), plus inline raster images when allowed. This is only the first filter;
 * `applyResourceRules` decides which `href` and `src` actually stay.
 */
const NO_SCHEME = /^(?![a-z][a-z0-9+.-]*:)/i
const NO_SCHEME_OR_DATA_IMAGE = new RegExp(`${NO_SCHEME.source}|${DATA_IMAGE.source}`, 'i')

/**
 * Builds the inline "image off" glyph, 16px, `currentColor`, decorative.
 *
 * @param doc - Document that owns the new nodes.
 * @returns The `<svg>` element.
 */
function imageOffGlyph(doc: Document): SVGElement {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = doc.createElementNS(ns, 'svg')
  for (const [name, value] of Object.entries({
    class: 'blocked-resource__glyph',
    width: '16',
    height: '16',
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  })) {
    svg.setAttribute(name, value)
  }
  const frame = doc.createElementNS(ns, 'rect')
  for (const [name, value] of Object.entries({ x: '1.75', y: '2.75', width: '12.5', height: '10.5', rx: '1.5' })) {
    frame.setAttribute(name, value)
  }
  const slash = doc.createElementNS(ns, 'path')
  slash.setAttribute('d', 'M2 14L14 2')
  svg.append(frame, slash)
  return svg
}

/**
 * Builds the blocked-resource placeholder that replaces an image.
 *
 * @param doc - Document that owns the new nodes.
 * @param alt - The image's alt text; shown as a caption when not empty.
 * @returns The placeholder element, named "Remote image blocked".
 */
function blockedPlaceholder(doc: Document, alt: string): HTMLElement {
  const box = doc.createElement('span')
  box.className = 'blocked-resource'
  box.setAttribute('role', 'img')
  box.setAttribute('aria-label', BLOCKED_IMAGE_LABEL)
  const label = doc.createElement('span')
  label.className = 'blocked-resource__label'
  label.textContent = BLOCKED_IMAGE_LABEL
  box.append(imageOffGlyph(doc), label)
  if (alt.trim() !== '') {
    const caption = doc.createElement('span')
    caption.className = 'blocked-resource__caption'
    caption.textContent = alt
    box.append(caption)
  }
  return box
}

/**
 * Applies the link, image and checkbox rules to already-cleaned nodes.
 *
 * @param fragment - Fragment returned by DOMPurify, edited in place.
 * @param allowDataImages - Whether inline raster `data:` images may stay.
 */
function applyResourceRules(fragment: DocumentFragment, allowDataImages: boolean): void {
  const doc = fragment.ownerDocument
  for (const link of fragment.querySelectorAll('a')) {
    // Only in-page anchors stay live; everything else is plain text.
    if (!(link.getAttribute('href') ?? '').startsWith('#')) link.replaceWith(...link.childNodes)
  }
  for (const image of fragment.querySelectorAll('img')) {
    const src = image.getAttribute('src') ?? ''
    if (allowDataImages && DATA_IMAGE.test(src)) continue
    image.replaceWith(blockedPlaceholder(doc, image.getAttribute('alt') ?? ''))
  }
  for (const input of fragment.querySelectorAll('input')) {
    const checked = input.hasAttribute('checked')
    for (const name of input.getAttributeNames()) input.removeAttribute(name)
    input.setAttribute('type', 'checkbox')
    input.setAttribute('disabled', '')
    if (checked) input.setAttribute('checked', '')
  }
}

/**
 * Cleans untrusted HTML into inert DOM. Removes scripts, event-handler and `style` attributes,
 * frames, objects, embeds and forms, and any `src` or `href` that leaves the page (including
 * `javascript:` and `data:`). Images become the "Remote image blocked" placeholder; `#anchor`
 * links stay and all other links become plain text. Parsing is inert: nothing loads or runs
 * before the markup has been cleaned.
 *
 * @param html - Untrusted HTML.
 * @param options - `allowDataImages` keeps inline raster `data:` images; off by default.
 * @returns A fragment safe to append to the page.
 */
export function sanitize(html: string, options: SanitizeOptions = {}): DocumentFragment {
  const allowDataImages = options.allowDataImages === true
  const fragment = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: allowDataImages ? [...ALLOWED_ATTR, 'src'] : ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: allowDataImages ? NO_SCHEME_OR_DATA_IMAGE : NO_SCHEME,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    RETURN_DOM_FRAGMENT: true,
  })
  applyResourceRules(fragment, allowDataImages)
  return fragment
}
