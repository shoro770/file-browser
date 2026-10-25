import { describe, expect, it } from 'vitest'
import { MAX_TEXT_BYTES } from '../lib/text'
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

  it('reads the leading text of a Markdown file, truncating at 1 MB, with no image URL', async () => {
    const small = createPreviewSessions(async () => file('a.md', '# Hi', 'text/markdown'))
    const ready = await small.open('a.md', 'a.md')
    expect(ready?.status === 'ready' && ready.source.meta.kind).toBe('markdown')
    expect(ready?.status === 'ready' && ready.source.text).toEqual({ text: '# Hi', truncated: false, totalSize: 4 })
    expect(ready?.status === 'ready' && ready.source.imageUrl).toBeUndefined()

    const big = createPreviewSessions(async () => file('b.md', 'x'.repeat(MAX_TEXT_BYTES + 5), ''))
    const cut = await big.open('b.md', 'b.md')
    expect(cut?.status === 'ready' && cut.source.text?.truncated).toBe(true)
    expect(cut?.status === 'ready' && cut.source.text?.text).toHaveLength(MAX_TEXT_BYTES)
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

/** Fake object URL API that records what is live. */
function fakeUrls() {
  const live = new Set<string>()
  const created: Blob[] = []
  const revoked: string[] = []
  let n = 0
  return {
    live,
    created,
    revoked,
    api: {
      createObjectURL(blob: Blob) {
        created.push(blob)
        const url = `blob:fake/${++n}`
        live.add(url)
        return url
      },
      revokeObjectURL(url: string) {
        revoked.push(url)
        live.delete(url)
      },
    },
  }
}

describe('createPreviewSessions object URLs', () => {
  it('creates a blob URL only for the image kind, typed from the extension', async () => {
    const urls = fakeUrls()
    const sessions = createPreviewSessions(async (id) => file(id, '<svg/>', ''), urls.api)
    const text = await sessions.open('a.txt', 'a.txt')
    const pdf = await sessions.open('a.pdf', 'a.pdf')
    expect(urls.created).toHaveLength(0)
    expect(text?.status === 'ready' && text.source.imageUrl).toBeUndefined()
    expect(pdf?.status === 'ready' && pdf.source.imageUrl).toBeUndefined()

    const image = await sessions.open('x.svg', 'x.svg')
    if (image?.status !== 'ready') throw new Error('expected ready')
    expect(image.source.imageUrl).toMatch(/^blob:/)
    expect(urls.created).toHaveLength(1)
    expect(urls.created[0].type).toBe('image/svg+xml')
    expect(urls.live.size).toBe(1)
  })

  it('revokes the URL at reselect, the moment the next session starts', async () => {
    const urls = fakeUrls()
    const { reader, pending } = controllableReader()
    const sessions = createPreviewSessions(reader, urls.api)
    const first = sessions.open('a.png', 'a.png')
    pending.get('a.png')!.resolve(file('a.png', 'x', 'image/png'))
    await first
    expect(urls.live.size).toBe(1)

    const second = sessions.open('b.png', 'b.png') // read still pending
    expect(urls.live.size).toBe(0)
    expect(urls.revoked).toEqual(['blob:fake/1'])
    pending.get('b.png')!.resolve(file('b.png', 'x', 'image/png'))
    await second
    expect(urls.revoked).toEqual(['blob:fake/1']) // each URL is revoked exactly once
  })

  it('close() during a pending image read creates no URL', async () => {
    const urls = fakeUrls()
    const { reader, pending } = controllableReader()
    const sessions = createPreviewSessions(reader, urls.api)
    const open = sessions.open('a.png', 'a.png')
    sessions.close()
    pending.get('a.png')!.resolve(file('a.png', 'x', 'image/png'))
    expect(await open).toBeNull()
    expect(urls.created).toHaveLength(0)
  })

  it('creates no URL for a zero-byte image (the card shows)', async () => {
    const urls = fakeUrls()
    const sessions = createPreviewSessions(async () => file('a.png', '', 'image/png'), urls.api)
    const state = await sessions.open('a.png', 'a.png')
    expect(state?.status === 'ready' && state.source.meta.kind).toBe('metadata')
    expect(urls.created).toHaveLength(0)
  })

  it('turns a failing URL creation into a typed outcome', async () => {
    const sessions = createPreviewSessions(async () => file('a.png', 'x', 'image/png'), {
      createObjectURL() {
        throw new Error('no')
      },
      revokeObjectURL() {},
    })
    expect(await sessions.open('a.png', 'a.png')).toEqual({ status: 'failed', id: 'a.png', name: 'a.png' })
  })

  it('revokes on supersede: a stale image never owns a URL', async () => {
    const urls = fakeUrls()
    const { reader, pending } = controllableReader()
    const sessions = createPreviewSessions(reader, urls.api)
    const first = sessions.open('a.png', 'a.png')
    const second = sessions.open('b.png', 'b.png')
    pending.get('b.png')!.resolve(file('b.png', 'x', 'image/png'))
    pending.get('a.png')!.resolve(file('a.png', 'x', 'image/png'))

    expect(await first).toBeNull()
    const state = await second
    expect(urls.created).toHaveLength(1)
    expect(urls.live.size).toBe(1)
    expect(state?.status === 'ready' && urls.live.has(state.source.imageUrl!)).toBe(true)
  })

  it('revokes on close() and on a later non-image selection', async () => {
    const urls = fakeUrls()
    const sessions = createPreviewSessions(async (id) => file(id, 'x', id.endsWith('png') ? 'image/png' : 'text/plain'), urls.api)
    await sessions.open('a.png', 'a.png')
    sessions.close()
    expect(urls.live.size).toBe(0)

    await sessions.open('b.png', 'b.png')
    await sessions.open('c.txt', 'c.txt')
    expect(urls.live.size).toBe(0)
  })

  it('leaves no URL when the read fails', async () => {
    const urls = fakeUrls()
    const sessions = createPreviewSessions(async () => {
      throw new Error('gone')
    }, urls.api)
    expect((await sessions.open('a.png', 'a.png'))?.status).toBe('failed')
    expect(urls.created).toHaveLength(0)
  })
})
