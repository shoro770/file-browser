import { describe, expect, it } from 'vitest'
import {
  EMPTY_FILE_MESSAGE,
  LEGACY_DOC_MESSAGE,
  NO_PREVIEW_MESSAGE,
  RENDER_FAILED_MESSAGE,
  cardExplanation,
  extensionOf,
  glyphForFile,
  imageMimeFor,
  isPdfName,
  rendererFor,
  resolvePreviewKind,
  typeLabel,
} from './preview'

describe('extensionOf', () => {
  it('lower-cases the last extension', () => {
    expect(extensionOf('a.b.PDF')).toBe('pdf')
  })
  it('is empty for no extension, dotfiles and a trailing dot', () => {
    expect(extensionOf('Makefile')).toBe('')
    expect(extensionOf('.gitignore')).toBe('')
    expect(extensionOf('a.')).toBe('')
  })
})

describe('resolvePreviewKind', () => {
  it.each([
    ['a.PDF', 'pdf'],
    ['b.docx', 'docx'],
    ['c.md', 'markdown'],
    ['c.markdown', 'markdown'],
    ['d.png', 'image'],
    ['d.SVG', 'image'],
    ['e.txt', 'text'],
    ['f.ts', 'text'],
    ['g.json', 'text'],
  ] as const)('extension %s -> %s', (name, kind) => {
    expect(resolvePreviewKind(name)).toBe(kind)
  })

  it.each([
    ['Makefile', 'text'],
    ['makefile', 'metadata'],
    ['README', 'text'],
    ['readme', 'metadata'],
    ['LICENSEX', 'metadata'],
    ['.gitignore', 'text'],
    ['.env', 'text'],
    ['.env.local', 'text'],
    ['.envrc', 'text'],
  ] as const)('name %s -> %s', (name, kind) => {
    expect(resolvePreviewKind(name)).toBe(kind)
  })

  it('keeps a real extension ahead of the .env prefix', () => {
    expect(resolvePreviewKind('.envelope.pdf')).toBe('pdf')
    expect(isPdfName('.env.pdf')).toBe(true)
  })

  it('falls back to the device-reported type', () => {
    expect(resolvePreviewKind('data.xyz', 'text/plain')).toBe('text')
    expect(resolvePreviewKind('pic', 'image/png')).toBe('image')
    expect(resolvePreviewKind('x', 'application/pdf')).toBe('pdf')
    expect(resolvePreviewKind('x', 'IMAGE/PNG')).toBe('image')
  })

  it('uses metadata for unknown types', () => {
    expect(resolvePreviewKind('a.exe')).toBe('metadata')
    expect(resolvePreviewKind('blob.xyz')).toBe('metadata')
    expect(resolvePreviewKind('noext')).toBe('metadata')
    expect(resolvePreviewKind('blob.xyz', 'application/octet-stream')).toBe('metadata')
  })

  it('resolves .doc and zero-byte files to metadata', () => {
    expect(resolvePreviewKind('old.doc')).toBe('metadata')
    expect(resolvePreviewKind('old.doc', 'application/msword')).toBe('metadata')
    expect(resolvePreviewKind('a.txt', 'text/plain', 0)).toBe('metadata')
    expect(resolvePreviewKind('Makefile', '', 0)).toBe('metadata')
  })

  it('does not treat a non-zero size as empty', () => {
    expect(resolvePreviewKind('a.txt', 'text/plain', 1)).toBe('text')
  })

  it('does not trip on names that match Object.prototype keys', () => {
    expect(resolvePreviewKind('x.constructor')).toBe('metadata')
  })
})

describe('rendererFor', () => {
  it('picks a renderer only when its input exists', () => {
    expect(rendererFor('text', true, false)).toBe('text')
    expect(rendererFor('image', false, true)).toBe('image')
    expect(rendererFor('markdown', true, false)).toBe('markdown')
  })

  it('gives markdown the card without leading text', () => {
    expect(rendererFor('markdown', false, false)).toBe('card')
    expect(rendererFor('markdown', false, true)).toBe('card')
  })

  it('falls back to the card without input or for other kinds', () => {
    expect(rendererFor('text', false, false)).toBe('card')
    expect(rendererFor('image', true, false)).toBe('card')
    expect(rendererFor('image', false, false)).toBe('card')
    expect(rendererFor('text', false, true)).toBe('card')
    for (const kind of ['pdf', 'docx', 'metadata'] as const) {
      expect(rendererFor(kind, true, true)).toBe('card')
    }
  })
})

