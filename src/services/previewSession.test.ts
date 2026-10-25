import { describe, expect, it } from 'vitest'
import { createPreviewSessions } from './previewSession'

/** A reader whose promises the test settles by hand. */
function controllableReader() {
  const pending = new Map<string, { resolve: (file: File) => void; reject: (error: Error) => void }>()
  const reader = (id: string) =>
    new Promise<File>((resolve, reject) => {
      pending.set(id, { resolve, reject })
    })
  return { reader, pending }
}

const file = (name: string, content = 'hi', type = 'text/plain') =>
  new File([content], name, { type, lastModified: Date.UTC(2026, 9, 25, 11, 4) })

describe('createPreviewSessions', () => {
  it('returns the selection details and resolved kind', async () => {
    const sessions = createPreviewSessions(async () => file('a.txt'))
    const state = await sessions.open('a.txt', 'a.txt')
    expect(state).toMatchObject({ status: 'ready', id: 'a.txt' })
    if (state?.status !== 'ready') throw new Error('expected ready')
    expect(state.source.meta).toMatchObject({ name: 'a.txt', size: 2, mime: 'text/plain', kind: 'text' })
    expect(state.source.meta.updatedAt.getTime()).toBe(Date.UTC(2026, 9, 25, 11, 4))
    expect(state.source.signal.aborted).toBe(false)
  })

  it('reads the text of a small text file without truncating', async () => {
    const sessions = createPreviewSessions(async () => file('a.ts', 'let x = 1'))
    const state = await sessions.open('a.ts', 'a.ts')
    expect(state?.status === 'ready' && state.source.text).toEqual({ text: 'let x = 1', truncated: false, totalSize: 9 })
  })

  it('discards a stale text read (latest wins for text files)', async () => {
    const { reader, pending } = controllableReader()
    const sessions = createPreviewSessions(reader)
    const first = sessions.open('a.txt', 'a.txt')
    const second = sessions.open('b.txt', 'b.txt')
    pending.get('b.txt')!.resolve(file('b.txt', 'bee'))
    pending.get('a.txt')!.resolve(file('a.txt', 'ay'))

    expect(await first).toBeNull()
    const state = await second
    expect(state?.status === 'ready' && state.source.text?.text).toBe('bee')
  })

  it('reads a file of exactly 1 MB whole', async () => {
    const sessions = createPreviewSessions(async () => file('a.log', 'a'.repeat(1_048_576)))
    const state = await sessions.open('a.log', 'a.log')
    expect(state?.status === 'ready' && state.source.text?.truncated).toBe(false)
    expect(state?.status === 'ready' && state.source.text?.text.length).toBe(1_048_576)
  })

  it('keeps only the leading 1 MB of a larger file and drops a cut character', async () => {
    const content = 'a'.repeat(1_048_575) + 'é' + 'tail' // the two bytes of é straddle the limit
    const sessions = createPreviewSessions(async () => file('big.log', content))
    const state = await sessions.open('big.log', 'big.log')
    if (state?.status !== 'ready' || !state.source.text) throw new Error('expected text')
    expect(state.source.text.truncated).toBe(true)
    expect(state.source.text.totalSize).toBe(1_048_575 + 2 + 4)
    expect(state.source.text.text).toBe('a'.repeat(1_048_575))
  })

  it('shows markup in a text file literally', async () => {
    const sessions = createPreviewSessions(async () => file('x.txt', '<script>alert(1)</script>'))
    const state = await sessions.open('x.txt', 'x.txt')
    expect(state?.status === 'ready' && state.source.text?.text).toBe('<script>alert(1)</script>')
  })

  it('decodes invalid UTF-8 with replacement characters', async () => {
    const sessions = createPreviewSessions(async () => new File([new Uint8Array([0x61, 0xff, 0x00])], 'b.txt'))
    const state = await sessions.open('b.txt', 'b.txt')
    expect(state?.status === 'ready' && state.source.text?.text).toBe('a�\u0000')
  })

  it('does not read text for non-text kinds', async () => {
    const sessions = createPreviewSessions(async () => file('a.pdf', 'x', 'application/pdf'))
    const state = await sessions.open('a.pdf', 'a.pdf')
    expect(state?.status === 'ready' && state.source.text).toBeUndefined()
  })

  it('turns a failed text read into a typed outcome', async () => {
    const broken = file('a.txt', 'hi')
    Object.defineProperty(broken, 'slice', { value: () => ({ arrayBuffer: () => Promise.reject(new Error('gone')) }) })
    const sessions = createPreviewSessions(async () => broken)
    expect(await sessions.open('a.txt', 'a.txt')).toEqual({ status: 'failed', id: 'a.txt', name: 'a.txt' })
  })

  it('resolves a zero-byte file to metadata', async () => {
    const sessions = createPreviewSessions(async () => file('a.txt', ''))
    const state = await sessions.open('a.txt', 'a.txt')
    expect(state?.status === 'ready' && state.source.meta.kind).toBe('metadata')
  })

  it('discards a stale result and aborts the earlier session (latest wins)', async () => {
    const { reader, pending } = controllableReader()
    const sessions = createPreviewSessions(reader)
    const first = sessions.open('a', 'a')
    const second = sessions.open('b', 'b')
    pending.get('b')!.resolve(file('b'))
    pending.get('a')!.resolve(file('a'))

    expect(await first).toBeNull()
    expect(await second).toMatchObject({ status: 'ready', id: 'b' })
  })

  it('discards a stale failure too', async () => {
    const { reader, pending } = controllableReader()
    const sessions = createPreviewSessions(reader)
    const first = sessions.open('a', 'a')
    const second = sessions.open('b', 'b')
    pending.get('a')!.reject(new Error('gone'))
    pending.get('b')!.resolve(file('b'))

    expect(await first).toBeNull()
    expect((await second)?.status).toBe('ready')
  })

  it('aborts the previous signal when a new session opens', async () => {
    const sessions = createPreviewSessions(async (id) => file(id))
    const first = await sessions.open('a', 'a')
    await sessions.open('b', 'b')
    expect(first?.status === 'ready' && first.source.signal.aborted).toBe(true)
  })

  it('turns a failed read into a typed outcome', async () => {
    const sessions = createPreviewSessions(async () => {
      throw new DOMException('gone', 'NotFoundError')
    })
    expect(await sessions.open('a', 'a')).toEqual({ status: 'failed', id: 'a', name: 'a' })
  })

  it('close() discards an in-flight result', async () => {
    const { reader, pending } = controllableReader()
    const sessions = createPreviewSessions(reader)
    const open = sessions.open('a', 'a')
    sessions.close()
    pending.get('a')!.resolve(file('a'))
    expect(await open).toBeNull()
  })
})
