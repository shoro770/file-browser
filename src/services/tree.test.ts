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

const { openWorkspace, getSnapshot, toggle, select, setShowDotfiles, subscribe } = await import('./tree')
const { readShowDotfiles } = await import('./prefs')

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

type Spec = { [name: string]: Spec | null }

/** Builds a nested fake folder: object values are folders, `null` values are files. */
function fakeTree(name: string, spec: Spec, opts: { delay?: () => Promise<void>; fail?: string[] } = {}) {
  const getFile = vi.fn()
  const folders: Record<string, ReturnType<typeof make>> = {}
  function make(folderName: string, children: Spec, path: string) {
    const values = vi.fn(async function* () {
      if (opts.delay) await opts.delay()
      if (opts.fail?.includes(path)) throw new Error('boom')
      for (const [childName, child] of Object.entries(children)) {
        yield child ? { name: childName, kind: 'directory' } : { name: childName, kind: 'file', getFile }
      }
    })
    const getDirectoryHandle = vi.fn(async (childName: string) => {
      if (!children[childName]) throw new Error('missing')
      return folders[path ? `${path}/${childName}` : childName]
    })
    const handle = { name: folderName, kind: 'directory', values, getDirectoryHandle }
    for (const [childName, child] of Object.entries(children)) {
      const childPath = path ? `${path}/${childName}` : childName
      if (child) folders[childPath] = make(childName, child, childPath)
    }
    return handle
  }
  const root = make(name, spec, '')
  return { root, folders, getFile }
}

