import type { EmptyPreviewProps } from '../types'
import OpenFolderPrompt from './OpenFolderPrompt'

/** The preview pane while nothing is selected: the open-folder prompt, or the reason there is nothing to preview. */
export default function EmptyPreview({ rootName, notice, rootEmpty, nothingVisible, onOpen }: EmptyPreviewProps) {
  return (
    <div className="preview" role="region" aria-label="Preview">
      {rootName !== null && notice !== null && <p className="preview__notice">{notice}</p>}
      {rootName === null ? (
        <OpenFolderPrompt onOpen={onOpen} />
      ) : rootEmpty ? (
        <div className="prompt">
          <h2 className="prompt__title">This folder is empty.</h2>
          <p className="prompt__body">There are no files here to show.</p>
        </div>
      ) : nothingVisible ? (
        <div className="prompt">
          <h2 className="prompt__title">Nothing to show.</h2>
          <p className="prompt__body">Hidden files are turned off.</p>
        </div>
      ) : (
        <div className="prompt">
          <h2 className="prompt__title">Select a file to preview it.</h2>
          <p className="prompt__body">Folders open in the tree on the left.</p>
        </div>
      )}
    </div>
  )
}
