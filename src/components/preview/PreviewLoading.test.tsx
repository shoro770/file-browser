// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import '../../testHelpers'
import PreviewLoading from './PreviewLoading'

describe('PreviewLoading', () => {
  it('shows visible text, is not a live region, and announces once through the status region', () => {
    const onAnnounce = vi.fn()
    const { rerender } = render(<PreviewLoading onAnnounce={onAnnounce} />)
    expect(screen.getByText('Loading preview...')).toBeVisible()
    expect(screen.queryByRole('status')).toBeNull()
    expect(onAnnounce).toHaveBeenCalledTimes(1)
    expect(onAnnounce).toHaveBeenCalledWith('Loading preview...')
    // A re-render with the same callback does not announce again.
    rerender(<PreviewLoading onAnnounce={onAnnounce} />)
    expect(onAnnounce).toHaveBeenCalledTimes(1)
  })
})
