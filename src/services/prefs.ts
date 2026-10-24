/** localStorage key for the chosen theme. */
const THEME_KEY = 'theme'

/**
 * Reads the stored theme preference. Validate the result with `parseTheme`.
 *
 * @returns The raw stored value, or `null` if absent or storage is unavailable.
 */
export function readTheme(): string | null {
  try {
    return window.localStorage.getItem(THEME_KEY)
  } catch {
    return null
  }
}

/**
 * Whether the system prefers a dark colour scheme.
 *
 * @returns `true` if `prefers-color-scheme: dark` matches; `false` otherwise or if unavailable.
 */
export function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}