describe('toggle', () => {
  beforeEach(() => {
    picker.mockReset()
    rejectWith = null
    vi.useRealTimers()
  })

  it('idle: opening reads only the root', async () => {
    const t = fakeTree('r', { a: { b: { c: null } }, f: null })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    expect(t.folders['a'].values).not.toHaveBeenCalled()
    expect(t.root.getDirectoryHandle).not.toHaveBeenCalled()
  })

  it('fast first expand: children, expanded, no loading, no getFile', async () => {
    const t = fakeTree('r', { a: { z: null, b: {} } })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('a')
    const snap = getSnapshot()
    expect(snap.expandedIds.has('a')).toBe(true)
    expect(snap.loadingIds.size).toBe(0)
    expect(snap.childIds['a']).toEqual(['a/b', 'a/z'])
    expect(snap.items['a/b'].isDirectory).toBe(true)
    expect(t.getFile).not.toHaveBeenCalled()
  })

  it('re-expand uses the cache with no read', async () => {
    const t = fakeTree('r', { a: { x: null } })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('a')
    await toggle('a')
    expect(getSnapshot().expandedIds.has('a')).toBe(false)
    await toggle('a')
    expect(getSnapshot().expandedIds.has('a')).toBe(true)
    expect(t.folders['a'].values).toHaveBeenCalledTimes(1)
    expect(t.root.getDirectoryHandle).toHaveBeenCalledTimes(1)
  })

  it('nested state survives collapse and re-expand', async () => {
    const t = fakeTree('r', { a: { b: { c: null } } })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('a')
    await toggle('a/b')
    await toggle('a')
    await toggle('a')
    const snap = getSnapshot()
    expect(snap.expandedIds.has('a')).toBe(true)
    expect(snap.expandedIds.has('a/b')).toBe(true)
    expect(snap.childIds['a/b']).toEqual(['a/b/c'])
  })

  it('empty folder caches an empty child list', async () => {
    const t = fakeTree('r', { e: {} })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('e')
    expect(getSnapshot().childIds['e']).toEqual([])
    expect(getSnapshot().expandedIds.has('e')).toBe(true)
  })

  it('slow read shows loading after 150 ms, then children', async () => {
    vi.useFakeTimers()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let slowOn = false
    const t = fakeTree('r', { a: { x: null } }, { delay: () => (slowOn ? gate : Promise.resolve()) })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    slowOn = true

    const done = toggle('a')
    await vi.advanceTimersByTimeAsync(149)
    expect(getSnapshot().loadingIds.has('a')).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(getSnapshot().loadingIds.has('a')).toBe(true)
    release()
    await done
    expect(getSnapshot().loadingIds.has('a')).toBe(false)
    expect(getSnapshot().childIds['a']).toEqual(['a/x'])
  })

  it('fast read never shows loading', async () => {
    vi.useFakeTimers()
    const t = fakeTree('r', { a: { x: null } })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('a')
    await vi.advanceTimersByTimeAsync(500)
    expect(getSnapshot().loadingIds.size).toBe(0)
  })

  it('double activation while pending reads once', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let slowOn = false
    const t = fakeTree('r', { a: { x: null } }, { delay: () => (slowOn ? gate : Promise.resolve()) })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    slowOn = true
    const first = toggle('a')
    const second = toggle('a')
    release()
    await Promise.all([first, second])
    expect(t.folders['a'].values).toHaveBeenCalledTimes(1)
    expect(getSnapshot().childIds['a']).toEqual(['a/x'])
    expect(getSnapshot().expandedIds.has('a')).toBe(true)
  })

  it('failed read marks the folder unavailable, keeps it expanded and swallows the error', async () => {
    const t = fakeTree('r', { a: { x: null }, b: { y: null } }, { fail: ['a'] })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await expect(toggle('a')).resolves.toBeUndefined()
    const snap = getSnapshot()
    expect(snap.unavailableIds.has('a')).toBe(true)
    expect(snap.expandedIds.has('a')).toBe(true)
    expect(snap.childIds['a']).toBeUndefined()
    expect(snap.loadingIds.size).toBe(0)
    await toggle('b')
    expect(getSnapshot().childIds['b']).toEqual(['b/y'])
    expect(getSnapshot().unavailableIds.has('b')).toBe(false)
  })

  it('failed open of the child handle is also unavailable', async () => {
    const t = fakeTree('r', { a: { x: null } })
    t.root.getDirectoryHandle.mockRejectedValueOnce(new Error('denied'))
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('a')
    expect(getSnapshot().unavailableIds.has('a')).toBe(true)
    expect(getSnapshot().expandedIds.has('a')).toBe(true)
  })

  it('re-toggling an unavailable folder only flips expansion, with no read', async () => {
    const t = fakeTree('r', { a: { x: null } }, { fail: ['a'] })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('a')
    await toggle('a')
    expect(getSnapshot().expandedIds.has('a')).toBe(false)
    await toggle('a')
    expect(getSnapshot().expandedIds.has('a')).toBe(true)
    expect(t.root.getDirectoryHandle).toHaveBeenCalledTimes(1)
    expect(t.folders['a'].values).toHaveBeenCalledTimes(1)
  })

  it('slow failure clears loading and its timer', async () => {
    vi.useFakeTimers()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let slowOn = false
    const t = fakeTree('r', { a: { x: null } }, { fail: ['a'], delay: () => (slowOn ? gate : Promise.resolve()) })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    slowOn = true
    const done = toggle('a')
    await vi.advanceTimersByTimeAsync(150)
    expect(getSnapshot().loadingIds.has('a')).toBe(true)
    release()
    await done
    expect(getSnapshot().loadingIds.size).toBe(0)
    expect(getSnapshot().unavailableIds.has('a')).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('opening a new workspace clears unavailable marks', async () => {
    const t = fakeTree('r', { a: { x: null } }, { fail: ['a'] })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('a')
    picker.mockResolvedValue(fakeTree('r2', { a: {} }).root)
    await openWorkspace()
    expect(getSnapshot().unavailableIds.size).toBe(0)
  })

  it('stale read is discarded when a new workspace opens', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let slowOn = false
    const old = fakeTree('old', { a: { x: null } }, { delay: () => (slowOn ? gate : Promise.resolve()) })
    picker.mockResolvedValue(old.root)
    await openWorkspace()
    slowOn = true
    const stale = toggle('a')
    picker.mockResolvedValue(fakeTree('new', { a: null }).root)
    await openWorkspace()
    release()
    await stale
    const snap = getSnapshot()
    expect(snap.rootName).toBe('new')
    expect(snap.childIds).toEqual({})
    expect(snap.expandedIds.size).toBe(0)
    expect(Object.keys(snap.items)).toEqual(['a'])
  })

  it('opening a new workspace discards expansion state', async () => {
    const t = fakeTree('r', { a: { x: null } })
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    await toggle('a')
    picker.mockResolvedValue(fakeTree('r2', { a: {} }).root)
    await openWorkspace()
    expect(getSnapshot().expandedIds.size).toBe(0)
    expect(getSnapshot().childIds).toEqual({})
  })
})

