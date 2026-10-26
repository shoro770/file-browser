// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeSource } from '../../testHelpers'
import PdfPreview from './PdfPreview'

const URL_A = 'blob:fake/1'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('PdfPreview', () => {
  it('embeds the session URL as a PDF object named for the file, with no inline style', () => {
    render(<PdfPreview source={makeSource('report.pdf', 'pdf', { pdfUrl: URL_A })} />)
    const object = screen.getByTitle('report.pdf')
    expect(object.tagName).toBe('OBJECT')
    expect(object).toHaveAttribute('type', 'application/pdf')
    expect(object).toHaveAttribute('data', URL_A)
    expect(object).not.toHaveAttribute('style')
    expect(object.parentElement).not.toHaveAttribute('style')
    expect(object).toHaveTextContent("This browser can't display PDF files here.")
  })

  it('offers no page or zoom controls of its own', () => {
    render(<PdfPreview source={makeSource('report.pdf', 'pdf', { pdfUrl: URL_A })} />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })

  it('reports an error event from the embed', () => {
    const onError = vi.fn()
    render(<PdfPreview source={makeSource('a.pdf', 'pdf', { pdfUrl: URL_A })} onError={onError} />)
    fireEvent.error(screen.getByTitle('a.pdf'))
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('reports an error once under StrictMode and stops listening on unmount', () => {
    const onError = vi.fn()
    const { unmount } = render(
      <StrictMode>
        <PdfPreview source={makeSource('a.pdf', 'pdf', { pdfUrl: URL_A })} onError={onError} />
      </StrictMode>,
    )
    const object = screen.getByTitle('a.pdf')
    fireEvent.error(object)
    expect(onError).toHaveBeenCalledTimes(1)
    unmount()
    fireEvent.error(object)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('calls the latest onError after a rerender with a new callback', () => {
    const first = vi.fn()
    const second = vi.fn()
    const source = makeSource('a.pdf', 'pdf', { pdfUrl: URL_A })
    const { rerender } = render(<PdfPreview source={source} onError={first} />)
    rerender(<PdfPreview source={source} onError={second} />)
    fireEvent.error(screen.getByTitle('a.pdf'))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('throws without an object URL, for the boundary to catch', () => {
    expect(() => render(<PdfPreview source={makeSource('a.pdf', 'pdf')} />)).toThrow()
  })
})
