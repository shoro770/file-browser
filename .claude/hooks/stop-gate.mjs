#!/usr/bin/env node
// Stop hook: a turn cannot end while the project's check gate is red.
//
// Gate: `npm run check` (typecheck, lint, test; see package.json).
// - stop_hook_active === true: this stop is already a retry after a block. Exit 0 silently
//   so an unfixable failure can never trap the session in an endless loop.
// - Gate green: print nothing, exit 0.
// - Gate red: print a header plus the gate's output to stderr, exit 2 (blocks the stop).

import { spawnSync } from 'node:child_process'

const CHECK = ['npm', 'run', 'check']
const TIMEOUT_MS = 10 * 60 * 1000

/** Read all of stdin as a string. */
async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

let input = {}
try {
  input = JSON.parse(await readStdin())
} catch {
  // Unparseable payload: treat as a first stop and run the gate.
}

if (input?.stop_hook_active === true) process.exit(0)

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const result = spawnSync(CHECK[0], CHECK.slice(1), {
  cwd,
  encoding: 'utf8',
  timeout: TIMEOUT_MS,
  maxBuffer: 64 * 1024 * 1024,
})

if (result.status === 0) process.exit(0)

const reason = result.error
  ? `could not run the check (${result.error.message})`
  : `exited with ${result.signal ? `signal ${result.signal}` : `code ${result.status}`}`
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trimEnd()

process.stderr.write(
  `stop-gate: \`${CHECK.join(' ')}\` failed (${reason}) in ${cwd}.\n` +
    'The turn cannot end while the gate is red. Fix the failures below, then finish.\n\n' +
    `${output}\n`,
)
process.exit(2)
