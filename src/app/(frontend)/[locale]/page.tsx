import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Calculator } from '@/components/Calculator'
import { ApartmentCard, PostCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { ArrowIcon } from '@/components/icons'
import { Img } from '@/components/Img'
import { LeadButton } from '@/components/LeadModal'
import { ProjectGrid } from '@/components/ProjectGrid'
import { ScrollStrip } from '@/components/ScrollStrip'
import { SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { getActivePromotions, getLatestPosts, getPaymentMethods, getProjects, getProjectStats } from '@/lib/queries'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const payload = await getPayloadClient()

  const [settings, projects, stats, promotions, posts, methods, apartments] = await Promise.all([
    getSettings(locale),
    getProjects(locale, { featured: true }),
    getProjectStats(),
    getActivePromotions(locale, 8),
    getLatestPosts(locale, 8),
    getPaymentMethods(locale),
    payload.find({
      collection: 'apartments',
      locale,
      depth: 1,
      limit: 8,
      sort: '-promo',
      where: { status: { equals: 'available' } },
    }),
  ])

  const arrows = { prev: dict.project.prev, next: dict.project.next }
  const installment = methods.find((m) => m.showCalculator)

  // «Кратко о главном»: акции карточками-историями, затем цифры компании
  const stories = [
    ...promotions.map((p) => ({
      key: `p-${p.id}`,
      href: `/${locale}/promo/${p.slug ?? p.id}`,
      badge: p.badge,
      title: p.title,
      image: p.image,
    })),
    ...(settings.stats ?? []).map((s) => ({ key: `s-${s.id}`, href: `/${locale}/about`, badge: s.value, title: s.label, image: null })),
  ]

  const advantages = [
    ...dict.home.why.map((w) => ({ title: w.title, text: w.text })),
    ...dict.home.invest.map((v) => ({ title: v.value, text: v.label })),
  ]

  return (
    <>
      <section className="hero hero--compact">
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
            <Link href={`/${locale}/buy`} className="btn btn--ghost btn--lg">
              {dict.nav.buy}
            </Link>
          </div>
        </div>
      </section>

      {stories.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.home.glanceTitle} />
            <ScrollStrip labels={arrows} variant="overlay">
              {stories.map((s) => (
                <Link key={s.key} href={s.href} className={`story ${s.image ? 'story--photo' : ''}`}>
                  {s.image && <Img media={s.image} alt={s.title} size="card" className="story__img" sizes="260px" />}
                  {s.badge && <b>{s.badge}</b>}
                  <span>{s.title}</span>
                </Link>
              ))}
            </ScrollStrip>
          </div>
        </section>
      )}

      <section id="catalog" className="section section--tight anchor">
        <div className="container">
          <SectionHead
            title={dict.home.projectsTitle}
            lead={dict.home.projectsLead}
            link={{ href: `/${locale}/projects`, label: dict.common.allProjects }}
          />
          <ProjectGrid
            projects={projects}
            locale={locale}
            dict={dict}
            stats={stats}
            pageSize={6}
            extra={
              <div className="grid-promo">
                <span>{dict.home.gridPromoTitle}</span>
                <strong>{installment?.title ?? dict.nav.buy}</strong>
                <LeadButton type="consultation" title={dict.common.consultation} className="btn btn--accent">
                  {dict.common.consultation}
                </LeadButton>
              </div>
            }
          />
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="panel panel--glow home-buy">
            <div className="home-buy__head">
              <h2 className="panel__title">{dict.home.buyTitle}</h2>
              <p>{dict.home.buyLead}</p>
              <div className="home-buy__tabs">
                {methods.map((m) => (
                  <Link key={m.id} href={`/${locale}/buy/${m.slug ?? m.id}`} className="layouts__chip">
                    {m.title}
                  </Link>
                ))}
                <Link href={`/${locale}/buy`} className="link-arrow">
                  {dict.project.buyAll} <ArrowIcon width={18} height={18} />
                </Link>
              </div>
            </div>
            <div className="home-buy__calc">
              <Calculator
                dict={dict.calculator}
                minDown={installment?.calcMinDown ?? 20}
                maxMonths={installment?.calcMaxMonths ?? 36}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="standard">
            <Img media={settings.heroImage} alt="" size="hero" className="standard__bg" sizes="100vw" />
            <div className="standard__shade" />
            <div className="standard__body">
              <h2 className="panel__title">{dict.home.standardTitle}</h2>
              <p>{dict.home.standardLead}</p>
              <ScrollStrip labels={arrows} className="strip--on-dark">
                {advantages.map((a, i) => (
                  <div key={a.title} className="standard__tile">
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <h3>{a.title}</h3>
                    <p>{a.text}</p>
                  </div>
                ))}
              </ScrollStrip>
            </div>
          </div>
        </div>
      </section>

      {apartments.docs.length > 0 && (
        <section className="section section--tight">
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
      )}

      {posts.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.home.newsTitle} link={{ href: `/${locale}/about/news`, label: dict.common.allNews }} />
            <ScrollStrip labels={arrows} className="strip--news">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} dict={dict} />
              ))}
            </ScrollStrip>
          </div>
        </section>
      )}

      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