describe('imageMimeFor', () => {
  it('keeps a device-reported image type', () => {
    expect(imageMimeFor('a.png', 'image/png')).toBe('image/png')
    expect(imageMimeFor('a.svg', 'IMAGE/SVG+XML')).toBe('image/svg+xml')
  })

  it('falls back to the extension when the type is empty or not an image type', () => {
    expect(imageMimeFor('x.svg')).toBe('image/svg+xml')
    expect(imageMimeFor('x.PNG')).toBe('image/png')
    expect(imageMimeFor('x.jpg', 'application/octet-stream')).toBe('image/jpeg')
  })

  it('returns an empty type for an unknown extension', () => {
    expect(imageMimeFor('x.heic')).toBe('')
    expect(imageMimeFor('noext')).toBe('')
  })
})

describe('isPdfName', () => {
  it('is true for .pdf in any case and false otherwise', () => {
    expect(isPdfName('a.PDF')).toBe(true)
    expect(isPdfName('a.pdfx')).toBe(false)
    expect(isPdfName('pdf')).toBe(false)
  })
})

describe('glyphForFile', () => {
  it.each([
    ['photo.PNG', 'image'],
    ['a.pdf', 'pdf'],
    ['a.docx', 'document'],
    ['a.doc', 'document'],
    ['notes.md', 'text'],
    ['Makefile', 'text'],
    ['.env.local', 'text'],
    ['a.ts', 'text'],
    ['a.json', 'text'],
    ['a.csv', 'text'],
    ['a.log', 'text'],
    ['a.zip', 'binary'],
    ['a.xyz', 'file'],
    ['noext', 'file'],
  ] as const)('%s -> %s', (name, glyph) => {
    expect(glyphForFile(name)).toBe(glyph)
  })

  it('uses audio and video types for extensionless files', () => {
    expect(glyphForFile('clip', 'video/mp4')).toBe('binary')
    expect(glyphForFile('clip', 'audio/mpeg')).toBe('binary')
  })
})

describe('typeLabel', () => {
  it.each([
    ['a.doc', 'Word document (legacy)'],
    ['a.docx', 'Word document'],
    ['a.PDF', 'PDF document'],
    ['a.7z', 'Archive'],
    ['a.dylib', 'Binary file'],
    ['a.flac', 'Audio file'],
    ['a.mkv', 'Video file'],
    ['a.xyz', 'XYZ file'],
    ['noext', 'File'],
    ['Makefile', 'Text file'],
    ['x.constructor', 'CONSTRUCTOR file'],
  ] as const)('%s -> %s', (name, label) => {
    expect(typeLabel(name)).toBe(label)
  })

  it('uses the device-reported type when there is no extension', () => {
    expect(typeLabel('clip', 'video/mp4')).toBe('Video file')
    expect(typeLabel('clip', 'audio/mpeg')).toBe('Audio file')
  })
})

describe('cardExplanation', () => {
  it('prefers the empty-file sentence', () => {
    expect(cardExplanation('a.doc', 0)).toBe(EMPTY_FILE_MESSAGE)
  })
  it('explains legacy .doc', () => {
    expect(cardExplanation('a.DOC', 10)).toBe(LEGACY_DOC_MESSAGE)
  })
  it('falls back to the no-preview sentence', () => {
    expect(cardExplanation('a.exe', 10)).toBe(NO_PREVIEW_MESSAGE)
  })
  it('puts a render failure ahead of the other sentences', () => {
    expect(cardExplanation('a.png', 10, true)).toBe(RENDER_FAILED_MESSAGE)
    expect(cardExplanation('a.DOC', 0, true)).toBe(RENDER_FAILED_MESSAGE)
  })
})
