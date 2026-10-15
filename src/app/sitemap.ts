import type { MetadataRoute } from 'next'

import { htmlLang, locales } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { siteUrl } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const [projects, posts, apartments] = await Promise.all([
    payload.find({ collection: 'projects', limit: 0, pagination: false, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({
      collection: 'posts',
      limit: 0,
      pagination: false,
      depth: 0,
      where: { _status: { equals: 'published' } },
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'apartments',
      limit: 0,
      pagination: false,
      depth: 0,
      where: { status: { not_equals: 'sold' } },
      select: { updatedAt: true },
    }),
  ])

  const entry = (path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap =>
    locales.map((l) => ({
      url: `${siteUrl}/${l}${path}`,
      lastModified,
      priority,
      alternates: {
        languages: Object.fromEntries(locales.map((x) => [htmlLang[x], `${siteUrl}/${x}${path}`])),
      },
    }))

  return [
    ...entry('', undefined, 1),
    ...['/projects', '/apartments', '/promotions', '/about', '/blog', '/contacts'].flatMap((p) => entry(p, undefined, 0.8)),
    ...projects.docs.map((p) => entry(`/projects/${p.slug}`, p.updatedAt, 0.9)).flat(),
    ...apartments.docs.map((a) => entry(`/apartments/${a.id}`, a.updatedAt, 0.5)).flat(),
    ...posts.docs.map((p) => entry(`/blog/${p.slug}`, p.updatedAt, 0.5)).flat(),
  ]
}
