import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Calculator } from '@/components/Calculator'
import { CtaSection } from '@/components/CtaSection'
import { LeadButton } from '@/components/LeadModal'
import { RichText } from '@/components/RichText'
import { PageHero, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPaymentMethodBySlug, getPaymentMethods } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const method = await getPaymentMethodBySlug(slug, locale)
  if (!method) return {}
  return buildMetadata({ locale, path: `/buy/${slug}`, title: method.title, description: method.summary })
}

export default async function BuyDetailPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const method = await getPaymentMethodBySlug(slug, locale)
  if (!method) notFound()
  const others = (await getPaymentMethods(locale)).filter((m) => m.id !== method.id)

  return (
    <>
      <PageHero
        title={method.title}
        lead={method.summary}
        crumbs={[
          { href: `/${locale}`, label: dict.common.breadcrumbsHome },
          { href: `/${locale}/buy`, label: dict.nav.buy },
        ]}
      >
        <div className="hero__actions">
          <LeadButton type="consultation" title={`${dict.buy.consult}: ${method.title}`} className="btn btn--accent btn--lg">
            {dict.buy.consult}
          </LeadButton>
        </div>
      </PageHero>

      {method.terms && method.terms.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.buy.terms} />
            <dl className="terms">
              {method.terms.map((t, i) => (
                <div key={t.id ?? i} className="terms__item">
                  <dd>{t.value}</dd>
                  <dt>{t.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {method.body && (
        <section className="section section--tight">
          <div className="container container--narrow">
            <RichText data={method.body} />
          </div>
        </section>
      )}

      {method.showCalculator && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.calculator.title} lead={dict.calculator.lead} />
            <div className="calc-block calc-block--single">
              <Calculator dict={dict.calculator} minDown={method.calcMinDown ?? 20} maxMonths={method.calcMaxMonths ?? 36} />
            </div>
          </div>
        </section>
      )}

      {method.steps && method.steps.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.buy.steps} />
            <ol className="steps promo-steps">
              {method.steps.map((s, i) => (
                <li key={s.id ?? i} className="steps__item">
                  <span className="steps__num">0{i + 1}</span>
                  <h3>{s.title}</h3>
                  {s.text && <p>{s.text}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {method.conditions && (
        <section className="section section--tight">
          <div className="container container--narrow">
            <p className="legal-note">{method.conditions}</p>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.buy.others} />
            <div className="grid grid--2">
              {others.map((m) => (
                <Link key={m.id} href={`/${locale}/buy/${m.slug ?? m.id}`} className="buy-card">
                  <h2>{m.title}</h2>
                  {m.summary && <p>{m.summary}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaSection locale={locale} dict={dict} hidden={{ type: 'consultation' }} />
    </>
  )
}
