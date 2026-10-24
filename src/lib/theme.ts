import { THEMES } from '../types'
import type { Theme } from '../types'

/**
 * Narrows an unknown value to a known theme name.
 *
 * @param value - Any value, e.g. a string read from storage.
 * @returns The theme if `value` is exactly `light`, `dark` or `sand`; otherwise `null`.
 */
export function parseTheme(value: unknown): Theme | null {
  return THEMES.find((theme) => theme === value) ?? null
}

/**
 * Chooses the theme to apply. A valid stored theme wins; otherwise the system
 * preference decides between dark and light. Never defaults to sand.
 *
 * @param stored - The raw stored theme value (may be invalid or absent).
 * @param prefersDark - Whether the system prefers a dark colour scheme.
 * @returns The theme to apply.
 */
export function resolveTheme(stored: unknown, prefersDark: boolean): Theme {
  return parseTheme(stored) ?? (prefersDark ? 'dark' : 'light')
}
