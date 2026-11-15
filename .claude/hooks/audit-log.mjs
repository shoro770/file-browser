#!/usr/bin/env node
// Audit trail hook: appends one single-line JSON record per hook event to
// logs/agent-audit.jsonl (under CLAUDE_PROJECT_DIR, else the cwd).
//
// Every record has exactly these fields: ts, session_id, event, tool, target.
// Secrets are scrubbed before writing. This script never blocks and never fails:
// any error is swallowed, nothing is printed, and the exit code is always 0.

import { appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const MAX_TARGET = 500
const REDACTED = '[REDACTED]'
const KEY_WORDS = '(?:token|secret|password|passwd|api[_-]?key|apikey)'

/** Patterns that redact secret values, applied in order. */
const SCRUBBERS = [
  // Authorization: Bearer abc123
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`],
  // API_TOKEN=abc, password: "abc", "api_key": "abc"
  [new RegExp(`([\\w-]*${KEY_WORDS}[\\w-]*["']?\\s*[=:]\\s*)("[^"]*"|'[^']*'|[^\\s"',;&]+)`, 'gi'), `$1${REDACTED}`],
  // --token abc, --password abc
  [new RegExp(`(--[\\w-]*${KEY_WORDS}[\\w-]*\\s+)("[^"]*"|'[^']*'|\\S+)`, 'gi'), `$1${REDACTED}`],
  // Well-known token shapes: sk-..., ghp_..., github_pat_..., xoxb-...
  [/\b(?:sk|ghp|gho|ghs|github_pat|xox[bpas])[-_][A-Za-z0-9_-]{10,}/g, REDACTED],
]

/**
 * Redacts obvious secrets from a string.
 * @param {string} text Text that may contain secrets.
 * @returns {string} The text with secret values replaced.
 */
function scrub(text) {
  return SCRUBBERS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text)
}

/**
 * Picks the concise target of a tool call: the file written or the command run.
 * @param {unknown} toolInput The hook's tool_input object.
 * @returns {string | null} A scrubbed, truncated target, or null when absent.
 */
function targetOf(toolInput) {
  const raw = toolInput?.file_path ?? toolInput?.path ?? toolInput?.command
  if (typeof raw !== 'string' || raw === '') return null
  const clean = scrub(raw)
  return clean.length > MAX_TARGET ? `${clean.slice(0, MAX_TARGET)}...` : clean
}

/** Read all of stdin as a string. */
async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

try {
  const input = JSON.parse(await readStdin())
  const record = {
    ts: new Date().toISOString(),
    session_id: typeof input.session_id === 'string' ? input.session_id : null,
    event: typeof input.hook_event_name === 'string' ? input.hook_event_name : null,
    tool: typeof input.tool_name === 'string' ? input.tool_name : null,
    target: targetOf(input.tool_input),
  }
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const logFile = path.join(root, 'logs', 'agent-audit.jsonl')
  mkdirSync(path.dirname(logFile), { recursive: true })
  appendFileSync(logFile, `${JSON.stringify(record)}\n`)
} catch {
  // Auditing must never interfere with the session.
}
process.exit(0)
