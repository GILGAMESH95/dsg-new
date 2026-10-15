import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Calculator } from '@/components/Calculator'
import { ApartmentCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { CheckIcon, PinIcon } from '@/components/icons'
import { Img } from '@/components/Img'
import { LeadButton } from '@/components/LeadModal'
import { RichText } from '@/components/RichText'
import { Breadcrumbs, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { formatDate, formatPrice } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import { getProjectBySlug, getProjectStats } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const project = await getProjectBySlug(slug, locale)
  if (!project) return {}
  return buildMetadata({
    locale,
    path: `/projects/${slug}`,
    title: project.seo?.title || project.title,
    description: project.seo?.description || project.excerpt,
    image: mediaUrl(project.seo?.image) || mediaUrl(project.cover, 'card'),
  })
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const project = await getProjectBySlug(slug, locale)
  if (!project) notFound()

  const payload = await getPayloadClient()
  const [apartments, stats] = await Promise.all([
    payload.find({
      collection: 'apartments',
      locale,
      depth: 1,
      limit: 8,
      sort: 'price',
      where: { project: { equals: project.id }, status: { equals: 'available' } },
    }),
    getProjectStats(),
  ])
  const s = stats[project.id]

  const facts = [
    s?.priceFrom && { label: dict.project.pricesFrom, value: formatPrice(s.priceFrom, locale) },
    project.completion && { label: dict.common.completion, value: project.completion },
    project.floors && { label: dict.common.floors, value: String(project.floors) },
    project.distanceToSea && { label: dict.common.toSea, value: `${project.distanceToSea} ${dict.common.meters}` },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <section className="project-hero">
        <Img media={project.cover} alt={project.title} size="hero" className="project-hero__bg" priority />
        <div className="hero__shade" />
        <div className="container project-hero__content">
          <Breadcrumbs
            items={[
              { href: `/${locale}`, label: dict.common.breadcrumbsHome },
              { href: `/${locale}/projects`, label: dict.nav.projects },
            ]}
            current={project.title}
          />
          <span className={`badge badge--${project.status}`}>{dict.statuses.project[project.status]}</span>
          <h1 className="hero__title">{project.title}</h1>
          {project.tagline && <p className="hero__subtitle">{project.tagline}</p>}
          {project.address && (
            <p className="project-hero__address">
              <PinIcon /> {project.address}
            </p>
          )}
          <div className="hero__actions">
            <LeadButton type="consultation" project={project.id} title={`${dict.common.consultation}: ${project.title}`} className="btn btn--accent btn--lg">
              {dict.common.consultation}
            </LeadButton>
            <Link href={`/${locale}/apartments?project=${project.id}`} className="btn btn--ghost btn--lg">
              {dict.hero.primary}
            </Link>
          </div>
          {facts.length > 0 && (
            <dl className="hero__stats">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.value}</dt>
                  <dd>{f.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container about-project">
          <div>
            <SectionHead title={dict.project.about} />
            {project.excerpt && <p className="lead-text">{project.excerpt}</p>}
            <RichText data={project.description} />
          </div>
          {project.features && project.features.length > 0 && (
            <aside className="features">
              <h3>{dict.project.features}</h3>
              <ul>
                {project.features.map((f) => (
                  <li key={f.id}>
                    <CheckIcon /> {f.text}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </section>

      {project.gallery && project.gallery.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.project.gallery} />
            <div className="gallery">
              {project.gallery.map((g, i) => (
                <Img key={g.id ?? i} media={g.image} alt={`${project.title} ${i + 1}`} size="card" className="gallery__item" sizes="(max-width: 768px) 50vw, 33vw" />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section--warm">
        <div className="container">
          <SectionHead
            title={dict.project.apartments}
            link={apartments.totalDocs > 0 ? { href: `/${locale}/apartments?project=${project.id}`, label: `${dict.common.allApartments} (${apartments.totalDocs})` } : undefined}
          />
          {apartments.docs.length > 0 ? (
            <div className="grid grid--4">
              {apartments.docs.map((a) => (
                <ApartmentCard key={a.id} apartment={a} locale={locale} dict={dict} />
              ))}
            </div>
          ) : (
            <p className="empty">{dict.project.noApartments}</p>
          )}
        </div>
      </section>

      {project.status !== 'completed' && (
        <section className="section section--dark">
          <div className="container">
            <SectionHead
              title={dict.project.installment}
              lead={`${dict.project.downFrom} ${project.minDownPayment ?? 20}%, ${dict.project.upTo} ${project.maxInstallmentMonths ?? 36} ${dict.project.months}`}
            />
            {project.installmentNote && <p className="section-note">{project.installmentNote}</p>}
            <Calculator
              dict={dict.calculator}
              initialPrice={s?.priceFrom ? Math.round(s.priceFrom / 1000) * 1000 : undefined}
              minDown={project.minDownPayment ?? 20}
              maxMonths={project.maxInstallmentMonths ?? 36}
              project={project.id}
            />
          </div>
        </section>
      )}

      {project.progress && project.progress.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead title={dict.project.progress} />
            <ol className="timeline">
              {[...project.progress]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((p) => (
                  <li key={p.id} className="timeline__item">
                    <div className="timeline__head">
                      <time dateTime={p.date}>{formatDate(p.date, locale)}</time>
                      {p.title && <h3>{p.title}</h3>}
                      {p.percent != null && (
                        <div className="progress" aria-label={`${dict.project.readiness} ${p.percent}%`}>
                          <span style={{ width: `${p.percent}%` }} />
                          <em>{p.percent}%</em>
                        </div>
                      )}
                    </div>
                    {p.photos && p.photos.length > 0 && (
                      <div className="timeline__photos">
                        {p.photos.map((photo, i) => (
                          <Img key={i} media={photo} size="thumb" className="timeline__photo" sizes="200px" />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
            </ol>
          </div>
        </section>
      )}

      {project.lat && project.lng && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.project.location} lead={project.address ?? undefined} />
            <div className="map">
              <iframe
                title={project.title}
                src={`https://maps.google.com/maps?q=${project.lat},${project.lng}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      )}

      <CtaSection locale={locale} dict={dict} hidden={{ type: 'consultation', project: project.id }} />
    </>
  )
}
