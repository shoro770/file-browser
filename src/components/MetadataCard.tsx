import { formatModified, toIsoDateTime } from '../lib/datetime'
import { formatSize } from '../lib/format'
import { RENDER_FAILED_MESSAGE, cardExplanation, glyphForFile, typeLabel } from '../lib/preview'
import type { MetadataCardProps } from '../types'
import Glyph from './Glyph'

/** Card for a file with no rendered preview: name, explanation, then Size, Type and Last modified. */
export default function MetadataCard({ meta, name, now, failed = false }: MetadataCardProps) {
  if (meta === null) {
    return (
      <section className="metadata-card" aria-label="File details">
        <Glyph kind={glyphForFile(name)} large />
        <h2 className="metadata-card__name">
          {name}
        </h2>
        <p className="metadata-card__note">{RENDER_FAILED_MESSAGE}</p>
      </section>
    )
  }

  const stamp = formatModified(meta.updatedAt, now)
  return (
    <section className="metadata-card" aria-label="File details">
      <Glyph kind={glyphForFile(meta.name, meta.mime)} large />
      <h2 className="metadata-card__name">
        {meta.name}
      </h2>
      <dl className="metadata-card__details">
        <dt>Size</dt>
        <dd>{formatSize(meta.size)}</dd>
        <dt>Type</dt>
        <dd>{typeLabel(meta.name, meta.mime)}</dd>
        <dt>Last modified</dt>
        <dd>
          <time dateTime={toIsoDateTime(meta.updatedAt)}>{stamp}</time>
        </dd>
      </dl>
      <p className="metadata-card__note">{cardExplanation(meta.name, meta.size, failed)}</p>
    </section>
  )
}
