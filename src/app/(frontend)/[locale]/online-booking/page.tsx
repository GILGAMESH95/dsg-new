import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CtaSection } from '@/components/CtaSection'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { formatPrice } from '@/lib/format'
import { getSettings } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/online-booking', title: dict.onlineBooking.title, description: dict.onlineBooking.lead })
}

export default async function OnlineBookingPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const settings = await getSettings(locale)
  const o = dict.onlineBooking

  return (
    <>
      <PageHero title={o.title} lead={o.lead} crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}>
        <div className="hero__actions">
          <Link href={`/${locale}/apartments?available=1`} className="btn btn--accent btn--lg">
            {o.cta}
          </Link>
        </div>
      </PageHero>

      <section className="section section--tight">
        <div className="container">
          <h2 className="panel__title">{o.stepsTitle}</h2>
          <ol className="steps promo-steps">
            {o.steps.map((s, i) => (
              <li key={s.title} className="steps__item">
                <span className="steps__num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container container--narrow">
          <div className="panel">
            <h2 className="panel__title">{o.terms}</h2>
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
            {settings.bookingNote && <p className="legal-note">{settings.bookingNote}</p>}
          </div>
        </div>
      </section>
      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
