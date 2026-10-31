import { describe, expect, it } from 'vitest'
import { checkBundleBudget, verifyTreeNodeId } from './checks.ts'

describe('verifyTreeNodeId', () => {
  it('approves an id equal to the path', () => {
    const r = verifyTreeNodeId('src/a.ts', 'src/a.ts')
    expect(r.ok).toBe(true)
    expect(r.message).toMatch(/^Approved/)
  })
  it('rejects a UUID', () => {
    const r = verifyTreeNodeId('3f2b8c1e-9a4d-4e6b-8f1a-2c3d4e5f6a7b', 'src/a.ts')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/UUID/)
  })
  it('rejects a Date.now() suffix', () => {
    const r = verifyTreeNodeId('src/a.ts-1730000000000', 'src/a.ts')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/timestamp/)
  })
  it('rejects a Math.random() value', () => {
    const r = verifyTreeNodeId('0.8472910384756', 'src/a.ts')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/Math\.random/)
  })
  it('rejects a normalization difference and says so', () => {
    const r = verifyTreeNodeId('./src/a.ts', 'src/a.ts')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/normalization/)
  })
  it('rejects an empty path', () => {
    expect(verifyTreeNodeId('', '').ok).toBe(false)
  })
})

describe('checkBundleBudget', () => {
  it('reports exact headroom under budget', () => {
    const r = checkBundleBudget(120)
    expect(r.ok).toBe(true)
    expect(r.message).toMatch(/30\.00 KB remaining/)
  })
  it('accepts exactly 150 KB with zero headroom', () => {
    const r = checkBundleBudget(150)
    expect(r.ok).toBe(true)
    expect(r.message).toMatch(/0\.00 KB remaining/)
  })
  it('flags an overrun', () => {
    const r = checkBundleBudget(150.5)
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/BUDGET EXCEEDED.*0\.50 KB over/)
  })
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid input %s', (n) => {
    expect(checkBundleBudget(n).ok).toBe(false)
  })
})
