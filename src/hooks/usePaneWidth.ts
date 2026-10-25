import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { TREE_WIDTH_DEFAULT, clampTreeWidth, treeWidthBounds } from '../lib/layout'

/**
 * Holds the tree pane width and publishes it as `--tree-width` through a constructable
 * stylesheet, so no inline `style` attribute is ever written. The width lives in memory
 * only, so a reload returns to the default. A window resize re-clamps the stored width.
 *
 * @returns The clamped width, its limits, a setter that clamps, and a reset to the default.
 */
export function usePaneWidth(): {
  width: number
  min: number
  max: number
  setWidth: (width: number) => void
  reset: () => void
} {
  const [requested, setRequested] = useState(TREE_WIDTH_DEFAULT)
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth)

  useEffect(() => {
    const onResize = () => {
      setWindowWidth(window.innerWidth)
      setRequested((current) => clampTreeWidth(current, window.innerWidth))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { min, max } = treeWidthBounds(windowWidth)
  const width = clampTreeWidth(requested, windowWidth)

  useLayoutEffect(() => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(`:root { --tree-width: ${width}px; }`)
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((other) => other !== sheet)
    }
  }, [width])

  const setWidth = useCallback((next: number) => setRequested(clampTreeWidth(next, window.innerWidth)), [])
  const reset = useCallback(() => setRequested(TREE_WIDTH_DEFAULT), [])
  return { width, min, max, setWidth, reset }
}
