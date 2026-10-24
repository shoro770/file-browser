// Read-only gate: fails if src/ contains write-capable File System Access identifiers,
// or references file-system handle types outside src/services/fs.ts.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = 'src'
const FS_MODULE = join('src', 'services', 'fs.ts')
const FORBIDDEN = /createWritable|removeEntry|\.move\(|readwrite|FileSystemWritableFileStream/
const HANDLE = /FileSystem(Directory|File)?Handle/

/** Lists every file under a directory, recursively. */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

const failures = []
for (const file of walk(SRC)) {
  if (!/\.(ts|tsx|js|jsx|mjs)$/.test(file)) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    const where = `${relative('.', file)}:${index + 1}`
    if (FORBIDDEN.test(line)) failures.push(`${where}: forbidden write API: ${line.trim()}`)
    if (file !== FS_MODULE && HANDLE.test(line)) {
      failures.push(`${where}: file-system handle type outside services/fs.ts: ${line.trim()}`)
    }
  })
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('check-readonly: ok')
