import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/documents', title: dict.documents.title, description: dict.documents.lead })
}

const sizeLabel = (bytes?: number | null) => {
  if (!bytes) return ''
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default async function DocumentsPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)

  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'documents', locale, depth: 0, limit: 200, sort: 'order' })

  const groups = Object.keys(dict.documents.categories)
    .map((key) => ({ key, items: docs.filter((d) => d.category === key && d.url) }))
    .filter((g) => g.items.length > 0)

  return (
    <>
      <PageHero
        title={dict.documents.title}
        lead={dict.documents.lead}
        crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}
      />
      <section className="section section--tight">
        <div className="container container--narrow">
          {groups.length > 0 ? (
            groups.map((g) => (
              <div key={g.key} className="faq-group">
                <h2>{dict.documents.categories[g.key]}</h2>
                <div className="news-list">
                  {g.items.map((d) => (
                    <a key={d.id} href={d.url!} target="_blank" rel="noopener" className="news-row" download>
                      <div className="news-row__text">
                        <h3>{d.title}</h3>
                        <div className="post-card__meta">
                          <span>{(d.filename?.split('.').pop() ?? '').toUpperCase()}</span>
                          <time>{sizeLabel(d.filesize)}</time>
                        </div>
                        {d.description && <p className="doc-desc">{d.description}</p>}
                      </div>
                      <span className="link-arrow">{dict.documents.download}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="empty">{dict.documents.empty}</p>
          )}
        </div>
      </section>
    </>
  )
}
