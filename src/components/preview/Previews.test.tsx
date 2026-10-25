// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeSource } from '../../testHelpers'
import ImagePreview from './ImagePreview'
import PreviewBoundary from './PreviewBoundary'
import TextPreview from './TextPreview'
import TruncationBanner from './TruncationBanner'

afterEach(() => vi.restoreAllMocks())

describe('TextPreview', () => {
  it('shows content as a literal text node with no HTML, no banner and no live region', () => {
    const source = makeSource('a.html', 'text', { text: { text: '<b onclick="x()">hi</b>', truncated: false, totalSize: 22 } })
    const { container } = render(<TextPreview source={source} />)
    expect(screen.getByText('<b onclick="x()">hi</b>')).toBeInTheDocument()
    expect(container.querySelector('b')).toBeNull()
    expect(screen.queryByText(/Showing the first 1 MB/)).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('pins the banner with the full size only when truncated', () => {
    const source = makeSource('a.txt', 'text', { text: { text: 'x', truncated: true, totalSize: 4_404_019 } })
    render(<TextPreview source={source} />)
    expect(screen.getByText("Showing the first 1 MB of 4.2 MB. The rest of the file isn't shown.")).toBeInTheDocument()
  })

  it('throws without text', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TextPreview source={makeSource('a.txt', 'text')} />)).toThrow()
    vi.restoreAllMocks()
  })
})

describe('TruncationBanner', () => {
  it('renders a static, decorative-glyph banner', () => {
    const { container } = render(<TruncationBanner totalSize={2_097_152} />)
    expect(screen.getByText(/of 2\.0 MB/)).toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('ImagePreview', () => {
  it('renders an img with the name as alt, a blob src and no svg or inline style', () => {
    const { container } = render(<ImagePreview source={makeSource('p.svg', 'image', { imageUrl: 'blob:abc' })} />)
    const image = screen.getByRole('img', { name: 'p.svg' })
    expect(image).toHaveAttribute('src', 'blob:abc')
    expect(container.querySelector('svg')).toBeNull()
    expect(container.querySelector('[style]')).toBeNull()
  })

  it('calls onError when the browser cannot decode the image', () => {
    const onError = vi.fn()
    render(<ImagePreview source={makeSource('p.heic', 'image', { imageUrl: 'blob:x' })} onError={onError} />)
    fireEvent.error(screen.getByRole('img'))
    expect(onError).toHaveBeenCalledTimes(1)
  })
})

describe('PreviewBoundary', () => {
  /** Throws on render. */
  function Bomb(): never {
    throw new Error('secret failure detail')
  }

  it('renders its children when nothing throws', () => {
    const onFail = vi.fn()
    render(
      <PreviewBoundary onFail={onFail}>
        <p>ok</p>
      </PreviewBoundary>,
    )
    expect(screen.getByText('ok')).toBeInTheDocument()
    expect(onFail).not.toHaveBeenCalled()
  })

  it('renders nothing and calls onFail once when a child throws, never showing the error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onFail = vi.fn()
    const { container } = render(
      <PreviewBoundary onFail={onFail}>
        <Bomb />
      </PreviewBoundary>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(onFail).toHaveBeenCalledTimes(1)
    expect(onFail).toHaveBeenCalledWith()
    expect(screen.queryByText(/secret/)).toBeNull()
    vi.restoreAllMocks()
  })
})
