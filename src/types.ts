import type { ReactNode } from 'react'

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
  /** Ordered child ids of every folder that has been listed, keyed by folder `id`. */
  childIds: Readonly<Record<string, readonly string[]>>
  /** Ids of folders currently expanded (or being expanded). */
  expandedIds: ReadonlySet<string>
  /** Ids of folders whose first read has run past the loading delay. */
  loadingIds: ReadonlySet<string>
  /** Ids of entries that could not be read. */
  unavailableIds: ReadonlySet<string>
  /** Whether dotfiles are shown (the default) or hidden. */
  showDotfiles: boolean
  /** Id of the selected file; `null` when nothing is selected. */
  selectedId: string | null
}

/** Result of asking the store to open a folder. */
export type OpenOutcome =
  | { status: 'opened'; name: string; count: number }
  | { status: 'cancelled' }
  | { status: 'denied' }

/** One visible row of the tree, in display order (placeholder rows included). */
export interface VisibleRow {
  /** The item id, or `placeholderKey(folderId)` (`/placeholder:{folderId}`) for a placeholder row. */
  key: string
  /** The item id; `null` for a placeholder row. */
  itemId: string | null
  /** Key of the parent row; `null` for top-level rows. */
  parentKey: string | null
  /** Whether the row is a folder. */
  isDirectory: boolean
  /** Whether the row is an expanded folder. */
  expanded: boolean
  /** Item name; `''` for a placeholder row. */
  name: string
}

/** Props for the `Glyph` component. */
export interface GlyphProps {
  kind: GlyphKind
}

/** Props for the `Tree` component. */
export interface TreeProps {
  /** Every loaded item, keyed by `id`. */
  items: Readonly<Record<string, FileItem>>
  /** Ids of the top-level rows, in display order. */
  rootIds: readonly string[]
  /** Ordered child ids of every listed folder. */
  childIds: Readonly<Record<string, readonly string[]>>
  /** Ids of expanded folders. */
  expandedIds: ReadonlySet<string>
  /** Ids of folders showing a loading state. */
  loadingIds: ReadonlySet<string>
  /** Ids of entries that could not be read. */
  unavailableIds: ReadonlySet<string>
  /** Whether dotfiles are shown; when `false` they are left out of every level. */
  showDotfiles: boolean
  /** Called to expand or collapse a folder. */
  onToggle: (id: string) => void
  /** Called to select a file. */
  onSelect: (id: string) => void
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
  /** Called with the row key when the row receives focus. */
  onFocusRow: (key: string) => void
  /** Folders only: whether the folder is expanded. */
  expanded: boolean
  /** Folders only: whether the first read is slow enough to show a spinner. */
  loading: boolean
  /** Whether the entry could not be read; shows the Unavailable mark. */
  unavailable: boolean
  /** Whether the entry is a dotfile (or inside a dotfile folder); dims its glyph and label at rest. */
  dotfile: boolean
  /** Called to expand or collapse a folder row. */
  onToggle: (id: string) => void
  /** Called to select a file row. */
  onSelect: (id: string) => void
  /** Rendered inside the row's `role="group"` (child rows or placeholders). */
  children?: ReactNode
}

/** Props for a placeholder row ("Loading...", "Empty folder"). */
export interface TreePlaceholderProps {
  /** Row key, `placeholderKey(folderId)`. */
  rowKey: string
  /** Roving-tabindex value: `0` for the single tab stop, `-1` otherwise. */
  tabIndex: 0 | -1
  /** Called with the row key when the row receives focus. */
  onFocusRow: (key: string) => void
  /** Visible text. */
  label: string
  /** 1-based depth in the tree. */
  level: number
}

/** Props for the `HiddenFilesToggle` component. */
export interface HiddenFilesToggleProps {
  /** Whether dotfiles are currently shown. */
  shown: boolean
  /** Called when the user activates the toggle. */
  onToggle: () => void
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
