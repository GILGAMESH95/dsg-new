import { FaqAccordion } from '@/components/ui/FaqAccordion'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CtaSection } from '@/components/CtaSection'
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
  return buildMetadata({ locale, path: '/support', title: dict.faq.title, description: dict.faq.lead })
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)

  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'faqs', locale, depth: 0, limit: 200, sort: 'order' })

  const groups = Object.keys(dict.faq.categories)
    .map((key) => ({ key, items: docs.filter((d) => d.category === key) }))
    .filter((g) => g.items.length > 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: docs.map((d) => ({
      '@type': 'Question',
      name: d.question,
      acceptedAnswer: { '@type': 'Answer', text: d.answer },
    })),
  }

  return (
    <>
      <PageHero
        title={dict.faq.title}
        lead={dict.faq.lead}
        crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}
      />
      <section className="section section--tight">
        <div className="container container--narrow">
          {groups.length > 0 ? (
            groups.map((g) => (
              <div key={g.key} className="faq-group">
                <h2>{dict.faq.categories[g.key]}</h2>
                <FaqAccordion items={g.items.map((i) => ({ id: i.id, question: i.question, answer: i.answer }))} />
              </div>
            ))
          ) : (
            <p className="empty">{dict.faq.empty}</p>
          )}
        </div>
        {docs.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        )}
      </section>
      <CtaSection locale={locale} dict={dict} title={dict.faq.askTitle} lead={dict.faq.askLead} />
    </>
  )
}
