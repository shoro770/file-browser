import type { PreviewSource } from '../types'
import { renderDocx } from '../services/docx'

/** One render per source object; every selection builds a new source, so a reselect renders again. */
const renders = new WeakMap<PreviewSource, Promise<DocumentFragment>>()

/**
 * Starts (once) and returns the render of a Word source, for React's `use()`.
 * A rejection is left for the preview boundary; it is never read here.
 *
 * @param source - The ready preview source.
 * @returns A promise of the sanitized fragment.
 */
export function useDocx(source: PreviewSource): Promise<DocumentFragment> {
  let render = renders.get(source)
  if (!render) {
    render = renderDocx(source.file, source.signal)
    renders.set(source, render)
  }
  return render
}
