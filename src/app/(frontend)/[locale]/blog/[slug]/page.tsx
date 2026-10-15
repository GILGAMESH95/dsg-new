import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { PostCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { Img } from '@/components/Img'
import { RichText } from '@/components/RichText'
import { Breadcrumbs, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale, type Locale } from '@/i18n/config'
import { formatDate } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata, siteUrl } from '@/lib/seo'

type Props = { params: Promise<{ locale: string; slug: string }> }

const getPost = cache(async (slug: string, locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    locale,
    depth: 1,
    limit: 1,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
  })
  return docs[0] ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const post = await getPost(slug, locale)
  if (!post) return {}
  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    image: mediaUrl(post.seo?.image) || mediaUrl(post.cover, 'card'),
  })
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const post = await getPost(slug, locale)
  if (!post) notFound()

  const payload = await getPayloadClient()
  const related = await payload.find({
    collection: 'posts',
    locale,
    depth: 1,
    limit: 3,
    sort: '-publishedAt',
    where: { id: { not_equals: post.id }, _status: { equals: 'published' } },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: mediaUrl(post.cover) ? `${siteUrl}${mediaUrl(post.cover)}` : undefined,
    publisher: { '@type': 'Organization', name: 'DS Group' },
  }

  return (
    <>
      <article className="section article">
        <div className="container container--narrow">
          <Breadcrumbs
            items={[
              { href: `/${locale}`, label: dict.common.breadcrumbsHome },
              { href: `/${locale}/blog`, label: dict.nav.blog },
            ]}
            current={post.title}
          />
          <div className="article__meta">
            {post.category && <span>{dict.postCategories[post.category]}</span>}
            <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt, locale)}</time>
          </div>
          <h1 className="article__title">{post.title}</h1>
          {post.excerpt && <p className="lead-text">{post.excerpt}</p>}
          <Img media={post.cover} alt={post.title} className="article__cover" sizes="(max-width: 860px) 100vw, 860px" priority />
          <RichText data={post.content} />
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </article>
      {related.docs.length > 0 && (
        <section className="section section--warm">
          <div className="container">
            <SectionHead title={dict.blog.related} />
            <div className="grid grid--3">
              {related.docs.map((p) => (
                <PostCard key={p.id} post={p} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
