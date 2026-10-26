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
  /** Whether a Refresh is running. */
  refreshing: boolean
  /** Bumped once per successful Refresh; the preview reload key. */
  refreshCount: number
}

/** Result of asking the store to refresh the tree. */
export type RefreshOutcome =
  | { status: 'refreshed'; selectionCleared: boolean; clearedName: string | null }
  | { status: 'failed' }
  | { status: 'skipped' }

/** The cached tree state that Refresh reconciles against fresh listings. */
export interface ReconcileState {
  items: Readonly<Record<string, FileItem>>
  rootIds: readonly string[]
  childIds: Readonly<Record<string, readonly string[]>>
  expandedIds: ReadonlySet<string>
  unavailableIds: ReadonlySet<string>
  selectedId: string | null
}

/** Freshly read levels: the root (key `''`) and each expanded folder that could be listed. */
export interface FreshLevels {
  /** Children by folder id, in display order. */
  levels: Readonly<Record<string, readonly FileItem[]>>
  /** Expanded folders that could not be read. */
  failed: ReadonlySet<string>
}

/** Tree state after reconciling, plus whether the Selection was dropped. */
export interface ReconcileResult extends ReconcileState {
  selectionCleared: boolean
}

/** Props for the `RefreshButton` component. */
export interface RefreshButtonProps {
  /** Whether a folder is open; the button is disabled without one. */
  enabled: boolean
  /** Whether a Refresh is running. */
  refreshing: boolean
  /** Called when the user activates Refresh. */
  onRefresh: () => void
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
  /** Draw at 48px (the Metadata Card) instead of 16px. */
  large?: boolean
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

/** Props for the `PaneDivider` component. */
export interface PaneDividerProps {
  /** Current tree pane width in pixels. */
  width: number
  /** Smallest allowed width in pixels. */
  min: number
  /** Largest allowed width in pixels. */
  max: number
  /** Id of the pane the divider resizes. */
  controls: string
  /** Called with a requested width; the owner clamps it. */
  onChange: (width: number) => void
  /** Called to return to the default width. */
  onReset: () => void
}

/** Every preview kind. Source of truth for `PreviewKind`. */
export const PREVIEW_KINDS = ['text', 'markdown', 'pdf', 'docx', 'image', 'metadata'] as const

/** Which renderer a file gets, resolved from its name and device-reported type only. */
export type PreviewKind = (typeof PREVIEW_KINDS)[number]

/** Details of the selected file, read through `getFile()` for the Selection only. */
export interface PreviewMeta {
  /** Base name including extension. */
  name: string
  /** Size in bytes. */
  size: number
  /** Last modification time. */
  updatedAt: Date
  /** Device-reported MIME type; `''` when unknown. */
  mime: string
  /** Resolved preview kind. */
  kind: PreviewKind
}

/** Leading text of a `text` file, read by the preview session. */
export interface TextContent {
  /** Decoded text, at most the first 1 MB. */
  text: string
  /** Whether the file is larger than what `text` holds. */
  truncated: boolean
  /** Full size of the file in bytes. */
  totalSize: number
}

/** What a renderer receives: the file contents, a cancellation signal and resolved details. Never a handle. */
export interface PreviewSource {
  file: File
  /** Leading text, set only for the `text` kind. */
  text?: TextContent
  /** `blob:` URL for the `<img>`, set only for the `image` kind; revoked by the session. */
  imageUrl?: string
  /** `blob:` URL for the PDF `<object>`, set only for the `pdf` kind; revoked by the session. */
  pdfUrl?: string
  /** Aborted when a newer selection replaces this one. */
  signal: AbortSignal
  meta: PreviewMeta
}

/** Outcome of loading the selected file's details. */
export type PreviewState =
  | { status: 'idle' }
  | { status: 'ready'; id: string; source: PreviewSource }
  | { status: 'failed'; id: string; name: string }

/** Options for `sanitize`. */
export interface SanitizeOptions {
  /** Keep inline raster `data:image/` sources. Off by default: every image becomes the blocked placeholder. */
  allowDataImages?: boolean
}

/** Props for the `MarkdownPreview` component. */
export interface MarkdownPreviewProps {
  source: PreviewSource
}

/** Props for the `DocxPreview` component. */
export interface DocxPreviewProps {
  source: PreviewSource
}

/** Props for the `PdfPreview` component. */
export interface PdfPreviewProps {
  source: PreviewSource
  /** Called when the embed reports that it could not load the PDF. */
  onError?: () => void
}

/** Props for the `RenderedContent` component. */
export interface RenderedContentProps {
  /** Sanitized fragment from `services/sanitize`; appended as a clone. */
  fragment: DocumentFragment
}

/** Props for the `TruncationBanner` component. */
export interface TruncationBannerProps {
  /** Full size of the cut file in bytes. */
  totalSize: number
}

/** Props for the `TextPreview` component. */
export interface TextPreviewProps {
  source: PreviewSource
}

/** Props for the `ImagePreview` component. */
export interface ImagePreviewProps {
  source: PreviewSource
  /** Called when the browser cannot decode the image. */
  onError?: () => void
}

/** Props for the `PreviewPane` component. */
export interface PreviewPaneProps {
  /** Current preview state; the pane keeps showing the last ready file while a new one loads. */
  state: PreviewState
  /** When `state` arrived, for the Today/Yesterday labels. */
  now: Date
  /** Whether a load has run past the loading delay. */
  loading: boolean
  /** Called with the status text once a card outcome is shown. */
  onAnnounce: (text: string) => void
}

/** Props for the `PreviewHeader` component. */
export interface PreviewHeaderProps {
  meta: PreviewMeta
  /** Id of the `h2` holding the file name. */
  titleId: string
  /** Current time, for the relative stamp. */
  now: Date
}

/** Props for the `MetadataCard` component. */
export interface MetadataCardProps {
  /** Details to show; `null` when the file could not be read. */
  meta: PreviewMeta | null
  /** File name, used when `meta` is `null`. */
  name: string
  /** Current time, for the relative stamp. */
  now: Date
  /** Whether a renderer failed for this file, so the card gives the render-failure explanation. */
  failed?: boolean
}

/** Props for the `PreviewBoundary` component. */
export interface PreviewBoundaryProps {
  /** Called when a child throws. Never receives the error. */
  onFail: () => void
  /** The renderer to guard; the boundary draws nothing after a failure. */
  children: ReactNode
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
