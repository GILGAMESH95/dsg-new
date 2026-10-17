import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { Calculator } from '@/components/Calculator'
import { ApartmentCard, apartmentFacts } from '@/components/Cards'
import { BookingForm } from '@/components/BookingForm'
import { CompareButton } from '@/components/CompareButton'
import { FavoriteButton } from '@/components/FavoriteButton'
import { Img } from '@/components/Img'
import { PlanTabs, type PlanTab } from '@/components/PlanTabs'
import { LeadForm } from '@/components/LeadForm'
import { Breadcrumbs, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale, type Locale } from '@/i18n/config'
import { formatNumber, formatPrice } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { buildMetadata, siteUrl } from '@/lib/seo'

type Props = { params: Promise<{ locale: string; id: string }> }

const getApartment = cache(async (id: string, locale: Locale) => {
  const n = Number(id)
  if (!Number.isInteger(n)) return null
  const payload = await getPayloadClient()
  return payload.findByID({ collection: 'apartments', id: n, locale, depth: 2 }).catch(() => null)
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
  const settings = await getSettings(locale)
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

  const { tags, discount } = apartmentFacts(apt, dict)

  const rows: [string, string][] = [
    [dict.apartment.number, apt.number],
    ...(apt.building ? [[dict.apartment.building, apt.building] as [string, string]] : []),
    [dict.common.rooms, apt.rooms === 0 ? dict.common.studio : String(apt.rooms)],
    [dict.common.area, `${formatNumber(apt.area, locale)} ${dict.common.sqm}`],
    [dict.common.floor, project?.floors ? dict.apartment.floorOf(apt.floor, project.floors) : String(apt.floor)],
    ...(apt.finish ? [[dict.apartment.finish, dict.catalog.finishOptions[apt.finish]] as [string, string]] : []),
    ...(apt.view?.length ? [[dict.common.view, apt.view.map((v) => dict.views[v]).join(', ')] as [string, string]] : []),
    [dict.apartment.balcony, apt.hasBalcony ? dict.apartment.yes : dict.apartment.no],
    ...(apt.finish ? [] : [[dict.apartment.renovated, apt.renovated ? dict.apartment.yes : dict.apartment.no] as [string, string]]),
    ...(project?.completion ? [[dict.common.completion, project.completion] as [string, string]] : []),
  ]

  // Вкладки над планировкой: сама планировка + дополнительные изображения из админки
  const planTabs: PlanTab[] = [
    { id: 'plan', label: dict.apartment.planTabs.plan, media: apt.plan },
    ...(apt.extraImages ?? []).map((x, i) => ({ id: `${x.kind}-${i}`, label: dict.apartment.planTabs[x.kind] ?? x.kind, media: x.image })),
  ].flatMap(({ media, ...t }) => {
    const url = mediaUrl(media, 'hero')
    return url ? [{ ...t, url, fullUrl: mediaUrl(media), alt: `${t.label} — ${title}` }] : []
  })

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
            {/* Слева — светлая карточка: заголовок, теги, планировка, параметры (как у fsk.ru) */}
            <div className="apt-main">
              <h1 className="apt-page__title">{title}</h1>
              <p className="apt-main__sub">
                <span className={`status-text status-text--${apt.status}`}>{dict.statuses.apartment[apt.status]}</span>
                {[apt.building, project?.floors ? `${dict.common.floor} ${dict.apartment.floorOf(apt.floor, project.floors)}` : `${dict.common.floor} ${apt.floor}`, `№ ${apt.number}`]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {tags.length > 0 && (
                <div className="apt-main__tags">
                  {tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              )}
              {planTabs.length > 1 ? (
                <PlanTabs tabs={planTabs} />
              ) : (
                <div className="apt-page__plan">
                  <Img media={apt.plan} alt={`${dict.apartment.plan} ${title}`} size="hero" sizes="(max-width: 960px) 100vw, 60vw" priority zoom />
                </div>
              )}
              <dl className="params apt-main__params">
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <aside className="apt-side">
              {project && (
                <Link href={`/${locale}/projects/${project.slug}`} className="apt-side__project">
                  <Img media={project.cover} alt={project.title} size="card" className="apt-side__cover" sizes="(max-width: 960px) 100vw, 33vw" />
                  <span className="apt-side__ptitle">{project.title}</span>
                  <span className="apt-side__pline">
                    {dict.apartment.inProject} {project.title}
                    {project.district ? `, ${project.district}` : ''}
                  </span>
                </Link>
              )}
              <div className="apt-side__price panel">
                <div className="apt-page__price">
                  <strong>{formatPrice(apt.price, locale)}</strong>
                  {apt.pricePerSqm ? (
                    <span>
                      {formatPrice(apt.pricePerSqm, locale)} {dict.common.perSqm}
                    </span>
                  ) : null}
                </div>
                {apt.oldPrice ? (
                  <div className="apt-side__old">
                    <s>{formatPrice(apt.oldPrice, locale)}</s>
                    {discount > 0 && <span className="apt-page__discount">−{discount}%</span>}
                  </div>
                ) : null}
                <div className="apt-side__actions">
                  {apt.status === 'available' ? (
                    <a href="#booking" className="btn btn--accent btn--block">
                      {dict.booking.submit}
                    </a>
                  ) : (
                    <a href="#ask" className="btn btn--accent btn--block">
                      {dict.apartment.askPrice}
                    </a>
                  )}
                  <CompareButton id={apt.id} labels={dict.compare} className="cmp-btn--inline" />
                  <FavoriteButton kind="a" id={apt.id} labels={dict.favorites} />
                </div>
              </div>
              {apt.status === 'available' && (
                <div className="apt-page__form" id="booking">
                  <h2>{dict.booking.title}</h2>
                  <p className="booking-lead">{dict.booking.lead}</p>
                  <ul className="booking-facts">
                    <li>
                      <span>{dict.booking.holdLabel}</span>
                      <b>
                        {settings.bookingHoldHours ?? 48} {dict.booking.hoursUnit}
                      </b>
                    </li>
                    {settings.bookingDeposit ? (
                      <li>
                        <span>{dict.booking.depositLabel}</span>
                        <b>{formatPrice(settings.bookingDeposit, locale)}</b>
                      </li>
                    ) : null}
                  </ul>
                  <BookingForm locale={locale} apartmentId={apt.id} dict={dict.booking} formDict={dict.form} />
                  <Link href={`/${locale}/online-booking`} className="link-arrow booking-more">
                    {dict.nav.onlineBooking} →
                  </Link>
                </div>
              )}
              {apt.status !== 'available' && (
                <div className="apt-page__form" id="ask">
                  <h2>{dict.apartment.askPrice}</h2>
                  <LeadForm locale={locale} dict={dict.form} hidden={{ type: 'apartment', apartment: apt.id, project: project?.id }} />
                </div>
              )}
            </aside>
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
