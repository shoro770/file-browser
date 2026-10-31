/** Outcome of a guardrail check: `ok` false means the caller should treat it as an error. */
export interface CheckResult {
  readonly ok: boolean
  readonly message: string
}

/** Hard ceiling for initial JavaScript, gzipped, in KB (NFR1 / AD-15). */
export const BUNDLE_BUDGET_KB = 150

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const EPOCH_MS = /(?<!\d)1[5-9]\d{11}(?!\d)/
const RANDOM_FRACTION = /(?<![\w])0\.\d{8,}/

/**
 * Names the non-deterministic id patterns visible in a string.
 * @param id - The candidate node id.
 * @returns Human-readable descriptions of each suspicious pattern found (empty if none).
 */
export function detectNonDeterministicPatterns(id: string): string[] {
  const found: string[] = []
  if (UUID.test(id)) found.push('contains a UUID (crypto.randomUUID?)')
  if (EPOCH_MS.test(id)) found.push('contains a 13-digit epoch timestamp (Date.now()?)')
  if (RANDOM_FRACTION.test(id)) found.push('contains a long random fraction (Math.random()?)')
  return found
}

/**
 * Verifies a tree node id is exactly the slash-joined path from the root.
 * The comparison is exact (no normalization); normalization differences are reported.
 * @param nodeId - The id the code assigned to the node.
 * @param filePath - The slash-joined path of the entry from the root, e.g. `src/a.ts`.
 * @returns Approved when `nodeId === filePath`, otherwise Rejected with every reason found.
 */
export function verifyTreeNodeId(nodeId: string, filePath: string): CheckResult {
  if (filePath.length === 0) {
    return { ok: false, message: 'Rejected: filePath is empty; there is no path to derive an id from.' }
  }
  if (nodeId === filePath) {
    return { ok: true, message: `Approved: nodeId "${nodeId}" equals the entry path, so it is deterministic.` }
  }
  const reasons = [
    `nodeId "${nodeId}" !== filePath "${filePath}"; an id must be derived from the path alone.`,
    ...detectNonDeterministicPatterns(nodeId).map((p) => `nodeId ${p}`),
  ]
  const normalized = (s: string) => s.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '')
  if (normalized(nodeId) === normalized(filePath)) {
    reasons.push('ids differ only by normalization (backslashes, "./" prefix or trailing slash); use the exact slash-joined path.')
  }
  return {
    ok: false,
    message: `Rejected: ${reasons.length} problem(s).\n${reasons.map((r) => `- ${r}`).join('\n')}\nSee .claude/rules/deterministic-tree-ids.md.`,
  }
}

/**
 * Checks the initial-JS size against the hard gzipped budget.
 * @param sizeInKb - Gzipped initial JavaScript size in KB, as reported by `vite build`.
 * @returns Approved with the remaining headroom when `sizeInKb <= 150`, otherwise a budget violation.
 */
export function checkBundleBudget(sizeInKb: number): CheckResult {
  if (!Number.isFinite(sizeInKb) || sizeInKb < 0) {
    return { ok: false, message: `Rejected: sizeInKb must be a finite number >= 0, got ${sizeInKb}.` }
  }
  if (sizeInKb > BUNDLE_BUDGET_KB) {
    const over = (sizeInKb - BUNDLE_BUDGET_KB).toFixed(2)
    return {
      ok: false,
      message: `BUDGET EXCEEDED: ${sizeInKb} KB gzipped is ${over} KB over the ${BUNDLE_BUDGET_KB} KB limit (NFR1/AD-15). Lazy-load heavy dependencies with dynamic import(); never recover budget by dropping accessibility.`,
    }
  }
  const left = (BUNDLE_BUDGET_KB - sizeInKb).toFixed(2)
  return { ok: true, message: `Within budget: ${sizeInKb} KB of ${BUNDLE_BUDGET_KB} KB gzipped used; ${left} KB remaining.` }
}
