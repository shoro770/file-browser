// Renderer gate: fails if non-test code in the renderer directory could make a request or
// set inline styles (AD-12). Pass a directory to scan another one; the default is the renderers.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = process.argv[2] ?? join('src', 'components', 'preview')
const BANNED = [
  [/\bfetch\s*\(/, 'fetch('],
  [/\bXMLHttpRequest\b|\bsendBeacon\b|\bnew\s+(WebSocket|EventSource|Image)\b/, 'network API'],
  [/(?<!\b(?:const|let|var)\s)(?<![\w.$])style\s*=(?!=)/, 'inline style attribute'],
  [/\.style\b|\[\s*['"`]style['"`]\s*\]/, '.style access'],
  [/\bcssText\b|\bsetProperty\s*\(/, 'cssText/setProperty'],
  [/setAttribute\s*\(\s*['"`]style['"`]/, "setAttribute('style')"],
]

/** Lists every file under a directory, recursively. */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

/** Blanks block and line comments, keeping line breaks so reported lines stay accurate. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/.*$/gm, '$1')
}

let files
try {
  files = walk(DIR).filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f) && !/\.test\.[jt]sx?$/.test(f))
} catch {
  console.error(`check-renderers: cannot read ${DIR}`)
  process.exit(1)
}
if (files.length === 0) {
  console.error(`check-renderers: no renderer files under ${DIR}`)
  process.exit(1)
}

const failures = []
for (const file of files) {
  const code = stripComments(readFileSync(file, 'utf8'))
  for (const [pattern, name] of BANNED) {
    const global = new RegExp(pattern.source, 'g')
    for (const match of code.matchAll(global)) {
      const line = code.slice(0, match.index).split('\n').length
      failures.push(`${file}:${line}: ${name}: ${code.split('\n')[line - 1].trim()}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`check-renderers: ok (${files.length} files)`)
