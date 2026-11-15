#!/usr/bin/env node
// PostToolUse feedback hook for Edit/Write-style tools.
//
// Rule (AGENTS.md, "Conventions that differ from defaults"): src/lib/ holds pure,
// deterministic functions only. No React, hooks, DOM or browser APIs; impure code
// belongs in src/services/. Neither oxlint nor architecture.test.ts enforces this.
//
// A non-test .ts/.tsx file under src/lib/ is a violation when it
//   - imports react / react-dom, or anything from ../services, ../components or ../hooks
//   - touches a browser global: window, document, localStorage, sessionStorage,
//     navigator, indexedDB, or calls fetch(
// Violation: finding on stderr, exit 2 (fed back to Claude). Otherwise silent, exit 0.

import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

/** Matches a path inside a `src/lib/` directory (root independent, so fixtures work too). */
const IN_LIB = /(^|\/)src\/lib\//
const SOURCE_FILE = /\.tsx?$/
const TEST_FILE = /\.test\.tsx?$/

/** Module specifiers a pure helper must not import, with what to do instead. */
const BANNED_IMPORTS = [
  [/^react(-dom)?(\/|$)/, 'React', 'move the React code to src/components/ or src/hooks/ and pass plain data into the helper'],
  [/(^|\/)services(\/|$)/, 'a services module', 'src/services/ is impure; call it from a hook or component and pass the result into the helper as an argument'],
  [/(^|\/)components(\/|$)/, 'a component', 'lib must not depend on the view layer; pass data in as arguments'],
  [/(^|\/)hooks(\/|$)/, 'a React hook', 'lib must not depend on hooks; pass data in as arguments'],
]

/** Browser globals a pure helper must not touch. */
const BROWSER_GLOBALS = /\b(window|document|localStorage|sessionStorage|navigator|indexedDB)\b(?=\s*[.[])|\bfetch\s*\(/g

/**
 * Blanks comments while keeping newlines, so reported line numbers stay correct.
 * @param {string} source File text.
 * @returns {string} The text with comment bodies replaced by spaces.
 */
function stripComments(source) {
  const blank = (match) => match.replace(/[^\n]/g, ' ')
  return source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:\\])\/\/.*$/gm, (m, lead) => lead + blank(m.slice(lead.length)))
}

/**
 * Finds the line number of a character offset.
 * @param {string} text File text.
 * @param {number} offset Zero-based character offset.
 * @returns {number} One-based line number.
 */
function lineAt(text, offset) {
  return text.slice(0, offset).split('\n').length
}

/**
 * Lists rule violations in one lib source file.
 * @param {string} code Comment-free file text.
 * @returns {string[]} One actionable message per violation.
 */
function findViolations(code) {
  const found = []
  const specifier = /\b(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g
  for (const match of code.matchAll(specifier)) {
    const hit = BANNED_IMPORTS.find(([pattern]) => pattern.test(match[1]))
    if (hit) found.push(`line ${lineAt(code, match.index)}: imports ${hit[1]} ('${match[1]}'). Fix: ${hit[2]}.`)
  }
  for (const match of code.matchAll(BROWSER_GLOBALS)) {
    const name = match[1] ?? 'fetch'
    found.push(`line ${lineAt(code, match.index)}: uses browser API '${name}'. Fix: move this code to src/services/ and pass the value into the helper as an argument.`)
  }
  return found
}

/** Read all of stdin as a string. */
async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

let input
try {
  input = JSON.parse(await readStdin())
} catch {
  process.exit(0) // Malformed input: nothing to check.
}

const toolInput = input?.tool_input ?? {}
const target = toolInput.file_path ?? toolInput.path
if (typeof target !== 'string' || target === '') process.exit(0)

// Fast path: out-of-scope paths are decided by name alone, before touching the disk.
const normalized = target.split(path.sep).join('/')
if (!IN_LIB.test(normalized) || !SOURCE_FILE.test(normalized) || TEST_FILE.test(normalized)) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR || input?.cwd || process.cwd()
const file = path.resolve(root, target)
if (!existsSync(file) || !statSync(file).isFile()) process.exit(0)

const violations = findViolations(stripComments(readFileSync(file, 'utf8')))
if (violations.length === 0) process.exit(0)

const shown = path.relative(root, file) || file
process.stderr.write(
  `post-edit-check: ${shown} breaks the "src/lib/ is pure" rule (AGENTS.md):\n` +
    violations.map((v) => `  - ${v}`).join('\n') +
    '\nsrc/lib/ may only hold pure, deterministic functions. Put impure code in src/services/.\n',
)
process.exit(2)
