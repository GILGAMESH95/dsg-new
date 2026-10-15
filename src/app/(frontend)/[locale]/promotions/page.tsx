import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Calculator } from '@/components/Calculator'
import { ApartmentCard, PromoCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { ArrowIcon } from '@/components/icons'
import { LeadButton } from '@/components/LeadModal'
import { PageHero, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { getActivePromotions } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return buildMetadata({ locale, path: '/promotions', title: dict.promotions.title, description: dict.promotions.lead })
}

export default async function PromotionsPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const payload = await getPayloadClient()
  const [promotions, promoApartments] = await Promise.all([
    getActivePromotions(locale, 20),
    payload.find({
      collection: 'apartments',
      locale,
      depth: 1,
      limit: 8,
      sort: 'price',
      where: { promo: { equals: true }, status: { equals: 'available' } },
    }),
  ])

  return (
    <>
      <PageHero title={dict.promotions.title} lead={dict.promotions.lead} crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]} />
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
                    {dict.common.consultation} <ArrowIcon width={18} height={18} />
                  </LeadButton>
                </PromoCard>
              ))}
            </div>
          ) : (
            <p className="empty">{dict.promotions.empty}</p>
          )}
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <SectionHead title={dict.promotions.installmentTitle} />
          <ol className="steps">
            {dict.promotions.installmentSteps.map((step, i) => (
              <li key={step.title} className="steps__item">
                <span className="steps__num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="calc-block">
            <div className="calc-block__intro">
              <h3>{dict.calculator.title}</h3>
              <p>{dict.calculator.lead}</p>
            </div>
            <Calculator dict={dict.calculator} />
          </div>
        </div>
      </section>

      {promoApartments.docs.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead
              title={dict.promotions.apartmentsTitle}
              link={{ href: `/${locale}/apartments?promo=1`, label: dict.common.allApartments }}
            />
            <div className="grid grid--4">
              {promoApartments.docs.map((a) => (
                <ApartmentCard key={a.id} apartment={a} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaSection locale={locale} dict={dict} hidden={{ type: 'installment' }} />
    </>
  )
}
