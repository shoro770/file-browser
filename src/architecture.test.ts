/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/** The only file allowed to create or revoke object URLs. */
const URL_OWNER = 'services/previewSession.ts'

/** Patterns that must not appear in non-test source, with the reason shown on failure. */
const BANNED: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bdangerouslySetInnerHTML\b/, 'dangerouslySetInnerHTML'],
  [/\binnerHTML\b/, 'innerHTML'],
  [/\bstyle\s*=/, 'inline style attribute'],
  [/\bfetch\s*\(/, 'fetch('],
]

/**
 * Removes block and line comments so prose in JSDoc cannot trip a pattern.
 * @param source - File text.
 * @returns The text with comments blanked.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')
}

/**
 * Lists the policy violations in one non-test source file.
 * @param path - Path relative to `src`, with forward slashes.
 * @param source - File text.
 * @returns One message per violation; empty when the file is clean.
 */
function violations(path: string, source: string): string[] {
  const code = stripComments(source)
  const found: string[] = []
  for (const [pattern, name] of BANNED) if (pattern.test(code)) found.push(`${path}: ${name}`)
  const isComponent = path.startsWith('components/') || path === 'App.tsx'
  if (isComponent && /from\s+['"][^'"]*\/services\//.test(code)) found.push(`${path}: imports services/`)
  if (path !== URL_OWNER && /\b(createObjectURL|revokeObjectURL)\b/.test(code)) {
    found.push(`${path}: object URL call outside ${URL_OWNER}`)
  }
  return found
}

/**
 * Collects every non-test `.ts` and `.tsx` file under a directory.
 * @param dir - Absolute directory to scan.
 * @returns Absolute file paths.
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : []
  })
}

describe('violations (scanner)', () => {
  it('flags each banned pattern', () => {
    expect(violations('components/X.tsx', '<div dangerouslySetInnerHTML={x} />')).toHaveLength(1)
    expect(violations('lib/x.ts', 'el.innerHTML = s')).toHaveLength(1)
    expect(violations('components/X.tsx', '<div style={{ width: 1 }} />')).toHaveLength(1)
    expect(violations('hooks/x.ts', "await fetch('/a')")).toHaveLength(1)
  })

  it('flags components importing services, but not hooks', () => {
    const src = "import { getSnapshot } from '../services/tree'"
    expect(violations('components/Tree.tsx', src)).toHaveLength(1)
    expect(violations('App.tsx', src)).toHaveLength(1)
    expect(violations('hooks/useTree.ts', src)).toHaveLength(0)
  })

  it('allows object URL calls only in previewSession', () => {
    const src = 'const u = URL.createObjectURL(blob); URL.revokeObjectURL(u)'
    expect(violations(URL_OWNER, src)).toHaveLength(0)
    expect(violations('components/ImagePreview.tsx', src)).toHaveLength(1)
  })

  it('ignores comments', () => {
    expect(violations('lib/x.ts', '/** Never use fetch( or style= here. */\n// innerHTML')).toHaveLength(0)
  })
})

describe('src architecture policy', () => {
  const root = import.meta.dirname
  const files = sourceFiles(root)

  it('scans the source tree', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it('has no layering, object URL or unsafe-markup violations in non-test code', () => {
    const found = files.flatMap((file) => violations(relative(root, file).split(sep).join('/'), readFileSync(file, 'utf8')))
    expect(found).toEqual([])
  })
})
