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

/** Open eye: hidden files are shown. Decorative. */
export function Eye() {
  return (
    <svg
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
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  )
}

/** Crossed-out eye: hidden files are hidden. Decorative. */
export function EyeSlash() {
  return (
    <svg
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
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
      <path d="M2.5 13.5l11-11" />
    </svg>
  )
}

/** Circular arrow for Refresh. Decorative. */
export function RefreshIcon() {
  return (
    <svg
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
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v2.75h-2.75" />
    </svg>
  )
}

/** Sun: the Light theme. Decorative. */
export function Sun() {
  return (
    <svg
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
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1" />
    </svg>
  )
}

/** Crescent moon: the Dark theme. Decorative. */
export function Moon() {
  return (
    <svg
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
      <path d="M13.5 9.5A5.75 5.75 0 0 1 6.5 2.5a5.75 5.75 0 1 0 7 7z" />
    </svg>
  )
}

/** Sand dunes: the Warm Sand theme. Decorative. */
export function Dune() {
  return (
    <svg
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
      <path d="M1.5 12.5c2-4 4-6 6-3.5s4 .5 7-2.5M1.5 14.5h13" />
    </svg>
  )
}

/** Check mark: marks the active theme segment. Decorative. */
export function Check() {
  return (
    <svg
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
      <path d="M3 8.5l3.25 3.25L13 4.75" />
    </svg>
  )
}

/** A 16px inline-SVG kind glyph; decorative, so hidden from assistive technology. */
export default function Glyph({ kind, large = false }: GlyphProps) {
  return (
    <svg
      className={large ? 'glyph glyph--large' : 'glyph'}
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

/** Magnifying glass for the search box. Decorative. */
export function MagnifyingGlass() {
  return (
    <svg
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
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5l3.5 3.5" />
    </svg>
  )
}

/** Cross for clearing the search box. Decorative. */
export function Close() {
  return (
    <svg
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
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}
