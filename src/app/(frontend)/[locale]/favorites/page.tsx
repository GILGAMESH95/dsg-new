import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ApartmentCard, ProjectCard } from '@/components/Cards'
import { FavoritesSync } from '@/components/FavoritesSync'
import { PageHero, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { getProjectStats } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ a?: string; p?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return { ...buildMetadata({ locale, path: '/favorites', title: dict.favorites.title, description: dict.favorites.lead }), robots: { index: false } }
}

const parseIds = (value?: string) =>
  [...new Set((value ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 50)

export default async function FavoritesPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const sp = await searchParams
  const aIds = parseIds(sp.a)
  const pIds = parseIds(sp.p)

  const payload = await getPayloadClient()
  const [apartments, projects, stats] = await Promise.all([
    aIds.length
      ? payload.find({ collection: 'apartments', locale, depth: 1, limit: 50, where: { id: { in: aIds } } })
      : null,
    pIds.length
      ? payload.find({ collection: 'projects', locale, depth: 1, limit: 50, where: { id: { in: pIds } } })
      : null,
    getProjectStats(),
  ])

  const empty = !apartments?.docs.length && !projects?.docs.length

  return (
    <>
      <FavoritesSync current={{ a: aIds.join(','), p: pIds.join(',') }} />
      <PageHero
        title={dict.favorites.title}
        lead={dict.favorites.lead}
        crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}
      />
      <section className="section section--tight">
        <div className="container">
          {empty && (
            <div className="empty">
              <p>{dict.favorites.empty}</p>
              <Link href={`/${locale}/apartments`} className="btn btn--accent">
                {dict.favorites.toCatalog}
              </Link>
            </div>
          )}
          {apartments && apartments.docs.length > 0 && (
            <div className="fav-section">
              <SectionHead title={dict.favorites.apartments} />
              <div className="grid grid--4">
                {apartments.docs.map((a) => (
                  <ApartmentCard key={a.id} apartment={a} locale={locale} dict={dict} />
                ))}
              </div>
            </div>
          )}
          {projects && projects.docs.length > 0 && (
            <div className="fav-section">
              <SectionHead title={dict.favorites.projects} />
              <div className="grid grid--3">
                {projects.docs.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    locale={locale}
                    dict={dict}
                    priceFrom={stats[p.id]?.priceFrom}
                    available={stats[p.id]?.available}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
