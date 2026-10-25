import type { PreviewSource } from '../types'
import { renderMarkdown } from '../services/markdown'

/** One render per source object; every selection builds a new source, so a reselect renders again. */
const renders = new WeakMap<PreviewSource, Promise<DocumentFragment>>()

/**
 * Starts (once) and returns the render of a Markdown source, for React's `use()`.
 * A rejection is left for the preview boundary; it is never read here.
 *
 * @param source - The ready preview source; it must hold leading text.
 * @returns A promise of the sanitized fragment.
 */
export function useMarkdown(source: PreviewSource): Promise<DocumentFragment> {
  let render = renders.get(source)
  if (!render) {
    render = source.text ? renderMarkdown(source.text) : Promise.reject(new Error('markdown preview needs text'))
    renders.set(source, render)
  }
  return render
}
