import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PostRow } from '@/components/Cards'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ year?: string; shown?: string }>
}

const STEP = 12
const MAX_SHOWN = 240

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/about/news', title: dict.blog.title, description: dict.blog.lead })
}

export default async function NewsPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const { year: yearParam, shown: shownParam } = await searchParams

  const payload = await getPayloadClient()
  const published = { _status: { equals: 'published' as const } }

  // Годы, за которые есть публикации
  const dates = await payload.find({
    collection: 'posts',
    where: published,
    select: { publishedAt: true },
    depth: 0,
    limit: 0,
    pagination: false,
  })
  const years = [
    ...new Set(dates.docs.map((d) => d.publishedAt?.slice(0, 4)).filter((y): y is string => !!y)),
  ].sort((a, b) => b.localeCompare(a))

  const year = yearParam && years.includes(yearParam) ? yearParam : undefined
  const limit = Math.min(MAX_SHOWN, Math.max(STEP, Math.round(Number(shownParam) || STEP)))

  const posts = await payload.find({
    collection: 'posts',
    locale,
    depth: 1,
    limit,
    sort: '-publishedAt',
    where: {
      ...published,
      ...(year
        ? { and: [{ publishedAt: { greater_than_equal: `${year}-01-01T00:00:00.000Z` } }, { publishedAt: { less_than: `${Number(year) + 1}-01-01T00:00:00.000Z` } }] }
        : {}),
    },
  })

  const href = (y?: string, shown?: number) => {
    const q = new URLSearchParams()
    if (y) q.set('year', y)
    if (shown && shown > STEP) q.set('shown', String(shown))
    const s = q.toString()
    return `/${locale}/about/news${s ? `?${s}` : ''}`
  }

  return (
    <>
      <PageHero
        title={dict.blog.title}
        lead={dict.blog.lead}
        crumbs={[
          { href: `/${locale}`, label: dict.common.breadcrumbsHome },
          { href: `/${locale}/about`, label: dict.nav.about },
        ]}
      >
        {years.length > 1 && (
          <div className="tabs" aria-label={dict.blog.year}>
            <Link href={href()} scroll={false} className={`tabs__item ${!year ? 'is-active' : ''}`}>
              {dict.blog.all}
            </Link>
            {years.map((y) => (
              <Link key={y} href={href(y)} scroll={false} className={`tabs__item ${year === y ? 'is-active' : ''}`}>
                {y}
              </Link>
            ))}
          </div>
        )}
      </PageHero>
      <section className="section section--tight">
        <div className="container">
          {posts.docs.length > 0 ? (
            <div className="news-list">
              {posts.docs.map((post) => (
                <PostRow key={post.id} post={post} locale={locale} dict={dict} />
              ))}
            </div>
          ) : (
            <p className="empty">{dict.blog.empty}</p>
          )}
          {posts.totalDocs > posts.docs.length && limit < MAX_SHOWN && (
            <div className="news-more">
              <Link href={href(year, limit + STEP)} scroll={false} className="btn btn--ghost">
                {dict.blog.showMore}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
