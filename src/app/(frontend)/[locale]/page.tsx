import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Calculator } from '@/components/Calculator'
import { ApartmentCard, PostCard, ProjectCard, PromoCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { ArrowIcon } from '@/components/icons'
import { Img } from '@/components/Img'
import { LeadButton } from '@/components/LeadModal'
import { SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { getActivePromotions, getLatestPosts, getProjects, getProjectStats } from '@/lib/queries'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const payload = await getPayloadClient()

  const [settings, projects, stats, promotions, posts, apartments] = await Promise.all([
    getSettings(locale),
    getProjects(locale, { featured: true }),
    getProjectStats(),
    getActivePromotions(locale, 3),
    getLatestPosts(locale, 3),
    payload.find({
      collection: 'apartments',
      locale,
      depth: 1,
      limit: 8,
      sort: '-promo',
      where: { status: { equals: 'available' } },
    }),
  ])

  return (
    <>
      <section className="hero">
        <Img media={settings.heroImage} alt="DS Group" size="hero" className="hero__bg" priority />
        <div className="hero__shade" />
        <div className="container hero__content">
          <span className="eyebrow">Batumi · Georgia</span>
          <h1 className="hero__title">{settings.heroTitle || dict.hero.title}</h1>
          <p className="hero__subtitle">{settings.heroSubtitle || dict.hero.subtitle}</p>
          <div className="hero__actions">
            <Link href={`/${locale}/apartments`} className="btn btn--accent btn--lg">
              {dict.hero.primary}
            </Link>
            <Link href={`/${locale}/promotions`} className="btn btn--ghost btn--lg">
              {dict.hero.secondary}
            </Link>
          </div>
          {settings.stats && settings.stats.length > 0 && (
            <dl className="hero__stats">
              {settings.stats.map((s) => (
                <div key={s.id}>
                  <dt>{s.value}</dt>
                  <dd>{s.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            title={dict.home.projectsTitle}
            lead={dict.home.projectsLead}
            link={{ href: `/${locale}/projects`, label: dict.common.allProjects }}
          />
          <div className="grid grid--2">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                locale={locale}
                dict={dict}
                priceFrom={stats[p.id]?.priceFrom}
                available={stats[p.id]?.available}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <SectionHead title={dict.home.promoTitle} lead={dict.home.promoLead} link={{ href: `/${locale}/promotions`, label: dict.common.more }} />
          {promotions.length > 0 && (
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
          )}
          <div className="calc-block">
            <div className="calc-block__intro">
              <h3>{dict.calculator.title}</h3>
              <p>{dict.calculator.lead}</p>
            </div>
            <Calculator dict={dict.calculator} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            title={dict.home.apartmentsTitle}
            lead={dict.home.apartmentsLead}
            link={{ href: `/${locale}/apartments`, label: dict.common.allApartments }}
          />
          <div className="grid grid--4">
            {apartments.docs.map((a) => (
              <ApartmentCard key={a.id} apartment={a} locale={locale} dict={dict} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--warm">
        <div className="container">
          <SectionHead title={dict.home.whyTitle} />
          <div className="why">
            {dict.home.why.map((item, i) => (
              <div key={item.title} className="why__item">
                <span className="why__num">0{i + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark invest">
        <div className="container invest__inner">
          <div>
            <span className="eyebrow">Investment</span>
            <h2 className="section-head__title">{dict.home.investTitle}</h2>
            <p className="section-head__lead">{dict.home.investLead}</p>
            <LeadButton className="btn btn--accent" type="consultation" title={dict.home.investCta} details="Инвест-презентация">
              {dict.home.investCta}
            </LeadButton>
          </div>
          <dl className="invest__stats">
            {dict.home.invest.map((s) => (
              <div key={s.label}>
                <dt>{s.value}</dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead title={dict.home.newsTitle} link={{ href: `/${locale}/blog`, label: dict.common.allNews }} />
            <div className="grid grid--3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} dict={dict} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
