import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './clipboard'

afterEach(() => vi.unstubAllGlobals())

describe('copyText', () => {
  it('writes to the clipboard and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await copyText('hello')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })
  it('reports failure when the clipboard refuses', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    expect(await copyText('x')).toBe(false)
  })
  it('reports failure when there is no clipboard', async () => {
    vi.stubGlobal('navigator', {})
    expect(await copyText('x')).toBe(false)
  })
})
