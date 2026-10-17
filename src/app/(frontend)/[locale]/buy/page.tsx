import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CtaSection } from '@/components/CtaSection'
import { ArrowIcon } from '@/components/icons'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPaymentMethods } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/buy', title: dict.buy.title, description: dict.buy.lead })
}

export default async function BuyPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const methods = await getPaymentMethods(locale)

  return (
    <>
      <PageHero
        title={dict.buy.title}
        lead={dict.buy.lead}
        crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}
      />
      <section className="section section--tight">
        <div className="container">
          {methods.length > 0 ? (
            <div className="grid grid--2">
              {methods.map((m) => (
                <Link key={m.id} href={`/${locale}/buy/${m.slug ?? m.id}`} className="buy-card">
                  <h2>{m.title}</h2>
                  {m.summary && <p>{m.summary}</p>}
                  {m.terms && m.terms.length > 0 && (
                    <dl>
                      {m.terms.slice(0, 3).map((t, i) => (
                        <div key={t.id ?? i}>
                          <dt>{t.label}</dt>
                          <dd>{t.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <span className="link-arrow">
                    {dict.buy.details} <ArrowIcon width={18} height={18} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">{dict.buy.empty}</p>
          )}
        </div>
      </section>
      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