describe('select', () => {
  beforeEach(() => {
    picker.mockReset()
    rejectWith = null
    vi.useRealTimers()
  })

  async function open(spec: Spec) {
    const t = fakeTree('r', spec)
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    return t
  }

  it('selects a file without calling getFile', async () => {
    const t = await open({ a: null, b: null })
    select('a')
    expect(getSnapshot().selectedId).toBe('a')
    expect(t.getFile).not.toHaveBeenCalled()
  })

  it('replaces the selection', async () => {
    await open({ a: null, b: null })
    select('a')
    select('b')
    expect(getSnapshot().selectedId).toBe('b')
  })

  it('re-selecting the same file does not publish', async () => {
    await open({ a: null })
    select('a')
    const before = getSnapshot()
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    select('a')
    unsubscribe()
    expect(listener).not.toHaveBeenCalled()
    expect(getSnapshot()).toBe(before)
  })

  it('ignores folder, unknown and empty ids', async () => {
    await open({ a: null, d: {} })
    select('a')
    const before = getSnapshot()
    select('d')
    select('nope')
    select(null as unknown as string)
    expect(getSnapshot()).toBe(before)
  })

  it('survives collapsing the parent folder', async () => {
    await open({ d: { f: null } })
    await toggle('d')
    select('d/f')
    await toggle('d')
    expect(getSnapshot().expandedIds.has('d')).toBe(false)
    expect(getSnapshot().selectedId).toBe('d/f')
  })

  it('toggling a folder leaves the selection alone', async () => {
    await open({ a: null, d: { f: null } })
    select('a')
    await toggle('d')
    expect(getSnapshot().selectedId).toBe('a')
  })

  it('is cleared by opening a new workspace', async () => {
    await open({ a: null })
    select('a')
    picker.mockResolvedValue(fakeTree('r2', { a: null }).root)
    await openWorkspace()
    expect(getSnapshot().selectedId).toBeNull()
  })
})

