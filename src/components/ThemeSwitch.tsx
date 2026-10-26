import { useId } from 'react'
import type { JSX } from 'react'
import { useTheme } from '../hooks/useTheme'
import { THEMES } from '../types'
import type { Theme } from '../types'
import { Check, Dune, Moon, Sun } from './Glyph'

/** Visible label per theme. */
const LABELS: Record<Theme, string> = { light: 'Light', dark: 'Dark', sand: 'Warm Sand' }

/** Leading glyph per theme. */
const GLYPHS: Record<Theme, () => JSX.Element> = { light: Sun, dark: Moon, sand: Dune }

/**
 * Toolbar theme control: a joined group of three native radios. The checked radio is the single
 * tab stop and arrow keys move and select. The active segment also shows a check glyph, so state
 * is never colour alone. It owns its state through `useTheme`, so the app shell stays stateless.
 */
export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const name = useId()
  return (
    <div className="theme-switch" role="radiogroup" aria-label="Theme">
      {THEMES.map((value) => {
        const ThemeGlyph = GLYPHS[value]
        const active = value === theme
        return (
          <label key={value} className={active ? 'theme-switch__segment is-active' : 'theme-switch__segment'}>
            <input
              type="radio"
              className="theme-switch__input"
              name={name}
              value={value}
              checked={active}
              onChange={() => setTheme(value)}
            />
            <span className="theme-switch__check">
              <Check />
            </span>
            <ThemeGlyph />
            <span>{LABELS[value]}</span>
          </label>
        )
      })}
    </div>
  )
}
