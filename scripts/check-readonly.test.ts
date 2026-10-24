import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const SCRIPT = resolve('scripts/check-readonly.mjs')
const roots: string[] = []

/** Creates a temp project whose `src/` holds the given files, and runs the gate in it. */
function runGate(files: Record<string, string>): { code: number; output: string } {
  const root = mkdtempSync(join(tmpdir(), 'readonly-gate-'))
  roots.push(root)
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, content)
  }
  try {
    const output = execFileSync('node', [SCRIPT], { cwd: root, encoding: 'utf8', stdio: 'pipe' })
    return { code: 0, output }
  } catch (error) {
    const failure = error as { status: number; stderr: string }
    return { code: failure.status, output: failure.stderr }
  }
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('check-readonly gate', () => {
  it('passes a clean tree', () => {
    expect(runGate({ 'src/a.ts': 'export const a = 1\n' }).code).toBe(0)
  })

  it.each(['createWritable', 'removeEntry', 'readwrite', 'FileSystemWritableFileStream'])(
    'fails on %s',
    (identifier) => {
      const result = runGate({ 'src/a.ts': `const x = '${identifier}'\n` })
      expect(result.code).toBe(1)
      expect(result.output).toContain('src/a.ts:1')
    },
  )

  it('fails on a handle type outside services/fs.ts', () => {
    const result = runGate({ 'src/a.ts': 'let h: FileSystemDirectoryHandle\n' })
    expect(result.code).toBe(1)
  })

  it('allows handle types inside services/fs.ts', () => {
    expect(runGate({ 'src/services/fs.ts': 'let h: FileSystemDirectoryHandle\n' }).code).toBe(0)
  })
})
