/**
 * Selection-scoped preview sessions. Each session owns one `AbortController` and the
 * `File` read; opening a new one aborts the previous, so the latest selection wins and
 * a late result is discarded. Object URLs, once renderers need them, are created and
 * revoked here and nowhere else.
 */

import { resolvePreviewKind } from '../lib/preview'
import type { PreviewState } from '../types'
import { readItemFile } from './tree'

/** Reads the `File` for an item id. */
export type FileReader = (id: string) => Promise<File>

/** Opens preview sessions over a file reader. */
export interface PreviewSessions {
  /**
   * Starts a session for a file, aborting the previous one.
   *
   * @param id - Id of the selected file.
   * @param name - Base name of the file.
   * @returns The outcome, or `null` if a newer session replaced this one. Never throws.
   */
  open(id: string, name: string): Promise<PreviewState | null>
  /** Aborts the current session, if any. */
  close(): void
}

/**
 * Creates a session manager.
 *
 * @param read - How to read an item's `File`.
 * @returns The manager.
 */
export function createPreviewSessions(read: FileReader): PreviewSessions {
  let current: AbortController | null = null

  return {
    async open(id, name) {
      current?.abort()
      const controller = new AbortController()
      current = controller

      let file: File
      try {
        file = await read(id)
      } catch {
        return controller.signal.aborted ? null : { status: 'failed', id, name }
      }
      if (controller.signal.aborted) return null

      const mime = file.type
      return {
        status: 'ready',
        id,
        source: {
          file,
          signal: controller.signal,
          meta: {
            name,
            size: file.size,
            updatedAt: new Date(file.lastModified),
            mime,
            kind: resolvePreviewKind(name, mime, file.size),
          },
        },
      }
    },
    close() {
      current?.abort()
      current = null
    },
  }
}

const sessions = createPreviewSessions(readItemFile)

/** The app's session manager, reading through the tree store. */
export const openPreview = sessions.open
/** Aborts the app's current session. */
export const closePreview = sessions.close
