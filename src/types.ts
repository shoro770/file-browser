/**
 * Core domain types for the file browser.
 */

/**
 * Every supported file category, in display order.
 * Source of truth for `FileCategory`; use it to iterate (e.g. filter menus).
 */
export const FILE_CATEGORIES = [
  'document',
  'image',
  'video',
  'audio',
  'archive',
  'code',
  'other',
] as const

/** Broad content category of a file, used for icons and filtering. */
export type FileCategory = (typeof FILE_CATEGORIES)[number]

/** A file or directory in the browsed tree. */
export interface FileItem {
  /** Stable unique identifier. */
  id: string
  /** Base name including extension, e.g. `"report.pdf"`. */
  name: string
  /** Full path from the browsed root, e.g. `"/documents/report.pdf"`. */
  path: string
  /** Size in bytes (format with `formatSize`). */
  size: number
  /** `true` for directories, `false` for regular files. */
  isDirectory: boolean
  /** Last modification time. */
  updatedAt: Date
  /** Content category. */
  category: FileCategory
  /** Directory contents; omitted for files and for directories not yet loaded. */
  children?: FileItem[]
}

/** Props for the `FileRow` component. */
export interface FileRowProps {
  item: FileItem
  /** Whether this row is the active selection. */
  selected?: boolean
  /**
   * Roving-tabindex value: `0` makes the row a tab stop, `-1` removes it from
   * the tab order (a parent listbox then moves focus with arrow keys).
   * Defaults to `0` for standalone use.
   */
  tabIndex?: 0 | -1
  /** Called on click, Enter or Space. */
  onSelect?: (item: FileItem) => void
}

/** Field a file listing can be sorted by. */
export type SortField = 'name' | 'size' | 'updatedAt'

/** Sort order: ascending or descending. */
export type SortDirection = 'asc' | 'desc'

/** A complete sort setting for a listing. */
export interface SortOptions {
  field: SortField
  direction: SortDirection
}
