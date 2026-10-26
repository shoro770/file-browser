// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FileItem, PreviewState } from '../types'
import '../testHelpers'

const calls: Array<(state: PreviewState | null) => void> = []
const closePreview = vi.fn()
vi.mock('../services/previewSession', () => ({
  openPreview: vi.fn(
    () =>
      new Promise<PreviewState | null>((resolve) => {
        calls.push(resolve)
      }),
  ),
  closePreview: () => closePreview(),
}))
const { usePreview } = await import('./usePreview')

const item = (id: string): FileItem => ({ id, name: id, path: `/${id}`, isDirectory: false })
const failed = (id: string): PreviewState => ({ status: 'failed', id, name: id })

describe('usePreview', () => {
  beforeEach(() => {
    calls.length = 0
    closePreview.mockClear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('shows loading only after 150 ms, and keeps the old result while loading', async () => {
    const { result, rerender } = renderHook(({ i }) => usePreview(i), { initialProps: { i: item('a') } })
    await act(async () => calls[0](failed('a')))
    expect(result.current.state).toMatchObject({ id: 'a' })
    rerender({ i: item('b') })
    act(() => {
      vi.advanceTimersByTime(149)
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.state).toMatchObject({ id: 'a' })
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.loading).toBe(true)
    await act(async () => calls[1](failed('b')))
    expect(result.current.state).toMatchObject({ id: 'b' })
    expect(result.current.loading).toBe(false)
  })

  it('resets to idle when the selection clears', async () => {
    const { result, rerender } = renderHook(({ i }) => usePreview(i), {
      initialProps: { i: item('a') as FileItem | null },
    })
    await act(async () => calls[0](failed('a')))
    rerender({ i: null })
    expect(result.current.state.status).toBe('idle')
    expect(closePreview).toHaveBeenCalled()
  })

  it('reload keeps the result until the new one lands, and settledKey follows', async () => {
    const { result, rerender } = renderHook(({ k }) => usePreview(item('a'), k), { initialProps: { k: 0 } })
    await act(async () => calls[0](failed('a')))
    expect(result.current.settledKey).toBe(0)
    rerender({ k: 1 })
    expect(calls).toHaveLength(2)
    expect(result.current.state).toMatchObject({ id: 'a' })
    expect(result.current.settledKey).toBe(0)
    await act(async () => calls[1](failed('a')))
    expect(result.current.settledKey).toBe(1)
  })

  it('drops the late result of a superseded id and a null result', async () => {
    const { result, rerender } = renderHook(({ i }) => usePreview(i), { initialProps: { i: item('a') } })
    rerender({ i: item('b') })
    await act(async () => calls[0](failed('a')))
    expect(result.current.state.status).toBe('idle')
    await act(async () => calls[1](null))
    expect(result.current.state.status).toBe('idle')
  })
})
