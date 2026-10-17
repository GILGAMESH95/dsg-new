import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PromoCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { Img } from '@/components/Img'
import { LeadButton } from '@/components/LeadModal'
import { RichText } from '@/components/RichText'
import { Breadcrumbs, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { formatDate } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { getAllPromotions, getPromotionBySlug } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const promo = await getPromotionBySlug(slug, locale)
  if (!promo) return {}
  return buildMetadata({
    locale,
    path: `/promo/${slug}`,
    title: promo.title,
    description: promo.description,
    image: mediaUrl(promo.image, 'card'),
  })
}

export default async function PromoDetailPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const promo = await getPromotionBySlug(slug, locale)
  if (!promo) notFound()

  const project = typeof promo.project === 'object' ? promo.project : null
  const others = (await getAllPromotions(locale)).filter((p) => p.id !== promo.id).slice(0, 3)

  return (
    <>
      <section className="section article promo-page">
        <div className="container container--narrow">
          <Breadcrumbs
            items={[
              { href: `/${locale}`, label: dict.common.breadcrumbsHome },
              { href: `/${locale}/promo`, label: dict.nav.promotions },
            ]}
            current={promo.title}
          />
          <div className="article__meta">
            {promo.badge && <span>{promo.badge}</span>}
            {promo.validUntil && (
              <time dateTime={promo.validUntil}>
                {dict.common.validUntil} {formatDate(promo.validUntil, locale)}
              </time>
            )}
          </div>
          <h1 className="article__title">{promo.title}</h1>
          {promo.description && <p className="lead-text">{promo.description}</p>}
          {promo.image && <Img media={promo.image} alt={promo.title} size="hero" className="article__cover" sizes="(max-width: 960px) 100vw, 860px" />}
          <RichText data={promo.body} />
          {promo.conditions && (
            <aside className="promo-conditions">
              <h2>{dict.promotions.conditions}</h2>
              <p>{promo.conditions}</p>
            </aside>
          )}
          <div className="promo-page__actions">
            <LeadButton
              className="btn btn--accent btn--lg"
              type="promotion"
              title={promo.title}
              details={promo.title}
              project={project?.id}
            >
              {dict.promotions.getOffer}
            </LeadButton>
            {project && (
              <Link href={`/${locale}/projects/${project.slug}`} className="btn btn--ghost btn--lg">
                {project.title}
              </Link>
            )}
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.promotions.otherPromos} link={{ href: `/${locale}/promo`, label: dict.promotions.allPromos }} />
            <div className="grid grid--3">
              {others.map((p) => (
                <PromoCard key={p.id} promo={p} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaSection locale={locale} dict={dict} hidden={{ type: 'promotion', project: project?.id }} />
    </>
  )
}
