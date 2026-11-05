import { useCallback, useEffect, useRef, useState } from 'react'
import EmptyPreview from './components/EmptyPreview'
import FileTypeFilter from './components/FileTypeFilter'
import Glyph from './components/Glyph'
import HiddenFilesToggle from './components/HiddenFilesToggle'
import PaneDivider from './components/PaneDivider'
import PreviewPane from './components/PreviewPane'
import RefreshButton from './components/RefreshButton'
import SearchPanel from './components/SearchPanel'
import ThemeSwitch from './components/ThemeSwitch'
import Tree from './components/Tree'
import UnsupportedBrowser from './components/UnsupportedBrowser'
import { usePaneWidth } from './hooks/usePaneWidth'
import { usePreview } from './hooks/usePreview'
import { useTree } from './hooks/useTree'
import { filterSiblings, isDotfileId } from './lib/tree'
import type { AppProps, FileItem } from './types'
import './App.css'

/** Shown when the picker rejects for any reason other than the user cancelling. */
const DENIED_MESSAGE = "Access to that folder wasn't granted. Choose a folder to try again."

/**
 * Builds the notice shown above the prompt when Refresh cleared a Selection that is gone or unreadable.
 *
 * @param name - Name of the file that was selected.
 * @returns The message, also mirrored into the status region.
 */
const missingMessage = (name: string) => `${name} was removed or can no longer be read, so the selection was cleared.`

/** App shell: toolbar over a tree pane and a preview pane, or the unsupported-browser screen. */
export default function App({ folderPickerSupported }: AppProps) {
  const { snapshot, openWorkspace, toggle, select, refresh, reveal, setShowDotfiles } = useTree()
  const [status, setStatus] = useState('')
  const [denied, setDenied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [fileType, setFileType] = useState<string | null>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const announceFrame = useRef(0)
  const pane = usePaneWidth()

  const { rootName, rootIds, items, childIds, expandedIds, loadingIds, unavailableIds, showDotfiles, selectedId, refreshing, refreshCount } =
    snapshot
  const visibleRootIds = filterSiblings(rootIds, items, showDotfiles, fileType)
  const selectedItem = selectedId === null ? null : (items[selectedId] ?? null)
  const preview = usePreview(selectedItem, refreshCount)
  // The selection whose preview a completed Refresh is waiting on before it announces "Refreshed.".
  const [awaiting, setAwaiting] = useState<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const announcedCount = useRef(0)

  useEffect(() => {
    selectedIdRef.current = selectedId
  })

  // A changed selection drops the pending announcement ("Previewing {name}" already spoke).
  if (awaiting !== null && awaiting !== selectedId) setAwaiting(null)

  /** Announces text; clears the region first so an identical string is read again. */
  const announce = useCallback((text: string) => {
    cancelAnimationFrame(announceFrame.current)
    setStatus('')
    announceFrame.current = requestAnimationFrame(() => setStatus(text))
  }, [])

  const settled = awaiting !== null && preview.settledKey === refreshCount
  useEffect(() => {
    if (!settled || announcedCount.current === refreshCount) return
    announcedCount.current = refreshCount
    announce('Refreshed.')
  }, [settled, refreshCount, announce])

  useEffect(() => {
    document.title = rootName === null ? 'file-browser' : `${rootName} - file-browser`
  }, [rootName])

  useEffect(() => () => cancelAnimationFrame(announceFrame.current), [])

  if (!folderPickerSupported) return <UnsupportedBrowser />

  /** Sets the status at once, and keeps a pending `announce` from overwriting it. */
  function say(text: string) {
    cancelAnimationFrame(announceFrame.current)
    setStatus(text)
  }

  async function handleRefresh() {
    if (refreshing) return
    setDenied(false)
    announce('Refreshing...')
    const outcome = await refresh()
    if (outcome.status === 'skipped') return
    if (outcome.status === 'failed') {
      // Nothing is cleared; the same inline alert as a refused folder picker.
      announce('')
      setDenied(true)
    } else if (outcome.selectionCleared) {
      const message = missingMessage(outcome.clearedName ?? 'The selected file')
      setNotice(message)
      announce(message)
    } else if (selectedIdRef.current === null) announce('Refreshed.')
    else {
      // The store resets `refreshCount` for a new folder, so forget the last announced count.
      announcedCount.current = 0
      setAwaiting(selectedIdRef.current)
    }
  }

  async function handleOpen() {
    setDenied(false)
    say('')
    const outcome = await openWorkspace()
    if (outcome.status === 'opened') {
      setFileType(null)
      setNotice(null)
      say(`Opened ${outcome.name}`)
      if (outcome.count > 0) setFocusToken((token) => token + 1)
      else openButtonRef.current?.focus()
      return
    }
    if (outcome.status === 'denied') setDenied(true)
    openButtonRef.current?.focus()
  }

  /** Selects without announcing (keyboard moves: the focused row is already read). */
  function handleFollow(id: string) {
    if (id === selectedId) return
    setDenied(false)
    setNotice(null)
    select(id)
  }

  /** Selects on activation; announces files ("Previewing {name}"), not folders. */
  function handleSelect(id: string, item: FileItem = items[id]) {
    handleFollow(id)
    if (id !== selectedId && !item.isDirectory) say(`Previewing ${item.name}`)
  }

  function handleToggle(id: string) {
    setDenied(false)
    toggle(id)
  }

  function handleToggleDotfiles() {
    setDenied(false)
    if (showDotfiles && selectedId !== null && isDotfileId(selectedId)) say('Selection cleared')
    setShowDotfiles(!showDotfiles)
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
        <HiddenFilesToggle shown={showDotfiles} onToggle={handleToggleDotfiles} />
        <FileTypeFilter items={items} value={fileType} onChange={setFileType} onAnnounce={announce} />
        <RefreshButton enabled={rootName !== null} refreshing={refreshing} onRefresh={handleRefresh} />
        <ThemeSwitch />
        {denied && (
          <p className="shell__alert" role="alert">
            {DENIED_MESSAGE}
          </p>
        )}
      </header>
      <div id="tree-pane" className="shell__tree">
        <SearchPanel workspace={rootIds} refreshCount={refreshCount} selectedId={selectedId} reveal={reveal} onSelect={handleSelect} onFollow={handleFollow} onAnnounce={announce}>
          {visibleRootIds.length > 0 && (
            <Tree
              key={focusToken}
              items={items}
              rootIds={rootIds}
              childIds={childIds}
              expandedIds={expandedIds}
              loadingIds={loadingIds}
              unavailableIds={unavailableIds}
              showDotfiles={showDotfiles}
              fileType={fileType}
              onToggle={handleToggle}
              onSelect={handleSelect}
              onFollow={handleFollow}
              selectedId={selectedId}
              focusToken={focusToken}
            />
          )}
        </SearchPanel>
      </div>
      <PaneDivider
        width={pane.width}
        min={pane.min}
        max={pane.max}
        controls="tree-pane"
        onChange={pane.setWidth}
        onReset={pane.reset}
      />
      <main className="shell__preview">
        {selectedItem !== null ? (
          <PreviewPane state={preview.state} now={preview.now} loading={preview.loading} onAnnounce={setStatus} rootName={rootName} />
        ) : (
          <EmptyPreview
            rootName={rootName}
            notice={notice}
            rootEmpty={rootIds.length === 0}
            nothingVisible={visibleRootIds.length === 0}
            onOpen={handleOpen}
          />
        )}
      </main>
    </div>
  )
}
