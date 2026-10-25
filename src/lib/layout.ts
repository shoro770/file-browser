/** Default tree pane width in pixels. */
export const TREE_WIDTH_DEFAULT = 280
/** Smallest tree pane width in pixels. */
export const TREE_WIDTH_MIN = 220
/** Largest tree pane width in pixels, before the window-share and preview limits. */
export const TREE_WIDTH_CAP = 480
/** Largest share of the window the tree pane may take. */
export const TREE_SHARE_MAX = 0.4
/** Narrowest the preview pane may become, in pixels. */
export const PREVIEW_MIN = 320
/** Keyboard step in pixels. */
export const STEP = 16
/** Keyboard step in pixels while Shift is held. */
export const STEP_SHIFT = 64

/**
 * Works out the tree width limits for a window. The preview floor is applied
 * before the minimum, so in narrow windows the minimum wins.
 *
 * @param windowWidth - Window width in pixels.
 * @returns The smallest and largest tree width; `max` is never below `min`.
 */
export function treeWidthBounds(windowWidth: number): { min: number; max: number } {
  const max = Math.min(TREE_WIDTH_CAP, windowWidth * TREE_SHARE_MAX, windowWidth - PREVIEW_MIN)
  return { min: TREE_WIDTH_MIN, max: Math.max(TREE_WIDTH_MIN, Math.floor(max)) }
}

/**
 * Keeps a tree width inside the limits for a window.
 *
 * @param width - Requested width in pixels.
 * @param windowWidth - Window width in pixels.
 * @returns The width, rounded and clamped to the limits.
 */
export function clampTreeWidth(width: number, windowWidth: number): number {
  const { min, max } = treeWidthBounds(windowWidth)
  return Math.min(max, Math.max(min, Math.round(width)))
}

/**
 * Applies a divider key to the current width.
 *
 * @param width - Current width in pixels.
 * @param key - The `KeyboardEvent.key` value.
 * @param shift - Whether Shift is held.
 * @param windowWidth - Window width in pixels.
 * @returns The new clamped width, or `null` when the key is not a divider key.
 */
export function nextTreeWidth(width: number, key: string, shift: boolean, windowWidth: number): number | null {
  const step = shift ? STEP_SHIFT : STEP
  switch (key) {
    case 'ArrowLeft':
      return clampTreeWidth(width - step, windowWidth)
    case 'ArrowRight':
      return clampTreeWidth(width + step, windowWidth)
    case 'Home':
      return treeWidthBounds(windowWidth).min
    case 'End':
      return treeWidthBounds(windowWidth).max
    case 'Enter':
      return clampTreeWidth(TREE_WIDTH_DEFAULT, windowWidth)
    default:
      return null
  }
}
