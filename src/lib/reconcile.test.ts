import { describe, expect, it } from 'vitest'
import type { FileItem, ReconcileState } from '../types'
import { reconcile } from './reconcile'

const file = (id: string): FileItem => ({ id, name: id.split('/').pop()!, path: `/${id}`, isDirectory: false })
const dir = (id: string): FileItem => ({ ...file(id), isDirectory: true })

/** root: a/ (expanded: a/b/ (expanded: a/b/x), a/y), f. */
function state(extra: Partial<ReconcileState> = {}): ReconcileState {
  const all = [dir('a'), dir('a/b'), file('a/b/x'), file('a/y'), file('f')]
  return {
    items: Object.fromEntries(all.map((item) => [item.id, item])),
    rootIds: ['a', 'f'],
    childIds: { a: ['a/b', 'a/y'], 'a/b': ['a/b/x'] },
    expandedIds: new Set(['a', 'a/b']),
    unavailableIds: new Set(),
    selectedId: 'a/b/x',
    ...extra,
  }
}

const same = () => ({
  levels: { '': [dir('a'), file('f')], a: [dir('a/b'), file('a/y')], 'a/b': [file('a/b/x')] },
  failed: new Set<string>(),
})

describe('reconcile', () => {
  it('unchanged ids keep expansion, selection and item objects', () => {
    const prev = state()
    const out = reconcile(prev, same())
    expect(out.rootIds).toEqual(['a', 'f'])
    expect(out.childIds).toEqual(prev.childIds)
    expect([...out.expandedIds]).toEqual(['a', 'a/b'])
    expect(out.selectedId).toBe('a/b/x')
    expect(out.selectionCleared).toBe(false)
    expect(out.items['a/y']).toBe(prev.items['a/y'])
  })

  it('added entries appear in the fresh order', () => {
    const prev = state()
    const out = reconcile(prev, { levels: { a: [dir('a/b'), file('a/new'), file('a/y')] }, failed: new Set() })
    expect(out.childIds.a).toEqual(['a/b', 'a/new', 'a/y'])
    expect(out.items['a/new']).toEqual(file('a/new'))
  })

  it('removed entries disappear and a removed folder takes its subtree and expansion with it', () => {
    const prev = state({ selectedId: 'f' })
    const out = reconcile(prev, { levels: { a: [file('a/y')] }, failed: new Set() })
    expect(out.childIds.a).toEqual(['a/y'])
    expect(out.items['a/b']).toBeUndefined()
    expect(out.items['a/b/x']).toBeUndefined()
    expect(out.childIds['a/b']).toBeUndefined()
    expect([...out.expandedIds]).toEqual(['a'])
    expect(out.selectedId).toBe('f')
    expect(out.selectionCleared).toBe(false)
  })

  it('clears a selection inside a removed folder', () => {
    const out = reconcile(state(), { levels: { a: [file('a/y')] }, failed: new Set() })
    expect(out.selectedId).toBeNull()
    expect(out.selectionCleared).toBe(true)
  })

  it('clears a removed selected file', () => {
    const out = reconcile(state({ selectedId: 'a/y' }), { levels: { a: [dir('a/b')] }, failed: new Set() })
    expect(out.selectedId).toBeNull()
    expect(out.selectionCleared).toBe(true)
  })

  it('treats a folder that became a file as a different entry', () => {
    const out = reconcile(state(), { levels: { '': [file('a'), file('f')] }, failed: new Set() })
    expect(out.items.a.isDirectory).toBe(false)
    expect([...out.expandedIds]).toEqual([])
    expect(out.childIds).toEqual({})
    expect(out.items['a/b']).toBeUndefined()
    expect(out.selectedId).toBeNull()
  })

  it('treats a file that became a folder as a different entry, dropping its selection', () => {
    const out = reconcile(state({ selectedId: 'f' }), { levels: { '': [dir('a'), dir('f')] }, failed: new Set() })
    expect(out.items.f.isDirectory).toBe(true)
    expect(out.selectedId).toBeNull()
    expect(out.selectionCleared).toBe(true)
  })

  it('marks an unreadable expanded folder unavailable, keeps it expanded and drops its cache', () => {
    const out = reconcile(state({ selectedId: 'f' }), { levels: { '': [dir('a'), file('f')] }, failed: new Set(['a']) })
    expect(out.unavailableIds.has('a')).toBe(true)
    expect(out.expandedIds.has('a')).toBe(true)
    expect(out.childIds.a).toBeUndefined()
    expect(out.items['a/b']).toBeUndefined()
    expect(out.items.a).toBeDefined()
  })

  it('clears the unavailable mark of a folder that reads again', () => {
    const prev = state({ unavailableIds: new Set(['a']) })
    expect(reconcile(prev, same()).unavailableIds.has('a')).toBe(false)
  })

  it('clears a selection inside a folder that failed to read', () => {
    const out = reconcile(state(), { levels: { '': [dir('a'), file('f')] }, failed: new Set(['a']) })
    expect(out.selectedId).toBeNull()
    expect(out.selectionCleared).toBe(true)
  })

  it('removes many files without touching unrelated state', () => {
    const files = Array.from({ length: 1000 }, (_, i) => file(`big/f${i}`))
    const prev = state({
      items: { ...state().items, big: dir('big'), ...Object.fromEntries(files.map((f) => [f.id, f])) },
      rootIds: ['a', 'big', 'f'],
      childIds: { ...state().childIds, big: files.map((f) => f.id) },
      expandedIds: new Set(['a', 'a/b', 'big']),
    })
    const out = reconcile(prev, { levels: { big: [] }, failed: new Set() })
    expect(out.childIds.big).toEqual([])
    expect(Object.keys(out.items).sort()).toEqual(['a', 'a/b', 'a/b/x', 'a/y', 'big', 'f'])
    expect([...out.expandedIds].sort()).toEqual(['a', 'a/b', 'big'])
    expect(out.selectedId).toBe('a/b/x')
  })

  it('leaves levels that were not re-read alone, and does not modify its input', () => {
    const prev = state({ expandedIds: new Set(['a']) })
    const snapshot = JSON.stringify([prev.items, prev.childIds, [...prev.expandedIds]])
    const out = reconcile(prev, { levels: { '': [dir('a'), file('f')], a: [dir('a/b'), file('a/y')] }, failed: new Set() })
    expect(out.childIds['a/b']).toEqual(['a/b/x'])
    expect(JSON.stringify([prev.items, prev.childIds, [...prev.expandedIds]])).toBe(snapshot)
  })

  it('replaces the root level', () => {
    const out = reconcile(state({ selectedId: null }), { levels: { '': [file('z')] }, failed: new Set() })
    expect(out.rootIds).toEqual(['z'])
    expect(Object.keys(out.items)).toEqual(['z'])
    expect(out.expandedIds.size).toBe(0)
  })
})
