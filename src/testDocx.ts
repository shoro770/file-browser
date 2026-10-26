/**
 * Builds minimal `.docx` files for tests (jszip is a dev dependency). Imported by tests only.
 */

import JSZip from 'jszip'

/** One relationship in `word/_rels/document.xml.rels`. */
export interface DocxRel {
  id: string
  type: 'hyperlink' | 'image' | 'styles' | 'numbering'
  target: string
  /** Set for links and images that point outside the document. */
  external?: boolean
}

/** Parts of a test document. */
export interface DocxParts {
  /** Inner XML of `w:body`. */
  body: string
  rels?: DocxRel[]
  /** Files under `word/`, such as `media/a.png`. */
  media?: Record<string, Uint8Array>
}

const NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'

const REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

/** A 1x1 transparent PNG. */
export const PNG_BYTES = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
)

/**
 * Escapes text for XML.
 *
 * @param text - Raw text.
 * @returns Text safe inside an element.
 */
export function xml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Builds a paragraph.
 *
 * @param text - Run text.
 * @param options - `style` is a Word style id such as `Heading1`; `bold` and `italic` format the run.
 * @returns `w:p` XML.
 */
export function paragraph(
  text: string,
  options: { style?: string; bold?: boolean; italic?: boolean; bullet?: boolean } = {},
): string {
  const pStyle = options.style ? `<w:pStyle w:val="${options.style}"/>` : ''
  const numbering = options.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ''
  const pPr = pStyle || numbering ? `<w:pPr>${pStyle}${numbering}</w:pPr>` : ''
  const rPr = options.bold || options.italic ? `<w:rPr>${options.bold ? '<w:b/>' : ''}${options.italic ? '<w:i/>' : ''}</w:rPr>` : ''
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`
}

/**
 * Builds a paragraph holding one hyperlink.
 *
 * @param text - Link text.
 * @param rel - Id of a `hyperlink` relationship, or `anchor:` followed by a bookmark name.
 * @returns `w:p` XML.
 */
export function link(text: string, rel: string): string {
  const attribute = rel.startsWith('anchor:') ? `w:anchor="${xml(rel.slice(7))}"` : `r:id="${rel}"`
  return `<w:p><w:hyperlink ${attribute}><w:r><w:t>${xml(text)}</w:t></w:r></w:hyperlink></w:p>`
}

/**
 * Builds a paragraph holding one inline picture.
 *
 * @param rel - Id of an `image` relationship; embedded when it has no `external` flag, else linked.
 * @param alt - Alt text.
 * @param external - Whether the relationship points outside the document (`r:link` instead of `r:embed`).
 * @returns `w:p` XML.
 */
export function picture(rel: string, alt: string, external = false): string {
  const ref = external ? `r:link="${rel}"` : `r:embed="${rel}"`
  return (
    '<w:p><w:r><w:drawing><wp:inline><wp:extent cx="100" cy="100"/>' +
    `<wp:docPr id="1" name="p" descr="${xml(alt)}"/>` +
    `<a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip ${ref}/></pic:blipFill></pic:pic></a:graphicData></a:graphic>` +
    '</wp:inline></w:drawing></w:r></w:p>'
  )
}

/**
 * Builds the bytes of a `.docx`.
 *
 * @param parts - Body XML, relationships and media.
 * @returns The zip as an `ArrayBuffer`.
 */
export async function makeDocx({ body, rels = [], media = {} }: DocxParts): Promise<ArrayBuffer> {
  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="png" ContentType="image/png"/>' +
      '<Default Extension="svg" ContentType="image/svg+xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '</Types>',
  )
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL_TYPE}/officeDocument" Target="word/document.xml"/></Relationships>`,
  )
  const all: DocxRel[] = [
    { id: 'rIdStyles', type: 'styles', target: 'styles.xml' },
    { id: 'rIdNumbering', type: 'numbering', target: 'numbering.xml' },
    ...rels,
  ]
  const relXml = all
    .map(
      (rel) =>
        `<Relationship Id="${rel.id}" Type="${REL_TYPE}/${rel.type}" Target="${xml(rel.target)}"${rel.external ? ' TargetMode="External"' : ''}/>`,
    )
    .join('')
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relXml}</Relationships>`,
  )
  const styles = [1, 2].map(
    (level) => `<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/></w:style>`,
  )
  zip.file(
    'word/numbering.xml',
    `<?xml version="1.0" encoding="UTF-8"?><w:numbering ${NS}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
  )
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8"?><w:styles ${NS}>${styles.join('')}</w:styles>`)
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document ${NS}><w:body>${body}</w:body></w:document>`)
  for (const [path, bytes] of Object.entries(media)) zip.file(`word/${path}`, bytes)
  return zip.generateAsync({ type: 'arraybuffer' })
}

/**
 * Wraps document bytes as a `File`.
 *
 * @param bytes - Output of `makeDocx` or any other bytes.
 * @param name - File name.
 * @returns A `File`.
 */
export function docxFile(bytes: ArrayBuffer | string, name = 'a.docx'): File {
  return new File([bytes], name)
}
