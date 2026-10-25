import type { ImagePreviewProps } from '../../types'

/**
 * Shows an image through `<img src="blob:...">` only; SVG is never inlined, so no script
 * runs and no external resource loads. Animated GIF, APNG and WebP autoplay as authored
 * with no pause control: a documented v1 exception to WCAG 2.2.2.
 */
export default function ImagePreview({ source }: ImagePreviewProps) {
  const url = source.imageUrl
  if (!url) throw new Error('image preview needs an object URL')
  return (
    <div className="image-preview">
      {/* Keyed by URL so a previous decode cannot paint under a new source. */}
      <img key={url} className="image-preview__img" src={url} alt={source.meta.name} />
    </div>
  )
}
