#!/usr/bin/env node
// PreToolUse guard for Edit/Write-style tools.
// Reads the hook JSON from stdin and denies writes to protected paths:
//   - .env and .env.* files (secrets)
//   - .claude/settings.json (harness configuration)
//   - dist/ (Vite's default build output; no outDir is set in this repo)
// Denied: prints a permissionDecision JSON to stdout. Allowed: prints nothing. Always exits 0.

import path from 'node:path'

const BUILD_DIR = 'dist'
const SETTINGS_FILE = path.join('.claude', 'settings.json')
const SETTINGS_LOCAL_FILE = path.join('.claude', 'settings.local.json')
const HOOKS_DIR = path.join('.claude', 'hooks')

/** Read all of stdin as a string. */
async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Decide whether a path is protected.
 * @param {string} filePath Target path from the tool input (absolute or relative).
 * @param {string} root Project root used to resolve relative paths.
 * @returns {string | null} Reason the path is protected, or null if it is allowed.
 */
function protectedReason(filePath, root) {
  const abs = path.resolve(root, filePath)
  const rel = path.relative(root, abs)
  const base = path.basename(abs)

  if (base === '.env' || base.startsWith('.env.')) {
    return `${base} holds secrets and local configuration, so Claude must not edit or write it. Ask the user to change it themselves; document any needed variable in the README or a non-secret example instead.`
  }

  // Paths outside the project root are not ours to judge below this point.
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null

  if (rel === SETTINGS_FILE || rel === SETTINGS_LOCAL_FILE) {
    return `${rel} configures hooks, permissions and tooling for this project, so changes need the user's explicit review. Propose the change in chat and let the user apply it.`
  }

  if (rel.startsWith(HOOKS_DIR + path.sep)) {
    return `${HOOKS_DIR}/ holds the enforcement hooks and their fixtures, so editing them could switch the guards off. Propose the change in chat and let the user apply it.`
  }

  if (rel === BUILD_DIR || rel.startsWith(BUILD_DIR + path.sep)) {
    return `${BUILD_DIR}/ is generated build output (overwritten by \`npm run build\`), so hand edits are lost. Change the source under src/ and rebuild instead.`
  }

  return null
}

let input
try {
  input = JSON.parse(await readStdin())
} catch {
  process.exit(0) // Malformed input: nothing to inspect, allow.
}

const toolInput = input?.tool_input ?? {}
const filePath = toolInput.file_path ?? toolInput.path
if (typeof filePath !== 'string' || filePath === '') process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR || input?.cwd || process.cwd()
const reason = protectedReason(filePath, root)

if (reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }) + '\n',
  )
}
process.exit(0)
