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

const { openWorkspace, getSnapshot, toggle, select, setShowDotfiles, subscribe, readItemFile, refresh } =
  await import('./tree')
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
    const getFileHandle = vi.fn(async (childName: string) => {
      if (children[childName] !== null) throw new Error('missing')
      return { getFile }
    })
    const handle = { name: folderName, kind: 'directory', values, getDirectoryHandle, getFileHandle }
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

  it('selects a folder, and ignores unknown and empty ids', async () => {
    await open({ a: null, d: {} })
    select('a')
    select('d')
    expect(getSnapshot().selectedId).toBe('d')
    const before = getSnapshot()
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

describe('readItemFile', () => {
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

  it('reads a top-level file through the root handle, once', async () => {
    const t = await open({ 'a.txt': null })
    const file = new File(['hi'], 'a.txt')
    t.getFile.mockResolvedValue(file)
    expect(await readItemFile('a.txt')).toBe(file)
    expect(t.getFile).toHaveBeenCalledTimes(1)
  })

  it('reads a nested file through its expanded parent', async () => {
    const t = await open({ src: { 'b.ts': null } })
    await toggle('src')
    const file = new File(['x'], 'b.ts')
    t.getFile.mockResolvedValue(file)
    expect(await readItemFile('src/b.ts')).toBe(file)
    expect(t.folders['src'].getFileHandle).toHaveBeenCalledWith('b.ts')
  })

  it('rejects unknown ids, folders and files whose parent was never listed', async () => {
    const t = await open({ src: { 'b.ts': null } })
    await expect(readItemFile('nope.txt')).rejects.toThrow()
    await expect(readItemFile('src')).rejects.toThrow()
    await expect(readItemFile('src/b.ts')).rejects.toThrow()
    expect(t.getFile).not.toHaveBeenCalled()
  })

  it('rejects when the file cannot be opened', async () => {
    const t = await open({ 'a.txt': null })
    t.getFile.mockRejectedValue(new DOMException('gone', 'NotFoundError'))
    await expect(readItemFile('a.txt')).rejects.toThrow()
  })
})

describe('refresh', () => {
  beforeEach(() => {
    picker.mockReset()
    rejectWith = null
    vi.useRealTimers()
  })

  async function open(spec: Spec, opts: Parameters<typeof fakeTree>[2] = {}) {
    const t = fakeTree('r', spec, opts)
    picker.mockResolvedValue(t.root)
    await openWorkspace()
    return t
  }

  it('re-reads the root once and reports success when nothing changed', async () => {
    const t = await open({ a: null })
    expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: false, clearedName: null })
    expect(t.root.values).toHaveBeenCalledTimes(2)
  })

  it('reads only the root and expanded folders, with no getFile', async () => {
    const spec: Spec = { open: { inner: { deep: null } }, shut: { x: null }, never: {}, f: null }
    const t = await open(spec)
    await toggle('open')
    await toggle('open/inner')
    await toggle('shut')
    await toggle('shut') // collapsed, cached
    const reads = (name: string) => t.folders[name].values.mock.calls.length
    const before = { open: reads('open'), inner: reads('open/inner'), shut: reads('shut'), never: reads('never') }

    await refresh()

    expect(reads('open')).toBe(before.open + 1)
    expect(reads('open/inner')).toBe(before.inner + 1)
    expect(reads('shut')).toBe(before.shut)
    expect(reads('never')).toBe(before.never)
    expect(t.getFile).not.toHaveBeenCalled()
  })

  it('shows added and removed entries in compareFileItems order', async () => {
    const d: Spec = { b2: null, b10: null, gone: null }
    await open({ d })
    await toggle('d')
    delete d.gone
    d.b1 = null
    d.sub = {}
    expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: false, clearedName: null })
    expect(getSnapshot().childIds.d).toEqual(['d/sub', 'd/b1', 'd/b2', 'd/b10'])
    expect(getSnapshot().items['d/gone']).toBeUndefined()
  })

  it('keeps expansion, the selection and the dotfile setting for surviving ids', async () => {
    await open({ d: { e: { f: null } }, '.hid': null })
    await toggle('d')
    await toggle('d/e')
    select('d/e/f')
    setShowDotfiles(false)
    const before = getSnapshot()
    await refresh()
    const after = getSnapshot()
    expect([...after.expandedIds]).toEqual([...before.expandedIds])
    expect(after.selectedId).toBe('d/e/f')
    expect(after.showDotfiles).toBe(false)
    expect(readShowDotfiles()).toBe(false)
    setShowDotfiles(true)
  })

  it('drops an expanded folder that was deleted, with its subtree and a selection inside it', async () => {
    const spec: Spec = { d: { e: { f: null } }, keep: null }
    await open(spec)
    await toggle('d')
    await toggle('d/e')
    select('d/e/f')
    delete spec.d
    expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: true, clearedName: 'f' })
    const snap = getSnapshot()
    expect(snap.rootIds).toEqual(['keep'])
    expect(snap.expandedIds.size).toBe(0)
    expect(snap.selectedId).toBeNull()
    expect(Object.keys(snap.items)).toEqual(['keep'])
    expect(snap.childIds).toEqual({})
  })

  it('treats a folder that became a file, and a file that became a folder, as different entries', async () => {
    const spec: Spec = { d: { x: null }, f: null }
    await open(spec)
    await toggle('d')
    select('f')
    spec.d = null
    spec.f = {}
    expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: true, clearedName: 'f' })
    const snap = getSnapshot()
    expect(snap.items.d.isDirectory).toBe(false)
    expect(snap.items.f.isDirectory).toBe(true)
    expect(snap.expandedIds.size).toBe(0)
    expect(snap.selectedId).toBeNull()
    expect(snap.items['d/x']).toBeUndefined()
  })

  it('reopens folder handles on every refresh and leaves collapsed caches alone', async () => {
    const d: Spec = { a: null }
    const t = await open({ d })
    await toggle('d')
    expect(t.root.getDirectoryHandle).toHaveBeenCalledTimes(1)
    await refresh()
    expect(t.root.getDirectoryHandle).toHaveBeenCalledTimes(2)
    d.b = null
    await toggle('d') // collapse
    await refresh()
    await toggle('d') // expand from the cache, with no read
    expect(getSnapshot().childIds.d).toEqual(['d/a'])
    await refresh()
    expect(getSnapshot().childIds.d).toEqual(['d/a', 'd/b'])
  })

  it('marks an unreadable expanded folder unavailable and still refreshes the rest', async () => {
    const ok: Spec = { y: null }
    const fail: string[] = []
    await open({ bad: { x: null }, ok }, { fail })
    await toggle('bad')
    await toggle('ok')
    fail.push('bad')
    ok.z = null
    expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: false, clearedName: null })
    const snap = getSnapshot()
    expect(snap.unavailableIds.has('bad')).toBe(true)
    expect(snap.expandedIds.has('bad')).toBe(true)
    expect(snap.childIds.ok).toEqual(['ok/y', 'ok/z'])
    fail.pop()
    await refresh()
    expect(getSnapshot().unavailableIds.has('bad')).toBe(false)
    expect(getSnapshot().childIds.bad).toEqual(['bad/x'])
  })

  it('leaves the state untouched and reports failure when the root cannot be read', async () => {
    const fail: string[] = []
    await open({ a: null }, { fail })
    select('a')
    fail.push('')
    const before = getSnapshot()
    expect(await refresh()).toEqual({ status: 'failed' })
    const after = getSnapshot()
    expect(after.refreshing).toBe(false)
    expect({ ...after, refreshing: true }).toEqual({ ...before, refreshing: true })
  })

  it('ignores a second request while one is running, with no extra reads', async () => {
    let release = () => {}
    let gate: Promise<void> = Promise.resolve()
    const t = await open({ a: null }, { delay: () => gate })
    gate = new Promise((resolve) => {
      release = resolve
    })
    const first = refresh()
    expect(getSnapshot().refreshing).toBe(true)
    expect(await refresh()).toEqual({ status: 'skipped' })
    release()
    expect(await first).toEqual({ status: 'refreshed', selectionCleared: false, clearedName: null })
    expect(getSnapshot().refreshing).toBe(false)
    expect(t.root.values).toHaveBeenCalledTimes(2)
  })

  it('discards its result when a new workspace opens meanwhile', async () => {
    let release = () => {}
    let gate: Promise<void> = Promise.resolve()
    await open({ old: null }, { delay: () => gate })
    gate = new Promise((resolve) => {
      release = resolve
    })
    const running = refresh()
    await open({ fresh: null })
    release()
    expect(await running).toEqual({ status: 'skipped' })
    const snap = getSnapshot()
    expect(snap.rootIds).toEqual(['fresh'])
    expect(snap.refreshing).toBe(false)
  })

  it('does not read a folder whose first read is still in flight', async () => {
    let release = () => {}
    let gate: Promise<void> = Promise.resolve()
    const t = await open({ d: { a: null } }, { delay: () => gate })
    gate = new Promise((resolve) => {
      release = resolve
    })
    const expanding = toggle('d')
    gate = Promise.resolve() // the refresh's own reads are not held up
    expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: false, clearedName: null })
    expect(t.folders['d'].values).toHaveBeenCalledTimes(1)
    release()
    await expanding
    expect(getSnapshot().childIds.d).toEqual(['d/a'])
    expect(getSnapshot().refreshing).toBe(false)
  })

  describe('selection probe', () => {
    it('reads only the Selection, once, and keeps it when readable', async () => {
      const t = await open({ a: null, b: null })
      select('a')
      expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: false, clearedName: null })
      expect(t.getFile).toHaveBeenCalledTimes(1)
      expect(getSnapshot().selectedId).toBe('a')
    })

    it('clears a Selection that was deleted and names it', async () => {
      const spec: Spec = { a: null, b: null }
      await open(spec)
      select('a')
      delete spec.a
      expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: true, clearedName: 'a' })
      expect(getSnapshot().selectedId).toBeNull()
    })

    it('clears a listed Selection whose file can no longer be read, keeping its row', async () => {
      const t = await open({ a: null })
      select('a')
      t.getFile.mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
      expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: true, clearedName: 'a' })
      expect(getSnapshot().selectedId).toBeNull()
      expect(getSnapshot().items.a).toBeDefined()
    })

    it('clears a Selection under a collapsed folder that was deleted', async () => {
      const spec: Spec = { d: { f: null }, keep: null }
      await open(spec)
      await toggle('d')
      select('d/f')
      await toggle('d') // collapse
      delete spec.d!.f
      expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: true, clearedName: 'f' })
      expect(getSnapshot().selectedId).toBeNull()
    })

    it('keeps a Selection whose path was replaced by a new file', async () => {
      const t = await open({ a: null })
      select('a')
      t.getFile.mockResolvedValue(new File(['new'], 'a'))
      expect(await refresh()).toEqual({ status: 'refreshed', selectionCleared: false, clearedName: null })
      expect(getSnapshot().selectedId).toBe('a')
    })

    it('ignores a probe that finishes after a new workspace opened', async () => {
      const t = await open({ a: null })
      select('a')
      let release = () => {}
      t.getFile.mockReturnValue(
        new Promise((resolve) => {
          release = () => resolve(new File([''], 'a'))
        }),
      )
      const running = refresh()
      await vi.waitFor(() => expect(t.getFile).toHaveBeenCalled())
      await open({ fresh: null })
      release()
      expect(await running).toEqual({ status: 'skipped' })
      expect(getSnapshot().rootIds).toEqual(['fresh'])
    })

    it('keeps a file selected while the probe of the old Selection runs', async () => {
      const t = await open({ a: null, b: null })
      select('a')
      let fail = () => {}
      t.getFile.mockReturnValue(
        new Promise((_resolve, reject) => {
          fail = () => reject(new DOMException('gone', 'NotFoundError'))
        }),
      )
      const running = refresh()
      await vi.waitFor(() => expect(t.getFile).toHaveBeenCalled())
      select('b')
      fail()
      expect(await running).toEqual({ status: 'refreshed', selectionCleared: false, clearedName: null })
      expect(getSnapshot().selectedId).toBe('b')
    })

    it('does not probe when the root cannot be read', async () => {
      const fail: string[] = []
      const t = await open({ a: null }, { fail })
      select('a')
      fail.push('')
      expect(await refresh()).toEqual({ status: 'failed' })
      expect(t.getFile).not.toHaveBeenCalled()
      expect(getSnapshot().selectedId).toBe('a')
    })
  })

  it('keeps ids equal to their paths', async () => {
    await open({ d: { a: null } })
    await toggle('d')
    await refresh()
    expect(Object.keys(getSnapshot().items).sort()).toEqual(['d', 'd/a'])
  })

  it('bumps refreshCount once per successful refresh only', async () => {
    const fail: string[] = []
    const d: Spec = { a: null }
    await open({ d }, { fail })
    expect(getSnapshot().refreshCount).toBe(0)
    await refresh()
    expect(getSnapshot().refreshCount).toBe(1)
    await toggle('d')
    setShowDotfiles(false)
    setShowDotfiles(true)
    expect(getSnapshot().refreshCount).toBe(1)
    await refresh()
    expect(getSnapshot().refreshCount).toBe(2)
    fail.push('')
    expect(await refresh()).toEqual({ status: 'failed' })
    expect(getSnapshot().refreshCount).toBe(2)
  })

  it('does not bump refreshCount for a skipped or stale refresh, and openWorkspace resets it', async () => {
    let release = () => {}
    let gate: Promise<void> = Promise.resolve()
    await open({ old: null }, { delay: () => gate })
    await refresh()
    expect(getSnapshot().refreshCount).toBe(1)
    gate = new Promise((resolve) => {
      release = resolve
    })
    const running = refresh()
    expect(await refresh()).toEqual({ status: 'skipped' })
    await open({ fresh: null })
    release()
    expect(await running).toEqual({ status: 'skipped' })
    expect(getSnapshot().refreshCount).toBe(0)
  })
})
