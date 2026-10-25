import { formatModified, toIsoDateTime } from '../lib/datetime'
import { glyphForFile } from '../lib/preview'
import type { PreviewHeaderProps } from '../types'
import Glyph from './Glyph'

/** Header above a selected file's preview: kind glyph, name and Last Modified stamp. */
export default function PreviewHeader({ meta, titleId, now }: PreviewHeaderProps) {
  return (
    <header className="preview-header">
      <Glyph kind={glyphForFile(meta.name, meta.mime)} />
      <h2 id={titleId} className="preview-header__name" title={meta.name}>
        {meta.name}
      </h2>
      <p className="preview-header__stamp">
        Modified <time dateTime={toIsoDateTime(meta.updatedAt)}>{formatModified(meta.updatedAt, now)}</time>
      </p>
    </header>
  )
}
