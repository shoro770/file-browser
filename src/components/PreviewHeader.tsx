import { useRef, useState, useEffect } from 'react'
import { formatModified, toIsoDateTime } from '../lib/datetime'
import { glyphForFile } from '../lib/preview'
import { MAX_COPY_BYTES } from '../lib/text'
import { fullPath } from '../lib/tree'
import { useCopy } from '../hooks/useCopy'
import type { PreviewHeaderProps } from '../types'
import Glyph, { CopyContentIcon, CopyNameIcon, CopyPathIcon } from './Glyph'

/** Which copy button a result tip belongs to. */
type CopyKey = 'name' | 'path' | 'content'

/** How long a button shows "Copied" before going back to its label. */
const FLASH_MS = 1500

/**
 * Header above a selected file's preview: kind glyph, name, three copy buttons and the Last
 * Modified stamp. Copy content shows for text and Markdown files only and reads the whole file.
 */
export default function PreviewHeader({ meta, titleId, now, id, rootName, file, onAnnounce }: PreviewHeaderProps) {
  const copy = useCopy(onAnnounce)
  const [flash, setFlash] = useState<{ key: CopyKey; text: string } | null>(null)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  /** Copies, then shows "Copied" (or the failure) as the button's tip for a moment. */
  async function run(key: CopyKey, read: () => string | Promise<string>, done: string) {
    const ok = await copy(read, done)
    setFlash({ key, text: ok ? 'Copied' : "Couldn't copy" })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setFlash(null), FLASH_MS)
  }

  /** Drops a result tip that belongs to a different button, so two tips never stack. */
  const dismissOthers = (key: CopyKey) => setFlash((current) => (current && current.key !== key ? null : current))

  /** Class and tip text for one button: its label, or the result of the last copy. */
  const tipFor = (key: CopyKey, label: string) => ({
    className: flash?.key === key ? 'icon-button has-tip is-flashing' : 'icon-button has-tip',
    'data-tip': flash?.key === key ? flash.text : label,
    onPointerEnter: () => dismissOthers(key),
    onFocus: () => dismissOthers(key),
  })

  const copyable = meta.kind === 'text' || meta.kind === 'markdown'
  const tooLarge = file.size > MAX_COPY_BYTES

  return (
    <header className="preview-header">
      <Glyph kind={glyphForFile(meta.name, meta.mime)} />
      <h2 id={titleId} className="preview-header__name" title={meta.name}>
        {meta.name}
      </h2>
      <p className="preview-header__stamp">
        Modified <time dateTime={toIsoDateTime(meta.updatedAt)}>{formatModified(meta.updatedAt, now)}</time>
      </p>
      <div className="preview-header__actions">
        <button
          type="button"
          {...tipFor('name', 'Copy file name')}
          aria-label="Copy file name"
          onClick={() => run('name', () => meta.name, 'Copied name')}
        >
          <CopyNameIcon />
        </button>
        <button
          type="button"
          {...tipFor('path', 'Copy path')}
          aria-label="Copy path"
          onClick={() => run('path', () => fullPath(rootName, id), 'Copied path')}
        >
          <CopyPathIcon />
        </button>
        {copyable && (
          <button
            type="button"
            {...tipFor('content', tooLarge ? 'Too large to copy (over 10 MB)' : 'Copy content')}
            aria-label="Copy content"
            disabled={tooLarge}
            onClick={() => run('content', () => file.text(), 'Copied content')}
          >
            <CopyContentIcon />
          </button>
        )}
      </div>
    </header>
  )
}
