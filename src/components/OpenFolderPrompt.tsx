import type { OpenFolderPromptProps } from '../types'

/** Empty state shown before any folder is open: what the app does and the primary action. */
export default function OpenFolderPrompt({ onOpen }: OpenFolderPromptProps) {
  return (
    <div className="prompt">
      <svg
        className="prompt__glyph"
        width="48"
        height="48"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M1.75 4.25a1 1 0 0 1 1-1h3.1l1.5 1.5h4.9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9.5a1 1 0 0 1-1-1z" />
      </svg>
      <h2 className="prompt__title">Open a folder to start browsing.</h2>
      <p className="prompt__body">
        Files are read in this browser tab. Nothing is uploaded, and nothing is ever changed.
      </p>
      <button type="button" className="button button--primary" onClick={onOpen}>
        Open folder
      </button>
    </div>
  )
}
