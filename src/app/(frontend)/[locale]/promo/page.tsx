import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PromoCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { ArrowIcon } from '@/components/icons'
import { LeadButton } from '@/components/LeadModal'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getAllPromotions } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/promo', title: dict.promotions.title, description: dict.promotions.lead })
}

export default async function PromoPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const promotions = await getAllPromotions(locale)

  return (
    <>
      <PageHero
        title={dict.promotions.title}
        lead={dict.promotions.lead}
        crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]}
      />
      <section className="section section--tight">
        <div className="container">
          {promotions.length > 0 ? (
            <div className="grid grid--3">
              {promotions.map((promo) => (
                <PromoCard key={promo.id} promo={promo} locale={locale} dict={dict}>
                  <LeadButton
                    className="link-arrow"
                    type="promotion"
                    title={promo.title}
                    details={promo.title}
                    project={typeof promo.project === 'object' ? promo.project?.id : promo.project ?? undefined}
                  >
                    {dict.promotions.getOffer} <ArrowIcon width={18} height={18} />
                  </LeadButton>
                </PromoCard>
              ))}
            </div>
          ) : (
            <p className="empty">{dict.promotions.empty}</p>
          )}
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <h2 className="section-head__title">{dict.promotions.installmentTitle}</h2>
          <ol className="steps promo-steps">
            {dict.promotions.installmentSteps.map((s, i) => (
              <li key={s.title} className="steps__item">
                <span className="steps__num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
