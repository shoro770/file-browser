/**
 * The only module that touches the system clipboard. Copying is not a file write, but it is
 * browser access, so it lives here and not in `src/lib/`.
 */

/**
 * Copies text to the clipboard.
 *
 * @param text - What to copy.
 * @returns `true` if the browser accepted it, `false` if the clipboard is unavailable or refused. Never throws.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
