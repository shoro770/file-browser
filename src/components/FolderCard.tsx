import { describeContents } from '../lib/format'
import type { FolderCardProps } from '../types'
import Glyph from './Glyph'

/** Preview of a selected folder: name, location and what it directly holds. No recursive size. */
export default function FolderCard({ summary, name, titleId }: FolderCardProps) {
  return (
    <section className="metadata-card" aria-label="Folder details">
      <Glyph kind="folder" large />
      <h2 id={titleId} className="metadata-card__name">
        {summary?.name ?? name}
      </h2>
      {summary === null ? (
        <p className="metadata-card__note">This folder can't be read.</p>
      ) : (
        <dl className="metadata-card__details">
          <dt>Location</dt>
          <dd>{summary.path}</dd>
          <dt>Contains</dt>
          <dd>{describeContents(summary.folderCount, summary.fileCount)}</dd>
        </dl>
      )}
    </section>
  )
}
