import type { HiddenFilesToggleProps } from '../types'
import { Eye, EyeSlash } from './Glyph'

/** Id of the visually hidden description the toggle points to. */
const DESCRIPTION_ID = 'hidden-files-description'

/**
 * Toolbar toggle for dotfile visibility. The accessible name is constant ("Hidden files");
 * `aria-pressed` true means dotfiles are shown. The visible Shown / Hidden word is decorative.
 */
export default function HiddenFilesToggle({ shown, onToggle }: HiddenFilesToggleProps) {
  return (
    <>
      <button
        type="button"
        className="button"
        aria-pressed={shown}
        aria-describedby={DESCRIPTION_ID}
        onClick={onToggle}
      >
        {shown ? <Eye /> : <EyeSlash />}
        Hidden files
        <span aria-hidden="true" className="button__state">
          {shown ? 'Shown' : 'Hidden'}
        </span>
      </button>
      <span id={DESCRIPTION_ID} className="visually-hidden">
        Pressed: hidden files are shown.
      </span>
    </>
  )
}
