import 'server-only'

import { cache } from 'react'
import type { Where } from 'payload'

import type { Locale } from '@/i18n/config'
import type { Project } from '@/payload-types'

import { getPayloadClient } from './payload'

export type ProjectStats = { priceFrom: number | null; available: number }

/** Минимальная цена и количество свободных квартир по каждому ЖК */
export const getProjectStats = cache(async (): Promise<Record<number, ProjectStats>> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'apartments',
    where: { status: { equals: 'available' } },
    select: { project: true, price: true },
    depth: 0,
    limit: 0,
    pagination: false,
  })
  const stats: Record<number, ProjectStats> = {}
  for (const apt of docs) {
    const id = typeof apt.project === 'object' ? apt.project.id : apt.project
    const s = (stats[id] ??= { priceFrom: null, available: 0 })
    s.available += 1
    if (s.priceFrom === null || apt.price < s.priceFrom) s.priceFrom = apt.price
  }
  return stats
})

export const getProjects = cache(async (locale: Locale, opts: { featured?: boolean } = {}) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'projects',
    locale,
    depth: 1,
    limit: 50,
    sort: 'order',
    where: opts.featured ? { featured: { equals: true } } : undefined,
  })
  return docs as Project[]
})

export const getProjectBySlug = cache(async (slug: string, locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'projects',
    locale,
    depth: 2,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
})

export const getActivePromotions = cache(async (locale: Locale, limit = 6) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'promotions',
    locale,
    depth: 1,
    limit,
    sort: 'order',
    where: {
      and: [
        { active: { equals: true } },
        {
          or: [{ validUntil: { exists: false } }, { validUntil: { greater_than_equal: new Date().toISOString() } }],
        },
      ],
    },
  })
  return docs
})

/** Все активные акции (без ограничения по количеству) */
export const getAllPromotions = cache((locale: Locale) => getActivePromotions(locale, 100))

/** Акция по slug; для старых записей без slug подходит числовой id */
export const getPromotionBySlug = cache(async (slugOrId: string, locale: Locale) => {
  const payload = await getPayloadClient()
  const where: Where = /^\d+$/.test(slugOrId)
    ? { or: [{ slug: { equals: slugOrId } }, { id: { equals: Number(slugOrId) } }] }
    : { slug: { equals: slugOrId } }
  const { docs } = await payload.find({ collection: 'promotions', locale, depth: 1, limit: 1, where })
  return docs[0] ?? null
})

export const getPaymentMethods = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'payment-methods', locale, depth: 0, limit: 50, sort: 'order' })
  return docs
})

export const getPaymentMethodBySlug = cache(async (slug: string, locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'payment-methods',
    locale,
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
})

export const getLatestPosts = cache(async (locale: Locale, limit = 3) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    locale,
    depth: 1,
    limit,
    sort: '-publishedAt',
    where: { _status: { equals: 'published' } },
  })
  return docs
})
