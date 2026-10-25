import type { CSSProperties } from 'react'
import type { Media } from '@/lib/types'

type Props = {
  media: Media
  sizes: string
  alt?: string
  priority?: boolean
  className?: string
  imgClassName?: string
  focus?: string
  /** Renders only the <picture>, without the placeholder wrapper. */
  bare?: boolean
  style?: CSSProperties
}

export function srcSet(media: Media, format: 'avif' | 'webp') {
  return media.widths.map((w) => `/media/${media.id}/${w}.${format} ${w}w`).join(', ')
}

export function mediaUrl(media: Media, width = 1200, format: 'avif' | 'webp' = 'webp') {
  const w = media.widths.find((x) => x >= width) ?? media.widths.at(-1)
  return `/media/${media.id}/${w}.${format}`
}

export function Picture({ media, sizes, alt, priority, className, imgClassName, focus, bare, style }: Props) {
  const picture = (
    <picture>
      <source type="image/avif" srcSet={srcSet(media, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(media, 'webp')} sizes={sizes} />
      <img
        src={mediaUrl(media, 1200)}
        width={media.width}
        height={media.height}
        alt={alt ?? media.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className={imgClassName}
        draggable={false}
      />
    </picture>
  )
  if (bare) return picture
  const vars = {
    '--pic-color': media.hasAlpha ? 'transparent' : media.color,
    '--pic-placeholder': media.hasAlpha ? 'none' : `url(${media.placeholder})`,
    ...(focus ? { '--pic-focus': focus } : {}),
    ...style,
  } as CSSProperties
  return (
    <div className={['pic', media.hasAlpha ? 'pic--cutout' : '', className].filter(Boolean).join(' ')} style={vars}>
      {picture}
    </div>
  )
}