describe('setShowDotfiles', () => {
  const stored = new Map<string, string>()
  const win = globalThis as unknown as { window: { localStorage?: unknown } }

  beforeEach(() => {
    picker.mockReset()
    rejectWith = null
    vi.useRealTimers()
    stored.clear()
    win.window.localStorage = {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
    }
    setShowDotfiles(true)
    stored.clear()
  })

  async function open(spec: Spec) {
    const t = fakeTree('r', spec)
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    return t
  }

  it('defaults to shown', () => {
    expect(getSnapshot().showDotfiles).toBe(true)
  })

  it('hides with no handle call and no collapse, keeping a non-dotfile selection', async () => {
    const t = await open({ src: { 'a.ts': null, '.env': null }, '.git': { config: null } })
    await toggle('src')
    select('src/a.ts')
    const reads = t.folders['src'].values.mock.calls.length
    const before = getSnapshot()
    setShowDotfiles(false)
    const after = getSnapshot()
    expect(after.showDotfiles).toBe(false)
    expect(after.selectedId).toBe('src/a.ts')
    expect(after.expandedIds).toBe(before.expandedIds)
    expect(after.childIds).toBe(before.childIds)
    expect(t.folders['src'].values.mock.calls.length).toBe(reads)
    expect(t.root.getDirectoryHandle).toHaveBeenCalledTimes(1)
  })

  it('clears a dotfile selection and one inside a dotfile folder', async () => {
    await open({ '.env': null, '.git': { config: null }, a: null })
    select('.env')
    setShowDotfiles(false)
    expect(getSnapshot().selectedId).toBeNull()
    setShowDotfiles(true)
    await toggle('.git')
    select('.git/config')
    setShowDotfiles(false)
    expect(getSnapshot().selectedId).toBeNull()
  })

  it('keeps a dotfile selection when showing, and a repeat value does not publish', async () => {
    await open({ '.env': null })
    select('.env')
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    setShowDotfiles(true)
    unsubscribe()
    expect(listener).not.toHaveBeenCalled()
    expect(getSnapshot().selectedId).toBe('.env')
  })

  it('persists only showDotfiles', () => {
    setShowDotfiles(false)
    expect([...stored.entries()]).toEqual([['showDotfiles', 'false']])
    expect(readShowDotfiles()).toBe(false)
    setShowDotfiles(true)
    expect(readShowDotfiles()).toBe(true)
  })

  it('reads invalid or missing values as shown, and survives failing storage', () => {
    stored.set('showDotfiles', 'banana')
    expect(readShowDotfiles()).toBe(true)
    const blocked = () => {
      throw new Error('blocked')
    }
    win.window.localStorage = { getItem: blocked, setItem: blocked }
    expect(readShowDotfiles()).toBe(true)
    expect(() => setShowDotfiles(false)).not.toThrow()
    expect(getSnapshot().showDotfiles).toBe(false)
  })

  it('opening a new workspace keeps the flag', async () => {
    await open({ a: null })
    setShowDotfiles(false)
    await open({ b: null })
    expect(getSnapshot().showDotfiles).toBe(false)
  })
})

describe('deterministic ids', () => {
  const spec: Spec = { src: { 'a.ts': null, lib: { 'b.ts': null } }, 'README.md': null }

  beforeEach(() => {
    picker.mockReset()
    rejectWith = null
    vi.useRealTimers()
  })

  /** Opens `spec`, expands every folder, and returns all ids and child lists. */
  async function collect() {
    picker.mockResolvedValue(fakeTree('r', spec).root)
    await openWorkspace()
    await toggle('src')
    await toggle('src/lib')
    const snap = getSnapshot()
    return { rootIds: snap.rootIds, childIds: snap.childIds, itemIds: Object.keys(snap.items).sort() }
  }

  it('every id equals its path, with no extra characters', async () => {
    const result = await collect()
    expect(result.itemIds).toEqual(['README.md', 'src', 'src/a.ts', 'src/lib', 'src/lib/b.ts'])
    const snap = getSnapshot()
    for (const [id, item] of Object.entries(snap.items)) {
      expect(item.id).toBe(id)
      expect(item.path).toBe(`/${id}`)
    }
  })

  it('is identical across reopens, whatever the clock and random source return', async () => {
    const first = await collect()

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2031-01-01T00:00:00Z'))
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.123456)
    const uuid = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000')
    try {
      const second = await collect()
      expect(second).toEqual(first)
    } finally {
      random.mockRestore()
      uuid.mockRestore()
    }
  })

  it('never reads randomness or the clock while deriving ids', async () => {
    const random = vi.spyOn(Math, 'random')
    const uuid = vi.spyOn(globalThis.crypto, 'randomUUID')
    const now = vi.spyOn(Date, 'now')
    try {
      await collect()
      expect(random).not.toHaveBeenCalled()
      expect(uuid).not.toHaveBeenCalled()
      expect(now).not.toHaveBeenCalled()
    } finally {
      random.mockRestore()
      uuid.mockRestore()
      now.mockRestore()
    }
  })
})
