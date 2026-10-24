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

/** A file or directory in the browsed tree. Pure, serializable data. */
export interface FileItem {
  /** Normalized relative path: `/`-separated, no leading or trailing slash; the root is `''`. */
  id: string
  /** Base name including extension, e.g. `"report.pdf"`. */
  name: string
  /** `"/"` + `id`, e.g. `"/documents/report.pdf"`. */
  path: string
  /** `true` for directories, `false` for regular files. */
  isDirectory: boolean
  /** Size in bytes (format with `formatSize`); absent until the file is read. */
  size?: number
  /** Last modification time; absent until the file is read. */
  updatedAt?: Date
  /** Content category; absent for directories. */
  category?: FileCategory
}

/** Every kind-glyph shape, in display order. Source of truth for `GlyphKind`. */
export const GLYPH_KINDS = ['folder', 'file', 'image', 'document', 'pdf', 'text', 'binary'] as const

/** One of the seven inline-SVG kind glyphs. */
export type GlyphKind = (typeof GLYPH_KINDS)[number]

/** Immutable view of the tree store, as read by components. */
export interface TreeSnapshot {
  /** Name of the open Workspace Folder; `null` when none is open. */
  rootName: string | null
  /** Every loaded item, keyed by `id`. */
  items: Readonly<Record<string, FileItem>>
  /** Ids of the Workspace Folder's immediate children, in display order. */
  rootIds: readonly string[]
  /** Id of the selected file; `null` when nothing is selected. */
  selectedId: string | null
}

/** Result of asking the store to open a folder. */
export type OpenOutcome =
  | { status: 'opened'; name: string; count: number }
  | { status: 'cancelled' }
  | { status: 'denied' }

/** Props for the `Glyph` component. */
export interface GlyphProps {
  kind: GlyphKind
}

/** Props for the `Tree` component. */
export interface TreeProps {
  /** Items to show, already in display order. */
  items: readonly FileItem[]
  /** Id of the selected item, or `null`. */
  selectedId: string | null
  /** Changing this value moves focus to the first row. */
  focusToken: number
}

/** Props for the `TreeNode` component. */
export interface TreeNodeProps {
  item: FileItem
  /** 1-based depth in the tree. */
  level: number
  /** Number of siblings, including this item. */
  setSize: number
  /** 1-based position among siblings. */
  posInSet: number
  selected: boolean
  /** Roving-tabindex value: `0` for the single tab stop, `-1` otherwise. */
  tabIndex: 0 | -1
  /** Called when the row receives focus. */
  onFocusRow: (id: string) => void
}

/** Props for the `OpenFolderPrompt` component. */
export interface OpenFolderPromptProps {
  /** Called when the user activates Open folder. */
  onOpen: () => void
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

/** Every available colour theme. Source of truth for `Theme`. */
export const THEMES = ['light', 'dark', 'sand'] as const

/** A named colour theme, applied as `data-theme` on `<html>`. */
export type Theme = (typeof THEMES)[number]

/** Props for the `App` component. */
export interface AppProps {
  /** Whether this browser can open a folder picker (`showDirectoryPicker`). */
  folderPickerSupported: boolean
}
