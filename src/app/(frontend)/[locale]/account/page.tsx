import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AuthPanel } from '@/components/AccountForms'
import { CabinetShell } from '@/components/CabinetShell'
import { Img } from '@/components/Img'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getClient, getUnreadCount } from '@/lib/clientAuth'
import { formatDate, formatPrice } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'
import { getProjects } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return { ...buildMetadata({ locale, path: '/account', title: dict.account.title, description: dict.account.lead }), robots: { index: false } }
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const a = dict.account
  const client = await getClient()

  if (!client) {
    return (
      <>
        <PageHero title={a.title} lead={a.lead} crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]} />
        <section className="section section--tight">
          <div className="container container--narrow">
            <AuthPanel locale={locale} dict={a} />
          </div>
        </section>
      </>
    )
  }

  const payload = await getPayloadClient()
  const [bookings, projects, unread] = await Promise.all([
    payload.find({
      collection: 'bookings',
      where: { or: [{ client: { equals: client.id } }, { email: { equals: client.email } }] },
      depth: 1,
      limit: 50,
      sort: '-createdAt',
      overrideAccess: true,
    }),
    getProjects(locale),
    getUnreadCount(client.id),
  ])
  const searches = client.savedSearches ?? []

  return (
    <CabinetShell locale={locale} dict={dict} name={client.name || client.email} active="home" unread={unread}>
      <div className="cabinet__split">
        <div className="panel cabinet__empty-or-list">
          {bookings.docs.length === 0 ? (
            <div className="cabinet__empty">
              <p>{dict.cabinet.noBookingsText}</p>
              <Link href={`/${locale}/apartments`} className="btn btn--accent">
                {dict.cabinet.addBooking}
              </Link>
            </div>
          ) : (
            <ul className="account-list">
              {bookings.docs.map((b) => {
                const apt = typeof b.apartment === 'object' ? b.apartment : null
                const project = apt && typeof apt.project === 'object' ? apt.project : null
                return (
                  <li key={b.id}>
                    <div>
                      <strong>
                        {apt ? dict.apartment.title(apt.rooms, apt.area) : '—'}
                        {apt?.number ? ` · № ${apt.number}` : ''}
                      </strong>
                      <span>
                        {project?.title}
                        {b.priceAtBooking ? ` · ${formatPrice(b.priceAtBooking, locale)}` : ''}
                      </span>
                      {b.holdUntil && (
                        <span>
                          {a.holdUntil} {formatDate(b.holdUntil, locale)}
                        </span>
                      )}
                    </div>
                    <div className="account-list__side">
                      <span className={`booking-status booking-status--${b.status}`}>{a.bookingStatus[b.status]}</span>
                      {apt && (
                        <Link href={`/${locale}/apartments/${apt.id}`} className="link-arrow">
                          {a.openApartment}
                        </Link>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="panel panel--glow cabinet__promo">
          <h2>{dict.account.savedSearches}</h2>
          {searches.length === 0 ? (
            <p className="account-empty">{a.noSearches}</p>
          ) : (
            <ul className="account-list">
              {searches.map((s) => (
                <li key={s.id}>
                  <Link href={`/${locale}/apartments${s.query ? `?${s.query}` : ''}`} className="link-arrow">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {projects.length > 0 && (
        <div className="cabinet__projects">
          <h2 className="panel__title">{dict.cabinet.chooseApartment}</h2>
          <div className="cabinet__tiles">
            {projects.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/${locale}/projects/${p.slug}`} className="cabinet__tile">
                <Img media={p.cover} alt={p.title} size="card" className="cabinet__tile-img" sizes="(max-width: 720px) 100vw, 33vw" />
                <span>{p.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </CabinetShell>
  )
}
