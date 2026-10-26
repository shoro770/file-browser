// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import '../testHelpers'
import RefreshButton from './RefreshButton'

describe('RefreshButton', () => {
  it('is a disabled button named Refresh when no folder is open', () => {
    const onRefresh = vi.fn()
    render(<RefreshButton enabled={false} refreshing={false} onRefresh={onRefresh} />)
    const button = screen.getByRole('button', { name: 'Refresh' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('is enabled once a folder is open and calls back on click', () => {
    const onRefresh = vi.fn()
    render(<RefreshButton enabled refreshing={false} onRefresh={onRefresh} />)
    const button = screen.getByRole('button', { name: 'Refresh' })
    expect(button).toBeEnabled()
    expect(button).toHaveAttribute('aria-busy', 'false')
    fireEvent.click(button)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('stays enabled and keeps its label while busy, so focus is not lost', () => {
    render(<RefreshButton enabled refreshing onRefresh={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Refresh' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeEnabled()
  })
})
