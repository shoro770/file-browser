/**
 * Pure helpers for rendered Markdown: heading anchors that cannot clash with the app's own ids.
 */

/** Prefix on every generated heading id, so a file cannot clobber ids such as `root` or `preview-title`. */
export const HEADING_ID_PREFIX = 'md-'

/**
 * Turns heading text into a GitHub-style slug.
 *
 * @param heading - Visible heading text.
 * @returns Lower-case words joined by hyphens, without punctuation; `''` when nothing is left.
 */
export function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')
}

/**
 * Builds the id for each heading in document order, de-duplicating repeats.
 *
 * @param headings - Visible text of each heading, in order.
 * @returns One id per heading: prefixed slug, with `-1`, `-2`... on repeats; an empty slug becomes `section`.
 */
export function headingIds(headings: readonly string[]): string[] {
  const used = new Set<string>()
  return headings.map((heading) => {
    const base = HEADING_ID_PREFIX + (slugify(heading) || 'section')
    let id = base
    // A suffixed id can equal another heading's own slug ("Intro 1"), so test against every id handed out.
    for (let count = 1; used.has(id); count++) id = `${base}-${count}`
    used.add(id)
    return id
  })
}

/**
 * Maps an in-page link target to a generated heading id.
 *
 * @param href - A link `href` such as `#My-Heading`.
 * @returns The prefixed id to look up, or `null` when `href` is not a `#fragment` with a usable name.
 */
export function anchorTarget(href: string): string | null {
  if (!href.startsWith('#')) return null
  let fragment = href.slice(1)
  try {
    fragment = decodeURIComponent(fragment)
  } catch {
    // keep the raw fragment
  }
  const slug = slugify(fragment)
  return slug === '' ? null : HEADING_ID_PREFIX + slug
}
