/**
 * Selection-scoped preview sessions. Each session owns one `AbortController` and the
 * `File` read; opening a new one aborts the previous, so the latest selection wins and
 * a late result is discarded. Object URLs, once renderers need them, are created and
 * revoked here and nowhere else.
 */

import { resolvePreviewKind } from '../lib/preview'
import { MAX_TEXT_BYTES, trimPartialUtf8 } from '../lib/text'
import type { PreviewKind, PreviewState, TextContent } from '../types'
import { readItemFile } from './tree'

/** Reads the `File` for an item id. */
export type FileReader = (id: string) => Promise<File>

/**
 * Reads and decodes the leading 1 MB of a file. Only a slice is read.
 *
 * @param file - The file to read.
 * @returns The decoded text and whether the file was cut.
 */
async function readLeadingText(file: File): Promise<TextContent> {
  const bytes = new Uint8Array(await file.slice(0, MAX_TEXT_BYTES).arrayBuffer())
  const truncated = file.size > MAX_TEXT_BYTES
  const text = new TextDecoder('utf-8').decode(truncated ? trimPartialUtf8(bytes) : bytes)
  return { text, truncated, totalSize: file.size }
}

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
      let kind: PreviewKind
      let text: TextContent | undefined
      try {
        file = await read(id)
        kind = resolvePreviewKind(name, file.type, file.size)
        if (controller.signal.aborted) return null
        if (kind === 'text') text = await readLeadingText(file)
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
          ...(text && { text }),
          signal: controller.signal,
          meta: {
            name,
            size: file.size,
            updatedAt: new Date(file.lastModified),
            mime,
            kind,
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
