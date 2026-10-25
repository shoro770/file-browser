import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { nextTreeWidth } from '../lib/layout'
import type { PaneDividerProps } from '../types'

/**
 * Vertical separator between the tree and preview panes. Drag it with a pointer, or
 * focus it and use Left/Right (Shift for larger steps), Home/End, and Enter to reset.
 */
export default function PaneDivider({ width, min, max, controls, onChange, onReset }: PaneDividerProps) {
  const [dragging, setDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  /** Distance from the pane edge to where the pointer grabbed the divider. */
  const grabOffset = useRef(0)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const next = nextTreeWidth(width, event.key, event.shiftKey, window.innerWidth)
    if (next === null) return
    event.preventDefault()
    if (event.key === 'Enter') onReset()
    else onChange(next)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const left = ref.current?.parentElement?.getBoundingClientRect().left ?? 0
    grabOffset.current = event.clientX - left - width
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const left = ref.current?.parentElement?.getBoundingClientRect().left ?? 0
    onChange(event.clientX - left - grabOffset.current)
  }

  function endDrag() {
    setDragging(false)
  }

  return (
    <div
      ref={ref}
      className={dragging ? 'divider is-dragging' : 'divider'}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={`${width} pixels`}
      aria-controls={controls}
      aria-label="Resize file tree"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={onReset}
    >
      <span className="divider__grip" aria-hidden="true" />
    </div>
  )
}
