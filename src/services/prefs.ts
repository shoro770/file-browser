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

/** localStorage key for dotfile visibility. */
const SHOW_DOTFILES_KEY = 'showDotfiles'

/**
 * Reads the stored dotfile visibility.
 *
 * @returns `false` only if `"false"` is stored; `true` (shown) when absent, invalid or storage is unavailable.
 */
export function readShowDotfiles(): boolean {
  try {
    return window.localStorage.getItem(SHOW_DOTFILES_KEY) !== 'false'
  } catch {
    return true
  }
}

/**
 * Stores dotfile visibility. Failure (e.g. storage unavailable) is silent.
 *
 * @param show - Whether dotfiles are shown.
 */
export function writeShowDotfiles(show: boolean): void {
  try {
    window.localStorage.setItem(SHOW_DOTFILES_KEY, String(show))
  } catch {
    // Storage is optional; the preference just won't persist.
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
