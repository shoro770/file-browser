/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ARTIFACTS = join(process.cwd(), '_bmad-output/implementation-artifacts')

/** A story key such as `2-1-see-a-selected-file-s-details` (epics and retrospectives do not match). */
const STORY_KEY = /^\d+-\d+-/

/**
 * Removes surrounding quotes and a trailing comment from a YAML scalar.
 * @param raw - Text after the colon.
 * @returns The bare scalar.
 */
function unquote(raw: string): string {
  return raw.replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*)\1$/, '$2')
}

/**
 * Reads the `development_status` map of a sprint-status file, line by line.
 * @param yaml - File text.
 * @returns Status by key, in file order; empty when the block is absent.
 */
export function parseDevelopmentStatus(yaml: string): Map<string, string> {
  const result = new Map<string, string>()
  let inBlock = false
  for (const line of yaml.split(/\r?\n/)) {
    if (/^development_status:\s*$/.test(line)) {
      inBlock = true
    } else if (inBlock && /^\S/.test(line) && !line.startsWith('#')) {
      break
    } else if (inBlock) {
      const match = /^\s+([^\s:#][^:]*):\s*(.+)$/.exec(line)
      if (match) result.set(match[1].trim(), unquote(match[2]))
    }
  }
  return result
}

/**
 * Reads the `status` field from a spec's leading frontmatter block.
 * @param markdown - Spec file text.
 * @returns The status, or undefined when there is no frontmatter or no status.
 */
export function parseFrontmatterStatus(markdown: string): string | undefined {
  const lines = markdown.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return undefined
  for (const line of lines.slice(1)) {
    if (line.trim() === '---') return undefined
    const match = /^status:\s*(.+)$/.exec(line)
    if (match) return unquote(match[1])
  }
  return undefined
}

/**
 * Lists every disagreement between sprint status and spec frontmatter about `done`.
 * @param sprint - Status by story key from sprint-status.yaml.
 * @param specStatus - Frontmatter status by story key; keys without a spec file are absent.
 * @returns One message per mismatch; empty when in sync.
 */
export function findMismatches(
  sprint: ReadonlyMap<string, string>,
  specStatus: ReadonlyMap<string, string | undefined>,
): string[] {
  const problems: string[] = []
  for (const [key, spec] of specStatus) {
    const sprintValue = sprint.get(key)
    if (sprintValue === 'done' && spec !== 'done') {
      problems.push(`${key}: sprint-status.yaml says 'done' but spec-${key}.md frontmatter status is '${spec ?? 'missing'}'`)
    } else if (spec === 'done' && sprintValue !== 'done') {
      problems.push(`${key}: spec-${key}.md frontmatter says 'done' but sprint-status.yaml status is '${sprintValue ?? 'missing'}'`)
    }
  }
  return problems
}

describe('tracking parser self-tests', () => {
  const yaml = [
    '# comment',
    'project: x',
    'development_status:',
    '  epic-1: in-progress',
    '  1-1-first: done',
    "  1-2-second: 'review'  # note",
    '',
    '  # indented comment',
    '  1-3-third: backlog',
    'action_items:',
    '  - id: "a"',
    '    status: done',
  ].join('\n')

  it('reads only the development_status block', () => {
    expect([...parseDevelopmentStatus(yaml)]).toEqual([
      ['epic-1', 'in-progress'],
      ['1-1-first', 'done'],
      ['1-2-second', 'review'],
      ['1-3-third', 'backlog'],
    ])
  })

  it('returns an empty map without the block', () => {
    expect(parseDevelopmentStatus('project: x\n').size).toBe(0)
  })

  it('reads quoted and bare frontmatter status', () => {
    expect(parseFrontmatterStatus("---\ntitle: 'T'\nstatus: 'done'\n---\nstatus: nope")).toBe('done')
    expect(parseFrontmatterStatus('---\nstatus: in-review\n---\n')).toBe('in-review')
  })

  it('ignores status outside frontmatter', () => {
    expect(parseFrontmatterStatus('# Title\nstatus: done\n')).toBeUndefined()
    expect(parseFrontmatterStatus('---\ntitle: x\n---\nstatus: done\n')).toBeUndefined()
  })

  it('reports both mismatch directions with a clear message', () => {
    const sprint = new Map([['1-1-a', 'done'], ['1-2-b', 'review']])
    const specs = new Map<string, string | undefined>([['1-1-a', 'in-review'], ['1-2-b', 'done']])
    const problems = findMismatches(sprint, specs)
    expect(problems).toHaveLength(2)
    expect(problems[0]).toContain("sprint-status.yaml says 'done'")
    expect(problems[1]).toContain("frontmatter says 'done'")
    expect(problems[1]).toContain("'review'")
  })

  it('accepts matching statuses', () => {
    expect(findMismatches(new Map([['1-1-a', 'done']]), new Map([['1-1-a', 'done']]))).toEqual([])
  })
})

describe('spec status matches sprint-status.yaml', () => {
  it('agrees on which stories are done', () => {
    const sprint = parseDevelopmentStatus(readFileSync(join(ARTIFACTS, 'sprint-status.yaml'), 'utf8'))
    const specs = new Map<string, string | undefined>()
    for (const key of sprint.keys()) {
      if (!STORY_KEY.test(key)) continue
      const path = join(ARTIFACTS, `spec-${key}.md`)
      if (existsSync(path)) specs.set(key, parseFrontmatterStatus(readFileSync(path, 'utf8')))
    }
    expect(specs.size).toBeGreaterThan(0)
    expect(findMismatches(sprint, specs), 'spec and sprint status drifted').toEqual([])
  })
})
