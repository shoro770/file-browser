import { describe, expect, it, vi } from 'vitest'

type Node = { name: string; kind: 'file' | 'directory'; children?: Node[]; fail?: 'list' | 'open' }

/** A fake directory handle over a tree of nodes. */
function fake(name: string, nodes: Node[], values = vi.fn()) {
  return {
    name,
    kind: 'directory',
    values: async function* () {
      values(name)
      yield* nodes
    },
    getDirectoryHandle: async (child: string) => {
      const node = nodes.find((n) => n.name === child)!
      if (node.fail === 'open') throw new Error('denied')
      if (node.fail === 'list') {
        return { name: child, kind: 'directory', values: () => ({ [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(new Error('denied')) }) }) }
      }
      return fake(child, node.children ?? [], values)
    },
  }
}

vi.stubGlobal('window', {})
const { crawl } = await import('./search')

/** Collects every id from a crawl. */
async function ids(root: unknown, signal = new AbortController().signal): Promise<string[]> {
  const out: string[] = []
  for await (const batch of crawl(root as never, signal)) out.push(...batch.map((item) => item.id))
  return out
}

describe('crawl', () => {
  const tree: Node[] = [
    { name: 'a', kind: 'directory', children: [{ name: 'x.txt', kind: 'file' }, { name: '.hid', kind: 'directory', children: [{ name: 'y', kind: 'file' }] }] },
    { name: 'bad', kind: 'directory', fail: 'list' },
    { name: 'locked', kind: 'directory', fail: 'open' },
    { name: 'z.md', kind: 'file' },
  ]

  it('yields every entry, dotfolders included, folders before their children', async () => {
    const all = await ids(fake('root', tree))
    expect(all).toEqual(expect.arrayContaining(['a', 'bad', 'locked', 'z.md', 'a/x.txt', 'a/.hid', 'a/.hid/y']))
    expect(all.indexOf('a')).toBeLessThan(all.indexOf('a/x.txt'))
  })

  it('skips unreadable folders and keeps going', async () => {
    const all = await ids(fake('root', tree))
    expect(all).toContain('z.md')
    expect(all.filter((id) => id.startsWith('bad/'))).toEqual([])
  })

  it('lists each folder once and never reads files', async () => {
    const values = vi.fn()
    await ids(fake('root', tree, values))
    expect(values.mock.calls.map(([name]) => name).sort()).toEqual(['.hid', 'a', 'root'].sort())
  })

  it('stops when aborted', async () => {
    const controller = new AbortController()
    const out: string[] = []
    for await (const batch of crawl(fake('root', tree) as never, controller.signal)) {
      out.push(...batch.map((item) => item.id))
      controller.abort()
    }
    expect(out).not.toContain('a/x.txt')
  })
})
