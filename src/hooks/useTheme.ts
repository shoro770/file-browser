import { useCallback, useState } from 'react'
import { parseTheme, resolveTheme } from '../lib/theme'
import { readTheme, systemPrefersDark, writeTheme } from '../services/prefs'
import type { Theme } from '../types'

/**
 * Holds the active theme. The initial value is whatever `data-theme` already says (set before
 * first paint by `main.tsx`), else the stored or system default. Choosing a theme sets
 * `data-theme` on `<html>` at once and then remembers it; a storage failure is silent.
 *
 * @returns The active theme and a setter that applies and persists it.
 */
export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(
    () => parseTheme(document.documentElement.dataset.theme) ?? resolveTheme(readTheme(), systemPrefersDark()),
  )
  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next
    setThemeState(next)
    writeTheme(next)
  }, [])
  return { theme, setTheme }
}
