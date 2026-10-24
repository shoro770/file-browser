import { beforeEach, describe, expect, it, vi } from 'vitest'

type Entry = { name: string; kind: 'file' | 'directory'; getFile?: () => unknown }

/** Builds a fake directory handle whose `values()` yields the given entries. */
function fakeFolder(name: string, entries: Entry[]) {
  const values = vi.fn(async function* () {
    yield* entries
  })
  return { name, kind: 'directory', values }
}

const picker = vi.fn()
let rejectWith: DOMException | null = null
vi.stubGlobal('window', {
  showDirectoryPicker: (options: unknown) => {
    if (rejectWith) return Promise.reject(rejectWith)
    return picker(options)
  },
})

const { openWorkspace, getSnapshot } = await import('./tree')

describe('openWorkspace', () => {
  beforeEach(() => {
    picker.mockReset()
    rejectWith = null
  })

  it('opens: one values() pass, read mode, sorted rows, no getFile', async () => {
    const getFile = vi.fn()
    const folder = fakeFolder('proj', [
      { name: 'b.txt', kind: 'file', getFile },
      { name: 'Zeta', kind: 'directory' },
      { name: 'a10', kind: 'file', getFile },
      { name: 'a2', kind: 'file', getFile },
      { name: 'alpha', kind: 'directory' },
    ])
    picker.mockResolvedValue(folder)

    const outcome = await openWorkspace()

    expect(picker).toHaveBeenCalledWith({ mode: 'read' })
    expect(folder.values).toHaveBeenCalledTimes(1)
    expect(getFile).not.toHaveBeenCalled()
    expect(outcome).toEqual({ status: 'opened', name: 'proj', count: 5 })
    const snap = getSnapshot()
    expect(snap.rootName).toBe('proj')
    expect(snap.rootIds).toEqual(['alpha', 'Zeta', 'a2', 'a10', 'b.txt'])
    expect(snap.selectedId).toBeNull()
  })

  it('cancel leaves state unchanged', async () => {
    const before = getSnapshot()
    rejectWith = new DOMException('x', 'AbortError')
    expect(await openWorkspace()).toEqual({ status: 'cancelled' })
    expect(getSnapshot()).toBe(before)
  })

  it('denied leaves state unchanged and returns a typed outcome', async () => {
    const before = getSnapshot()
    rejectWith = new DOMException('x', 'NotAllowedError')
    expect(await openWorkspace()).toEqual({ status: 'denied' })
    expect(getSnapshot()).toBe(before)
  })

  it('replace discards the previous tree', async () => {
    picker.mockResolvedValue(fakeFolder('other', [{ name: 'only.md', kind: 'file' }]))
    await openWorkspace()
    const snap = getSnapshot()
    expect(snap.rootName).toBe('other')
    expect(snap.rootIds).toEqual(['only.md'])
    expect(Object.keys(snap.items)).toEqual(['only.md'])
  })

  it('empty folder opens with zero rows', async () => {
    picker.mockResolvedValue(fakeFolder('void', []))
    expect(await openWorkspace()).toEqual({ status: 'opened', name: 'void', count: 0 })
    expect(getSnapshot().rootIds).toEqual([])
  })
})
