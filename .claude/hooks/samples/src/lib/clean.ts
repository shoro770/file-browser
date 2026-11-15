// Sample target for post_edit_clean.json. A pure helper that respects the rule.
// Mentioning window.localStorage or fetch( in a comment must not trip the check.
import type { FileItem } from '../types'

/**
 * Counts the items in a list.
 * @param items - Files to count.
 * @returns The number of files.
 */
export function countFiles(items: readonly FileItem[]): number {
  return items.length
}
