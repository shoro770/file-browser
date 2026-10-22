import type { CSSProperties, KeyboardEvent } from 'react'
import { formatSize } from '../lib/format'
import type { FileCategory, FileRowProps } from '../types'

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

/** Hides text visually while keeping it available to screen readers. */
const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}

/**
 * One row of a file listing: category badge, name, last-modified date and size.
 * Renders a focusable `<li role="option">`, so place it inside an element with
 * `role="listbox"` (e.g. `<ul role="listbox" aria-label="Files">`).
 */
export function FileRow({
  item,
  selected = false,
  tabIndex = 0,
  onSelect,
}: FileRowProps) {
  const label = item.isDirectory ? 'DIR' : CATEGORY_LABELS[item.category]
  const kind = item.isDirectory ? 'directory' : item.category

  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    // Stop Space from scrolling the page.
    event.preventDefault()
    onSelect?.(item)
  }

  return (
    <li
      className={selected ? 'file-row is-selected' : 'file-row'}
      role="option"
      aria-selected={selected}
      tabIndex={tabIndex}
      onClick={() => onSelect?.(item)}
      onKeyDown={handleKeyDown}
    >
      <span style={mainStyle}>
        <span style={badgeStyle} title={kind} aria-hidden="true">
          {label}
        </span>
        <span>
          <span style={visuallyHiddenStyle}>{kind}: </span>
          <span className="file-name">
            {item.isDirectory ? `${item.name}/` : item.name}
          </span>
          {item.updatedAt ? (
            <time style={dateStyle} dateTime={item.updatedAt.toISOString()}>
              {dateFormat.format(item.updatedAt)}
            </time>
          ) : (
            <span style={dateStyle}>—</span>
          )}
        </span>
      </span>
      {/* Directory sizes aren't meaningful yet, so show a dash. */}
      <span className="file-size">
        {item.isDirectory ? '—' : formatSize(item.size)}
      </span>
    </li>
  )
}
