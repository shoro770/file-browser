/**
 * Shared setup and fixtures for component tests (jsdom). Imported by tests only.
 */

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import type { PreviewKind, PreviewMeta, PreviewSource } from './types'

afterEach(cleanup)

/** Fixed "now" so the Last Modified stamp is the same on every run. */
export const NOW = new Date(2026, 9, 26, 12, 0)

/**
 * Builds a preview source.
 *
 * @param name - File name.
 * @param kind - Preview kind.
 * @param extra - Overrides for any source field.
 * @returns A ready source with a Sun Oct 25 2026 11:04 AM modified time.
 */
export function makeSource(name: string, kind: PreviewKind, extra: Partial<PreviewSource> = {}): PreviewSource {
  const meta: PreviewMeta = { name, size: 12, updatedAt: new Date(2026, 9, 25, 11, 4), mime: '', kind }
  return { file: new File(['x'], name), signal: new AbortController().signal, meta, ...extra }
}
