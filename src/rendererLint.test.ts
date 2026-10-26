/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const SCRIPT = join(import.meta.dirname, '..', 'scripts', 'check-renderers.mjs')
const dirs: string[] = []

/** Runs the gate over a temp directory holding one file; returns its exit status and output. */
function run(name: string, source: string, extra: ReadonlyArray<[string, string]> = []): { code: number; out: string } {
  const dir = mkdtempSync(join(tmpdir(), 'renderers-'))
  dirs.push(dir)
  mkdirSync(join(dir, 'nested'))
  writeFileSync(join(dir, 'nested', name), source)
  for (const [n, c] of extra) writeFileSync(join(dir, 'nested', n), c)
  try {
    return { code: 0, out: execFileSync('node', [SCRIPT, dir], { encoding: 'utf8', stdio: 'pipe' }) }
  } catch (error) {
    const e = error as { status: number; stderr: string }
    return { code: e.status, out: e.stderr }
  }
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('check-renderers', () => {
  it('passes clean code, comments that mention the bans, and test files', () => {
    expect(run('A.tsx', '/** Never fetch( or style= here. */\n// el.style.x\nexport const a = 1').code).toBe(0)
    const testFile: [string, string] = ['A.test.tsx', "fetch('/x'); el.style.color = 'red'"]
    expect(run('A.tsx', 'export const a = 1', [testFile]).code).toBe(0)
  })

  it.each([
    ['fetch(', "await fetch('/a')"],
    ['inline style attribute', '<div style={{ width: 1 }} />'],
    ['.style access', "el.style.color = 'red'"],
    ['cssText', "el.cssText = 'a:b'"],
    ["setAttribute('style')", "el.setAttribute('style', 'a:b')"],
  ])('fails on %s, naming file and line', (name, source) => {
    const { code, out } = run('A.tsx', `const ok = 1\n${source}`)
    expect(code).toBe(1)
    expect(out).toContain('A.tsx:2')
    expect(out).toContain(name)
  })

  it.each([
    ['network API', "new XMLHttpRequest()"],
    ['fetch(', 'await fetch\n  (u)'],
    ['inline style attribute', '<div\n  style={s}\n/>'],
  ])('fails on %s, including split across lines', (name, source) => {
    const { code, out } = run('A.tsx', source)
    expect(code).toBe(1)
    expect(out).toContain(name)
  })

  it('does not flag a variable named style', () => {
    expect(run('A.tsx', "const style = 'a'\nif (style === 'b') {}").code).toBe(0)
  })

  it('fails when nothing is scanned', () => {
    expect(run('notes.md', 'x').code).toBe(1)
  })

  it('passes on the real renderers', () => {
    expect(execFileSync('node', [SCRIPT], { encoding: 'utf8', cwd: join(import.meta.dirname, '..') })).toContain('ok')
  })
})
