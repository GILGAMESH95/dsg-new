import type { Media } from '@/payload-types'

type MaybeMedia = number | Media | null | undefined

export type ImageSize = 'thumb' | 'card' | 'hero'

export function mediaUrl(media: MaybeMedia, size?: ImageSize): string | null {
  if (!media || typeof media === 'number') return null
  if (size && media.sizes?.[size]?.url) return media.sizes[size]!.url!
  return media.url ?? null
}

export function mediaAlt(media: MaybeMedia, fallback = ''): string {
  if (!media || typeof media === 'number') return fallback
  return media.alt || fallback
}
