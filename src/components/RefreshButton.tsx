import type { RefreshButtonProps } from '../types'
import { RefreshIcon } from './Glyph'

/**
 * Toolbar Refresh button. The label never changes; `aria-busy` marks a running Refresh. It is
 * not `disabled` while busy, so focus stays on it; it is disabled only when no folder is open.
 */
export default function RefreshButton({ enabled, refreshing, onRefresh }: RefreshButtonProps) {
  return (
    <button type="button" className="button" disabled={!enabled} aria-busy={refreshing} onClick={onRefresh}>
      <RefreshIcon />
      Refresh
    </button>
  )
}
