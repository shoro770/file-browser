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
