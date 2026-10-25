import { Component } from 'react'
import type { ReactNode } from 'react'
import type { PreviewBoundaryProps } from '../../types'

/** Whether a child has thrown. */
interface State {
  failed: boolean
}

/**
 * Guards one renderer. When a child throws, it draws nothing and calls `onFail`, so the
 * pane can show the Metadata Card. The error itself is never read, shown or logged.
 * Key it by the source so the next file starts healthy.
 */
export default class PreviewBoundary extends Component<PreviewBoundaryProps, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(): void {
    this.props.onFail()
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}
