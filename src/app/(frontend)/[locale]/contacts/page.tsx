import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TelegramIcon, WhatsappIcon } from '@/components/icons'
import { LeadForm } from '@/components/LeadForm'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { phoneHref, telegramHref, whatsappHref } from '@/lib/format'
import { getSettings } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/contacts', title: dict.contacts.title, description: dict.contacts.lead })
}

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const s = await getSettings(locale)
  const c = dict.contacts

  return (
    <>
      <PageHero title={c.title} lead={c.lead} crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]} />
      <section className="section section--tight">
        <div className="container contacts">
          <div className="contacts__info">
            <dl className="contacts__list">
              {s.phone && (
                <div>
                  <dt>{c.phone}</dt>
                  <dd>
                    <a href={phoneHref(s.phone)} className="contacts__phone">
                      {s.phone}
                    </a>
                  </dd>
                </div>
              )}
              {s.email && (
                <div>
                  <dt>{c.email}</dt>
                  <dd>
                    <a href={`mailto:${s.email}`}>{s.email}</a>
                  </dd>
                </div>
              )}
              {s.address && (
                <div>
                  <dt>{c.address}</dt>
                  <dd>{s.address}</dd>
                </div>
              )}
              {s.workingHours && (
                <div>
                  <dt>{c.hours}</dt>
                  <dd>{s.workingHours}</dd>
                </div>
              )}
              {(s.whatsapp || s.telegram) && (
                <div>
                  <dt>{c.messengers}</dt>
                  <dd className="contacts__messengers">
                    {s.whatsapp && (
                      <a href={whatsappHref(s.whatsapp)} target="_blank" rel="noopener" className="btn btn--outline btn--sm">
                        <WhatsappIcon /> WhatsApp
                      </a>
                    )}
                    {s.telegram && (
                      <a href={telegramHref(s.telegram)} target="_blank" rel="noopener" className="btn btn--outline btn--sm">
                        <TelegramIcon /> Telegram
                      </a>
                    )}
                  </dd>
                </div>
              )}
            </dl>
            {(s.officeLat && s.officeLng) || s.address ? (
              <div className="map-frame contacts__map">
                <iframe
                  title="DS Group"
                  src={`https://maps.google.com/maps?q=${s.officeLat && s.officeLng ? `${s.officeLat},${s.officeLng}` : encodeURIComponent(s.address ?? '')}&z=16&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
          </div>
          <div className="contacts__form">
            <h2>{c.formTitle}</h2>
            <LeadForm locale={locale} dict={dict.form} hidden={{ type: 'consultation' }} withMessage />
          </div>
        </div>
      </section>
    </>
  )
}
