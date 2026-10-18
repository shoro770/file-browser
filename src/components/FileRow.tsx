import type { CSSProperties } from 'react'
import { formatSize } from '../lib/format'
import type { FileCategory, FileItem } from '../types'

/** Short badge text per category; `Record` makes TypeScript flag any missing category. */
const CATEGORY_LABELS: Record<FileCategory, string> = {
  document: 'DOC',
  image: 'IMG',
  video: 'VID',
  audio: 'AUD',
  archive: 'ZIP',
  code: 'CODE',
  other: 'FILE',
}

/** Formats `updatedAt` as e.g. "Oct 15, 2026" in the viewer's locale. */
const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const badgeStyle: CSSProperties = {
  flexShrink: 0,
  minWidth: '3.5em',
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'var(--accent-bg)',
  color: 'var(--accent)',
  fontFamily: 'var(--mono)',
  fontSize: '12px',
  fontWeight: 600,
  textAlign: 'center',
}

const mainStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minWidth: 0,
}

const dateStyle: CSSProperties = {
  display: 'block',
  fontSize: '14px',
}

interface FileRowProps {
  item: FileItem
}

/**
 * One row of a file listing: category badge, name, last-modified date and size.
 * Renders an `<li>`, so place it inside a `<ul>` or `<ol>`.
 */
export function FileRow({ item }: FileRowProps) {
  const label = item.isDirectory ? 'DIR' : CATEGORY_LABELS[item.category]
  const kind = item.isDirectory ? 'directory' : item.category

  return (
    <li className="file-row">
      <span style={mainStyle}>
        <span style={badgeStyle} title={kind} aria-label={kind}>
          {label}
        </span>
        <span>
          <span className="file-name">
            {item.isDirectory ? `${item.name}/` : item.name}
          </span>
          <time style={dateStyle} dateTime={item.updatedAt.toISOString()}>
            {dateFormat.format(item.updatedAt)}
          </time>
        </span>
      </span>
      {/* Directory sizes aren't meaningful yet, so show a dash. */}
      <span className="file-size">
        {item.isDirectory ? '—' : formatSize(item.size)}
      </span>
    </li>
  )
}
