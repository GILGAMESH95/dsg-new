import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PostCard } from '@/components/Cards'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/blog', title: dict.blog.title, description: dict.blog.lead })
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const { category, page } = await searchParams
  const activeCategory = category && category in dict.postCategories ? category : undefined

  const payload = await getPayloadClient()
  const posts = await payload.find({
    collection: 'posts',
    locale,
    depth: 1,
    limit: 9,
    page: Math.max(1, Number(page) || 1),
    sort: '-publishedAt',
    where: {
      _status: { equals: 'published' },
      ...(activeCategory ? { category: { equals: activeCategory } } : {}),
    },
  })

  const href = (cat?: string, p?: number) => {
    const q = new URLSearchParams()
    if (cat) q.set('category', cat)
    if (p && p > 1) q.set('page', String(p))
    const s = q.toString()
    return `/${locale}/blog${s ? `?${s}` : ''}`
  }

  return (
    <>
      <PageHero title={dict.blog.title} lead={dict.blog.lead} crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}>
        <div className="tabs">
          <Link href={href()} className={`tabs__item ${!activeCategory ? 'is-active' : ''}`}>
            {dict.blog.all}
          </Link>
          {Object.entries(dict.postCategories).map(([value, label]) => (
            <Link key={value} href={href(value)} className={`tabs__item ${activeCategory === value ? 'is-active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>
      </PageHero>
      <section className="section section--tight">
        <div className="container">
          {posts.docs.length > 0 ? (
            <div className="grid grid--3">
              {posts.docs.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} dict={dict} />
              ))}
            </div>
          ) : (
            <p className="empty">{dict.blog.empty}</p>
          )}
          {posts.totalPages > 1 && (
            <nav className="pagination">
              {Array.from({ length: posts.totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={href(activeCategory, p)} className={`pagination__item ${p === posts.page ? 'is-active' : ''}`}>
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>
    </>
  )
}
