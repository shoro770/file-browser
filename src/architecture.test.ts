/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/** The only file allowed to create or revoke object URLs. */
const URL_OWNER = 'services/previewSession.ts'

/** The only file allowed to put parsed HTML into the DOM. */
const SANITIZE_OWNER = 'services/sanitize.ts'

/** Ways to insert or parse markup that must go through the sanitize chokepoint. */
const MARKUP_SINKS = /\b(insertAdjacentHTML|outerHTML|createContextualFragment|DOMParser)\b|\bdocument\s*\.\s*write(ln)?\s*\(/

/** The attributes of each `<Suspense ...>` opening tag (arrow functions and `=>` tolerated). */
const SUSPENSE_TAG = /<Suspense\b((?:[^>]|=>)*)>/g

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
  if (path !== SANITIZE_OWNER && MARKUP_SINKS.test(code)) {
    found.push(`${path}: markup inserted or parsed outside ${SANITIZE_OWNER}`)
  }
  if (path.startsWith('components/') && blankSuspense(code)) found.push(`${path}: Suspense without a visible fallback`)
  return found
}

/**
 * Tells whether any `<Suspense>` in the code lacks a visible fallback.
 * @param code - Comment-free file text.
 * @returns True when a Suspense has no `fallback`, or a `null` or `undefined` one.
 */
function blankSuspense(code: string): boolean {
  for (const [, attrs] of code.matchAll(SUSPENSE_TAG)) {
    if (!/\bfallback\s*=/.test(attrs) || /\bfallback\s*=\s*\{\s*(null|undefined)\s*\}/.test(attrs)) return true
  }
  return false
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

/** The shell file whose size is capped. */
const APP_FILE = 'App.tsx'

/** Most lines App.tsx may have; past this, logic belongs in a hook. */
const APP_MAX_LINES = 220

/**
 * Counts the lines in a file, ignoring the final newline.
 * @param source - File text.
 * @returns The number of lines, as `wc -l` would report for a newline-terminated file.
 */
function lineCount(source: string): number {
  if (source === '') return 0
  return source.replace(/\n$/, '').split('\n').length
}

/**
 * Checks the App.tsx size cap.
 * @param path - Path relative to `src`, with forward slashes.
 * @param source - File text.
 * @returns A message when the file is App.tsx and over the cap; otherwise null.
 */
function oversizedShell(path: string, source: string): string | null {
  const lines = lineCount(source)
  if (path !== APP_FILE || lines <= APP_MAX_LINES) return null
  return `${path}: ${lines} lines exceeds ${APP_MAX_LINES}; extract logic into a hook under src/hooks/ (e.g. an announcer hook) instead of growing the shell`
}

/**
 * Finds lint suppressions. Scans raw text because they live in comments.
 * @param path - Path relative to `src`, with forward slashes.
 * @param source - File text.
 * @returns A message when the file contains `eslint-disable`; otherwise null.
 */
function lintSuppression(path: string, source: string): string | null {
  return source.includes('eslint-disable') ? `${path}: eslint-disable (fix the code instead of suppressing the rule)` : null
}

describe('oversizedShell (scanner)', () => {
  const lines = (n: number) => 'x\n'.repeat(n)

  it('allows App.tsx at the cap and flags it one line over', () => {
    expect(oversizedShell('App.tsx', lines(APP_MAX_LINES))).toBeNull()
    expect(oversizedShell('App.tsx', lines(APP_MAX_LINES + 1))).toContain('src/hooks/')
    expect(oversizedShell('App.tsx', lines(APP_MAX_LINES - 1) + 'x')).toBeNull()
    expect(oversizedShell('App.tsx', lines(APP_MAX_LINES) + 'x')).not.toBeNull()
  })

  it('ignores other files', () => {
    expect(oversizedShell('components/Tree.tsx', lines(APP_MAX_LINES + 50))).toBeNull()
  })
})

describe('lintSuppression (scanner)', () => {
  it('flags eslint-disable variants, including in comments', () => {
    expect(lintSuppression('a.ts', '/* eslint-disable */')).not.toBeNull()
    expect(lintSuppression('a.ts', 'x // eslint-disable-next-line foo')).not.toBeNull()
  })

  it('passes clean files', () => {
    expect(lintSuppression('a.ts', 'const a = 1 // fine')).toBeNull()
  })
})

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

  it('flags a Suspense with a null, undefined or omitted fallback in components', () => {
    expect(violations('components/X.tsx', '<Suspense fallback={null}><A /></Suspense>')).toHaveLength(1)
    expect(violations('components/X.tsx', '<Suspense fallback={ undefined }><A /></Suspense>')).toHaveLength(1)
    expect(violations('components/X.tsx', '<Suspense><A /></Suspense>')).toHaveLength(1)
    expect(violations('components/X.tsx', '<Suspense fallback={<PreviewLoading />}><A /></Suspense>')).toHaveLength(0)
  })

  it('flags markup sinks outside sanitize', () => {
    for (const src of [
      "el.insertAdjacentHTML('beforeend', h)",
      'el.outerHTML = h',
      'document.write(h)',
      'range.createContextualFragment(h)',
      "new DOMParser().parseFromString(h, 'text/html')",
    ]) {
      expect(violations('components/X.tsx', src)).toHaveLength(1)
      expect(violations(SANITIZE_OWNER, src)).toHaveLength(0)
    }
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

  it('keeps App.tsx at or under the line cap', () => {
    const source = readFileSync(join(root, APP_FILE), 'utf8')
    expect(oversizedShell(APP_FILE, source)).toBeNull()
  })

  it('has no eslint-disable in non-test code', () => {
    const found = files.flatMap((file) => {
      const message = lintSuppression(relative(root, file).split(sep).join('/'), readFileSync(file, 'utf8'))
      return message === null ? [] : [message]
    })
    expect(found).toEqual([])
  })
})
