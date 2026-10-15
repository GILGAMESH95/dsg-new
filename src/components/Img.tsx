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
}

/** Картинка из админки. Если фото ещё нет — аккуратная заглушка в фирменном стиле. */
export function Img({ media, alt = '', size, className = '', sizes = '100vw', priority }: Props) {
  const src = mediaUrl(media, size)
  if (!src) {
    return (
      <div className={`img img--placeholder ${className}`} role="img" aria-label={alt}>
        <span>DS GROUP</span>
      </div>
    )
  }
  return (
    <div className={`img ${className}`}>
      <Image src={src} alt={mediaAlt(media, alt)} fill sizes={sizes} priority={priority} />
    </div>
  )
}
