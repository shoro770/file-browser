import { useEffect, useRef, useState } from 'react'
import Glyph from './components/Glyph'
import OpenFolderPrompt from './components/OpenFolderPrompt'
import Tree from './components/Tree'
import UnsupportedBrowser from './components/UnsupportedBrowser'
import { useTree } from './hooks/useTree'
import type { AppProps } from './types'
import './App.css'

/** Shown when the picker rejects for any reason other than the user cancelling. */
const DENIED_MESSAGE = "Access to that folder wasn't granted. Choose a folder to try again."

/** App shell: toolbar over a tree pane and a preview pane, or the unsupported-browser screen. */
export default function App({ folderPickerSupported }: AppProps) {
  const { snapshot, openWorkspace, toggle, select } = useTree()
  const [status, setStatus] = useState('')
  const [denied, setDenied] = useState(false)
  const [focusToken, setFocusToken] = useState(0)
  const openButtonRef = useRef<HTMLButtonElement>(null)

  const { rootName, rootIds, items, childIds, expandedIds, loadingIds, unavailableIds, selectedId } = snapshot

  useEffect(() => {
    document.title = rootName === null ? 'file-browser' : `${rootName} - file-browser`
  }, [rootName])

  if (!folderPickerSupported) return <UnsupportedBrowser />

  async function handleOpen() {
    setDenied(false)
    setStatus('')
    const outcome = await openWorkspace()
    if (outcome.status === 'opened') {
      setStatus(`Opened ${outcome.name}`)
      if (outcome.count > 0) setFocusToken((token) => token + 1)
      else openButtonRef.current?.focus()
      return
    }
    if (outcome.status === 'denied') setDenied(true)
    openButtonRef.current?.focus()
  }

  function handleSelect(id: string) {
    if (id === selectedId) return
    select(id)
    setStatus(`Previewing ${items[id].name}`)
  }

  return (
    <div className="shell">
      <h1 className="visually-hidden">file-browser</h1>
      <div className="visually-hidden" role="status">
        {status}
      </div>
      <header className="shell__toolbar">
        <button ref={openButtonRef} type="button" className="button" onClick={handleOpen}>
          <Glyph kind="folder" />
          Open folder
        </button>
        <span className="shell__folder-name" title={rootName ?? undefined}>
          {rootName}
        </span>
        {denied && (
          <p className="shell__alert" role="alert">
            {DENIED_MESSAGE}
          </p>
        )}
      </header>
      <div className="shell__tree">
        {rootIds.length > 0 && (
          <Tree
            key={focusToken}
            items={items}
            rootIds={rootIds}
            childIds={childIds}
            expandedIds={expandedIds}
            loadingIds={loadingIds}
            unavailableIds={unavailableIds}
            onToggle={toggle}
            onSelect={handleSelect}
            selectedId={selectedId}
            focusToken={focusToken}
          />
        )}
      </div>
      <main className="shell__preview">
        {rootName === null ? (
          <OpenFolderPrompt onOpen={handleOpen} />
        ) : rootIds.length === 0 ? (
          <div className="prompt">
            <h2 className="prompt__title">This folder is empty.</h2>
            <p className="prompt__body">There are no files here to show.</p>
          </div>
        ) : (
          <div className="prompt">
            <h2 className="prompt__title">Select a file to preview it.</h2>
            <p className="prompt__body">Folders open in the tree on the left.</p>
          </div>
        )}
      </main>
    </div>
  )
}
