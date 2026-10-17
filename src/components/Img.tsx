import Image from 'next/image'

import type { Media } from '@/payload-types'
import { mediaAlt, mediaUrl, type ImageSize } from '@/lib/media'

type Props = {
  media: number | Media | null | undefined
  alt?: string
  size?: ImageSize
  className?: string
  sizes?: string
  priority?: boolean
  /** Клик открывает фото на весь экран (см. ImageLightbox) */
  zoom?: boolean
  /** Показать фото целиком (contain), а свободное место заполнить размытой копией */
  blurFill?: boolean
}

/** Картинка из админки. Если фото ещё нет — аккуратная заглушка в фирменном стиле. */
export function Img({ media, alt = '', size, className = '', sizes = '100vw', priority, zoom, blurFill }: Props) {
  const src = mediaUrl(media, size)
  if (!src) {
    return (
      <div className={`img img--placeholder ${className}`} role="img" aria-label={alt}>
        <span>DS GROUP</span>
      </div>
    )
  }
  const zoomProps = zoom
    ? {
        'data-lb-src': mediaUrl(media, 'hero') ?? src,
        'data-lb-alt': mediaAlt(media, alt),
        role: 'button',
        tabIndex: 0,
        'aria-label': mediaAlt(media, alt) || 'Open image',
      }
    : {}
  return (
    <div className={`img ${zoom ? 'is-zoomable' : ''} ${blurFill ? 'img--fit' : ''} ${className}`} {...zoomProps}>
      {blurFill && <Image src={src} alt="" aria-hidden fill sizes="25vw" className="img__blur" />}
      <Image src={src} alt={mediaAlt(media, alt)} fill sizes={sizes} priority={priority} />
    </div>
  )
}
