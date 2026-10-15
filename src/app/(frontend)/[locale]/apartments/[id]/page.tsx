import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { Calculator } from '@/components/Calculator'
import { ApartmentCard } from '@/components/Cards'
import { Img } from '@/components/Img'
import { LeadForm } from '@/components/LeadForm'
import { Breadcrumbs, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale, type Locale } from '@/i18n/config'
import { formatNumber, formatPrice } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata, siteUrl } from '@/lib/seo'

type Props = { params: Promise<{ locale: string; id: string }> }

const getApartment = cache(async (id: string, locale: Locale) => {
  const n = Number(id)
  if (!Number.isInteger(n)) return null
  const payload = await getPayloadClient()
  return payload.findByID({ collection: 'apartments', id: n, locale, depth: 1 }).catch(() => null)
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  if (!isLocale(locale)) return {}
  const apt = await getApartment(id, locale)
  if (!apt) return {}
  const dict = getDictionary(locale)
  const project = typeof apt.project === 'object' ? apt.project : null
  const title = `${dict.apartment.title(apt.rooms, apt.area)} — ${project?.title ?? ''}`
  return buildMetadata({
    locale,
    path: `/apartments/${id}`,
    title,
    description: `${title}. ${dict.common.floor} ${apt.floor}. ${formatPrice(apt.price, locale)}. ${dict.meta.defaultDescription}`,
    image: mediaUrl(apt.plan),
  })
}

export default async function ApartmentPage({ params }: Props) {
  const { locale, id } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const apt = await getApartment(id, locale)
  if (!apt) notFound()
  const project = typeof apt.project === 'object' ? apt.project : null
  const title = dict.apartment.title(apt.rooms, apt.area)

  const payload = await getPayloadClient()
  const similar = await payload.find({
    collection: 'apartments',
    locale,
    depth: 1,
    limit: 4,
    where: {
      id: { not_equals: apt.id },
      rooms: { equals: apt.rooms },
      status: { equals: 'available' },
    },
  })

  const rows: [string, string][] = [
    [dict.apartment.number, apt.number],
    [dict.common.rooms, apt.rooms === 0 ? dict.common.studio : String(apt.rooms)],
    [dict.common.area, `${formatNumber(apt.area, locale)} ${dict.common.sqm}`],
    [dict.common.floor, project?.floors ? `${apt.floor} / ${project.floors}` : String(apt.floor)],
    ...(apt.view?.length ? [[dict.common.view, apt.view.map((v) => dict.views[v]).join(', ')] as [string, string]] : []),
    [dict.apartment.balcony, apt.hasBalcony ? dict.apartment.yes : dict.apartment.no],
    [dict.apartment.renovated, apt.renovated ? dict.apartment.yes : dict.apartment.no],
    ...(project?.completion ? [[dict.common.completion, project.completion] as [string, string]] : []),
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: `${title}, ${project?.title ?? ''}`,
    numberOfRooms: apt.rooms || 1,
    floorSize: { '@type': 'QuantitativeValue', value: apt.area, unitCode: 'MTK' },
    address: { '@type': 'PostalAddress', addressLocality: 'Batumi', addressCountry: 'GE', streetAddress: project?.address ?? undefined },
    offers: {
      '@type': 'Offer',
      price: apt.price,
      priceCurrency: 'USD',
      availability: apt.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: `${siteUrl}/${locale}/apartments/${apt.id}`,
    },
  }

  return (
    <>
      <section className="section apt-page">
        <div className="container">
          <Breadcrumbs
            items={[
              { href: `/${locale}`, label: dict.common.breadcrumbsHome },
              { href: `/${locale}/apartments`, label: dict.nav.apartments },
            ]}
            current={`№ ${apt.number}`}
          />
          <div className="apt-page__grid">
            <div className="apt-page__plan">
              <Img media={apt.plan} alt={`${dict.apartment.plan} ${title}`} sizes="(max-width: 960px) 100vw, 60vw" priority />
            </div>
            <div className="apt-page__info">
              <span className={`status status--${apt.status}`}>{dict.statuses.apartment[apt.status]}</span>
              <h1 className="apt-page__title">{title}</h1>
              {project && (
                <Link href={`/${locale}/projects/${project.slug}`} className="apt-page__project">
                  {dict.apartment.inProject} {project.title}
                </Link>
              )}
              <div className="apt-page__price">
                <strong>{formatPrice(apt.price, locale)}</strong>
                {apt.oldPrice ? <s>{formatPrice(apt.oldPrice, locale)}</s> : null}
                {apt.pricePerSqm ? (
                  <span>
                    {formatPrice(apt.pricePerSqm, locale)} {dict.common.perSqm}
                  </span>
                ) : null}
              </div>
              <dl className="params">
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {apt.status !== 'sold' && (
                <div className="apt-page__form">
                  <h2>{dict.apartment.request}</h2>
                  <LeadForm
                    locale={locale}
                    dict={dict.form}
                    hidden={{ type: 'apartment', apartment: apt.id, project: project?.id }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </section>

      {apt.status !== 'sold' && (
        <section className="section section--dark">
          <div className="container">
            <SectionHead title={dict.calculator.title} lead={dict.calculator.lead} />
            <Calculator
              dict={dict.calculator}
              initialPrice={apt.price}
              minDown={project?.minDownPayment ?? 20}
              maxMonths={project?.maxInstallmentMonths ?? 36}
              project={project?.id}
            />
          </div>
        </section>
      )}

      {similar.docs.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead title={dict.apartment.similar} />
            <div className="grid grid--4">
              {similar.docs.map((a) => (
                <ApartmentCard key={a.id} apartment={a} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
