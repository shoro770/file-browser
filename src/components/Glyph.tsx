import type { ReactNode } from 'react'
import type { GlyphKind, GlyphProps } from '../types'

/** Inner shapes per kind, drawn on a 16px grid. */
const SHAPES: Record<GlyphKind, ReactNode> = {
  folder: <path d="M1.75 4.25a1 1 0 0 1 1-1h3.1l1.5 1.5h4.9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9.5a1 1 0 0 1-1-1z" />,
  file: <path d="M3.75 1.75h5.5l3 3v9.5h-8.5zM9.25 1.75v3h3" />,
  image: (
    <>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1" />
      <circle cx="5.5" cy="6" r="1" />
      <path d="M2 12.5l3.5-3.5 2.5 2.5 2-2 4 4" />
    </>
  ),
  document: <path d="M3.75 1.75h5.5l3 3v9.5h-8.5zM9.25 1.75v3h3M5.75 8h4.5M5.75 10h4.5M5.75 12h2.5" />,
  pdf: (
    <>
      <path d="M3.75 1.75h5.5l3 3v9.5h-8.5zM9.25 1.75v3h3" />
      <path d="M5.5 12.25V9h1.25a.9.9 0 0 1 0 1.8H5.5" />
      <path d="M8.25 9v3.25M10.75 9h-1" />
    </>
  ),
  text: <path d="M3.75 1.75h5.5l3 3v9.5h-8.5zM9.25 1.75v3h3M5.75 8h2.5M5.75 10h2.5M5.75 12h2.5" />,
  binary: (
    <>
      <path d="M3.75 1.75h5.5l3 3v9.5h-8.5zM9.25 1.75v3h3" />
      <rect x="5.5" y="7.5" width="2" height="2" />
      <rect x="8.5" y="10.5" width="2" height="2" />
    </>
  ),
}

/** Expand/collapse chevron (points right; CSS rotates it 90 degrees when expanded). Decorative. */
export function Chevron() {
  return (
    <svg
      className="chevron"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 3.5l4.5 4.5L6 12.5" />
    </svg>
  )
}

/** Loading spinner in the chevron's place (CSS animates it). Decorative. */
export function Spinner() {
  return (
    <svg
      className="spinner"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5" />
    </svg>
  )
}

/** Warning triangle shown beside the Unavailable caption. Decorative. */
export function Warning() {
  return (
    <svg
      className="warning"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 2.25l6 11H2zM8 6.5v3M8 11.5v.01" />
    </svg>
  )
}

/** A 16px inline-SVG kind glyph; decorative, so hidden from assistive technology. */
export default function Glyph({ kind }: GlyphProps) {
  return (
    <svg
      className="glyph"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[kind]}
    </svg>
  )
}
