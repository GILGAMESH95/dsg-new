import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ApartmentCard, PostCard, ProjectCard } from '@/components/Cards'
import { Calculator } from '@/components/Calculator'
import { CtaSection } from '@/components/CtaSection'
import { HeroSlides } from '@/components/HeroSlides'
import {
  ArrowIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  FileIcon,
  LayersIcon,
  PinIcon,
  PlayIcon,
  WaveIcon,
} from '@/components/icons'
import { Img } from '@/components/Img'
import { LeadButton } from '@/components/LeadModal'
import { LivingSlider } from '@/components/LivingSlider'
import { InfraMap } from '@/components/InfraMap'
import { LocationTabs } from '@/components/LocationTabs'
import { Masterplan, type MasterplanBuilding } from '@/components/Masterplan'
import { ScrollStrip } from '@/components/ScrollStrip'
import { SubscribeForm } from '@/components/SubscribeForm'
import { ProjectGallery } from '@/components/ProjectGallery'
import { ProjectLayouts, type LayoutItem } from '@/components/ProjectLayouts'
import { ProjectNav } from '@/components/ProjectNav'
import { RichText } from '@/components/RichText'
import { Breadcrumbs, SectionHead } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { formatDate, formatGel, formatPrice } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { getLatestPosts, getPaymentMethods, getProjectBySlug, getProjects, getProjectStats } from '@/lib/queries'
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
  const [apartments, stats, methods, promos, allProjects, settings, posts] = await Promise.all([
    payload.find({
      collection: 'apartments',
      locale,
      depth: 1,
      limit: 8,
      sort: 'price',
      where: { project: { equals: project.id }, status: { equals: 'available' } },
    }),
    getProjectStats(),
    getPaymentMethods(locale),
    payload.find({
      collection: 'promotions',
      locale,
      depth: 0,
      limit: 4,
      sort: 'order',
      where: { project: { equals: project.id }, active: { equals: true } },
    }),
    getProjects(locale),
    getSettings(locale),
    getLatestPosts(locale, 8),
  ])
  const s = stats[project.id]
  const arrows = { prev: dict.project.prev, next: dict.project.next }
  const presentation = typeof project.presentation === 'object' ? project.presentation : null

  const heroSlides = [project.cover, ...(project.gallery ?? []).slice(0, 4).map((g) => g.image)]
    .map((m, i) => ({ url: mediaUrl(m, 'hero'), alt: `${project.title} ${i + 1}` }))
    .filter((h): h is { url: string; alt: string } => !!h.url)
    .filter((h, i, all) => all.findIndex((x) => x.url === h.url) === i)
  const otherProjects = allProjects.filter((p) => p.id !== project.id).slice(0, 3)
  const apartmentsHref = `/${locale}/apartments?project=${project.id}`

  const factIcons = { floors: LayersIcon, buildings: BuildingIcon, completion: CalendarIcon, sea: WaveIcon }
  const facts = [
    project.floors && { icon: 'floors' as const, label: dict.project.factFloors, value: String(project.floors) },
    project.buildings?.length && { icon: 'buildings' as const, label: dict.project.factBuildings, value: String(project.buildings.length) },
    project.completion && { icon: 'completion' as const, label: dict.project.factCompletion, value: project.completion },
    project.distanceToSea && { icon: 'sea' as const, label: dict.project.factToSea, value: `${project.distanceToSea} ${dict.common.meters}` },
  ].filter(Boolean) as { icon: keyof typeof factIcons; label: string; value: string }[]

  const layoutItems: LayoutItem[] = (project.layouts ?? []).map((l, i) => ({
    id: l.id ?? String(i),
    rooms: l.rooms,
    area: l.area,
    building: l.building,
    planUrl: mediaUrl(l.plan, 'card'),
    planFullUrl: mediaUrl(l.plan, 'hero'),
    roomsLabel: dict.common.roomsShort(l.rooms),
    priceLabel: l.priceFromGelPerSqm
      ? `${dict.common.from} ${formatGel(l.priceFromGelPerSqm, locale)} / ${dict.common.sqm}`
      : l.priceFrom
        ? `${dict.common.from} ${formatPrice(l.priceFrom, locale)}`
        : undefined,
  }))

  const galleryItems = (project.gallery ?? [])
    .map((g, i) => ({
      url: mediaUrl(g.image, 'card'),
      full: mediaUrl(g.image, 'hero') ?? undefined,
      alt: `${project.title} ${i + 1}`,
      category: g.category,
    }))
    .filter((g): g is { url: string; full: string | undefined; alt: string; category: string | null | undefined } => !!g.url)

  const livingSlides = (project.livingIs ?? [])
    .filter((l) => l.text)
    .map((l) => ({
      text: l.text!,
      imageUrl: mediaUrl(l.image, 'card') ?? mediaUrl(project.cover, 'card'),
      fullUrl: mediaUrl(l.image, 'hero') ?? mediaUrl(project.cover, 'hero'),
    }))

  const buyTiles = [
    ...(promos.docs.map((p) => ({
      key: `promo-${p.id}`,
      title: p.title,
      value: p.badge,
      href: `/${locale}/promo/${p.slug ?? p.id}`,
    }))),
    ...methods.map((m) => ({
      key: `m-${m.id}`,
      title: m.title,
      value: m.terms?.[0] ? `${m.terms[0].label}: ${m.terms[0].value}` : null,
      href: `/${locale}/buy/${m.slug ?? m.id}`,
    })),
  ].slice(0, 4)

  const masterplanUrl = mediaUrl(project.masterplan, 'hero')
  const masterplanFull = masterplanUrl
  const markerBuildings: MasterplanBuilding[] = (project.buildings ?? []).flatMap((b, i) =>
    b.markerX != null && b.markerY != null
      ? [
          {
            id: b.id ?? String(i),
            name: b.name,
            x: b.markerX,
            y: b.markerY,
            completion: b.completion ? `${dict.common.completion}: ${b.completion}` : null,
            units: b.totalApartments ? dict.project.unitsCount(b.totalApartments) : null,
          },
        ]
      : [],
  )

  const standardItems =
    settings.standard && settings.standard.length > 0
      ? settings.standard.map((s) => ({ title: s.title, text: s.text ?? '' }))
      : dict.home.why.map((w) => ({ title: w.title, text: w.text }))

  const hasMap = !!(project.lat && project.lng)
  const hasOffice = !!(settings.officeLat && settings.officeLng)
  const mapFrame = (lat: number, lng: number, title: string) => (
    <div className="map-frame">
      <iframe
        title={title}
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
  const infra = project.infrastructure ?? []
  const nearbyWithPhoto = infra.filter((p) => p.image)

  const locationTabs = [
    hasMap && { id: 'map', label: dict.project.nav.location, content: mapFrame(project.lat!, project.lng!, project.title) },
    infra.length > 0 && {
      id: 'infra',
      label: dict.project.tabInfra,
      content: hasMap ? (
        <InfraMap
          center={{ lat: project.lat!, lng: project.lng!, title: project.title }}
          allLabel={dict.project.infraCats.allPlaces}
          categories={Object.keys(dict.project.infraCats)
            .filter((k) => k !== 'allPlaces' && infra.some((p) => (p.category ?? 'other') === k))
            .map((k) => ({ value: k, label: dict.project.infraCats[k]! }))}
          items={infra.map((p) => ({
            name: p.name,
            minutes: p.minutes,
            modeLabel: p.mode === 'car' ? dict.project.car : dict.project.walk,
            category: p.category ?? 'other',
            lat: p.lat,
            lng: p.lng,
          }))}
        />
      ) : (
        <>
          <ul className="infra">
            {infra.map((p, i) => (
              <li key={p.id ?? i} className="infra__item">
                <strong>{p.name}</strong>
                <span>
                  <b>{p.minutes}</b> {p.mode === 'car' ? dict.project.car : dict.project.walk}
                </span>
              </li>
            ))}
          </ul>
          {nearbyWithPhoto.length > 0 && (
            <div className="nearby">
              <h3>{dict.project.nearby}</h3>
              <ScrollStrip labels={arrows}>
                {nearbyWithPhoto.map((p, i) => (
                  <div key={p.id ?? i} className="nearby__card">
                    <Img media={p.image} alt={p.name} size="card" className="nearby__img" sizes="280px" />
                    <strong>{p.name}</strong>
                    <span>
                      {p.minutes} {p.mode === 'car' ? dict.project.car : dict.project.walk}
                    </span>
                  </div>
                ))}
              </ScrollStrip>
            </div>
          )}
        </>
      ),
    },
    hasOffice && {
      id: 'office',
      label: dict.project.tabOffice,
      content: (
        <>
          {mapFrame(settings.officeLat!, settings.officeLng!, dict.project.tabOffice)}
          {settings.address && (
            <p className="map-address">
              <PinIcon width={16} height={16} /> {settings.address}
            </p>
          )}
        </>
      ),
    },
  ].filter(Boolean) as { id: string; label: string; content: React.ReactNode }[]

  const navItems = [
    { id: 'about', label: dict.project.nav.about },
    project.buildings?.length ? { id: 'buildings', label: dict.project.nav.buildings } : null,
    apartments.docs.length > 0 ? { id: 'apartments', label: dict.project.nav.apartments } : null,
    layoutItems.length ? { id: 'layouts', label: dict.project.nav.layouts } : null,
    locationTabs.length ? { id: 'location', label: dict.project.nav.location } : null,
    project.progress?.length ? { id: 'progress', label: dict.project.nav.progress } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <>
      <section className="project-hero">
        {heroSlides.length > 0 ? (
          <HeroSlides slides={heroSlides} labels={arrows} />
        ) : (
          <Img media={project.cover} alt={project.title} size="hero" className="project-hero__bg" priority />
        )}
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
          <h1 className="hero__title project-hero__title">{project.title}</h1>
          {project.tagline && <p className="hero__subtitle">{project.tagline}</p>}
          {project.address && (
            <p className="project-hero__address">
              <PinIcon /> {project.address}
            </p>
          )}
          <div className="hero__actions project-hero__actions">
            <Link href={apartmentsHref} className="btn btn--accent btn--lg">
              {dict.project.chooseApartment}
            </Link>
            {s?.priceFrom ? (
              <span className="project-hero__price">
                {dict.common.from} {formatPrice(s.priceFrom, locale)}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <ProjectNav title={project.title} items={navItems} cta={{ href: apartmentsHref, label: dict.project.chooseApartment }} />

      {project.highlights && project.highlights.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.project.highlights} />
            <ul className="glance">
              {project.highlights.map((h, i) => (
                <li key={h.id ?? i}>
                  <span>0{i + 1}</span>
                  {h.text}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="about" className="section section--tight anchor">
        <div className={`container about-grid ${hasMap ? '' : 'about-grid--single'}`}>
          <div className="panel">
            <h2 className="panel__title">{dict.project.about}</h2>
            {project.excerpt && <p className="lead-text">{project.excerpt}</p>}
            <RichText data={project.description} />
            {(presentation?.url || project.videoUrl) && (
              <div className="about-actions">
                {presentation?.url && (
                  <a href={presentation.url} target="_blank" rel="noopener" className="about-actions__btn">
                    <FileIcon /> {dict.project.presentation}
                  </a>
                )}
                {project.videoUrl && (
                  <a href={project.videoUrl} target="_blank" rel="noopener" className="about-actions__btn">
                    <PlayIcon /> {dict.project.video}
                  </a>
                )}
              </div>
            )}
            {project.buildings && project.buildings.some((b) => b.completion) && (
              <div className="deadlines">
                <h3>{dict.project.deadlines}</h3>
                <ul>
                  {project.buildings
                    .filter((b) => b.completion)
                    .map((b, i) => (
                      <li key={b.id ?? i}>
                        <time>{b.completion}</time>
                        <span>{b.name}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          {hasMap && (
            <div className="panel panel--map">
              <iframe
                title={project.title}
                src={`https://maps.google.com/maps?q=${project.lat},${project.lng}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {project.address && (
                <p className="panel--map__address">
                  <PinIcon width={16} height={16} /> {project.address}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {facts.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <dl className="facts">
              {facts.map((f) => {
                const Icon = factIcons[f.icon]
                return (
                  <div key={f.label}>
                    <Icon className="facts__icon" width={28} height={28} />
                    <dd>{f.value}</dd>
                    <dt>{f.label}</dt>
                  </div>
                )
              })}
            </dl>
          </div>
        </section>
      )}

      {galleryItems.length > 0 && (
        <section id="gallery" className="section section--tight anchor">
          <div className="container">
            <div className="panel">
              <h2 className="panel__title">{dict.project.gallery}</h2>
              <ProjectGallery items={galleryItems} labels={{ all: dict.project.galleryAll, prev: dict.project.prev, next: dict.project.next }} />
            </div>
          </div>
        </section>
      )}

      {project.features && project.features.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.project.features} />
            <div className="adv" data-lb-group>
              {project.features.filter((f) => f.text || f.image).map((f, i) => (
                <div key={f.id ?? i} className={`adv__item ${f.image ? 'adv__item--photo' : ''}`}>
                  {f.image ? <Img media={f.image} alt={f.text ?? ''} size="card" className="adv__img" sizes="(max-width: 720px) 100vw, 33vw" zoom /> : <CheckIcon />}
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {buyTiles.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <div className="panel panel--glow buy-panel">
              <div className="buy-panel__text">
                <h2 className="panel__title">{dict.project.buyTitle}</h2>
                <p>{dict.project.buyLead}</p>
                <LeadButton type="consultation" project={project.id} title={`${dict.common.consultation}: ${project.title}`} className="btn btn--accent">
                  {dict.common.consultation}
                </LeadButton>
              </div>
              <div className="buy-panel__tiles">
                {buyTiles.map((t) => (
                  <Link key={t.key} href={t.href} className="buy-tile">
                    {t.value && <b>{t.value}</b>}
                    <span>{t.title}</span>
                  </Link>
                ))}
                <Link href={`/${locale}/buy`} className="buy-tile buy-tile--all">
                  {dict.project.buyAll} <ArrowIcon width={18} height={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {project.masterplan && (
        <section className="section section--tight">
          <div className="container">
            <div className="panel">
              <h2 className="panel__title">{dict.project.masterplan}</h2>
              {masterplanUrl ? (
                <Masterplan
                  imageUrl={masterplanUrl}
                  fullUrl={masterplanFull ?? masterplanUrl}
                  alt={dict.project.masterplan}
                  buildings={markerBuildings}
                  labels={{ zoom: dict.project.zoom, show: dict.project.showApartmentsShort }}
                  href={apartmentsHref}
                />
              ) : null}
            </div>
          </div>
        </section>
      )}

      {project.buildings && project.buildings.length > 0 && (
        <section id="buildings" className="section section--tight anchor">
          <div className="container">
            <SectionHead title={dict.project.buildings} />
            <div className="grid grid--3">
              {project.buildings.map((b, i) => (
                <article key={b.id ?? i} className="building-card">
                  <header>
                    <h3>{b.name}</h3>
                    {b.completion && (
                      <span className="building-card__date">
                        {dict.common.completion}: {b.completion}
                      </span>
                    )}
                    {b.totalApartments ? <span className="building-card__units">{dict.project.unitsCount(b.totalApartments)}</span> : null}
                  </header>
                  {b.types && b.types.length > 0 && (
                    <ul>
                      {b.types.map((t, j) => (
                        <li key={t.id ?? j}>
                          <span>
                            {dict.common.roomsShort(t.rooms)}
                            {t.priceFrom ? ` ${dict.common.from.toLowerCase()} ${formatPrice(t.priceFrom, locale)}` : ''}
                          </span>
                          {t.count ? <b>{t.count}</b> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={apartmentsHref} className="link-arrow">
                    {dict.project.allApartmentsInBuilding} <ArrowIcon width={18} height={18} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="apartments" className="section section--tight anchor">
        <div className="container">
          <SectionHead
            title={dict.project.apartments}
            link={apartments.totalDocs > 0 ? { href: apartmentsHref, label: `${dict.common.allApartments} (${apartments.totalDocs})` } : undefined}
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

      {layoutItems.length > 0 && (
        <section id="layouts" className="section section--tight anchor">
          <div className="container">
            <div className="panel">
              <h2 className="panel__title">{dict.project.layouts}</h2>
              <ProjectLayouts
                items={layoutItems}
                apartmentsHref={apartmentsHref}
                labels={{
                  title: dict.project.layoutsFound,
                  rooms: dict.project.filterRooms,
                  area: dict.project.filterArea,
                  reset: dict.project.filterReset,
                  empty: dict.project.noLayouts,
                  sqm: dict.common.sqm,
                  building: dict.project.layoutBuilding,
                  price: dict.common.price,
                  showApartments: dict.project.showApartments,
                }}
              />
            </div>
          </div>
        </section>
      )}

      {livingSlides.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <div className="panel panel--flush">
              <LivingSlider slides={livingSlides} prefix={dict.project.livingIs(project.title)} labels={{ prev: dict.project.prev, next: dict.project.next }} />
            </div>
          </div>
        </section>
      )}

      {locationTabs.length > 0 && (
        <section id="location" className="section section--tight anchor">
          <div className="container">
            <div className="panel">
              <h2 className="panel__title">{dict.project.infrastructure}</h2>
              <LocationTabs tabs={locationTabs} />
            </div>
          </div>
        </section>
      )}

      <section className="section section--tight">
        <div className="container">
          <div className="panel panel--glow">
            <h2 className="panel__title">{dict.project.calcTitle}</h2>
            <Calculator
              dict={dict.calculator}
              minDown={project.minDownPayment ?? 20}
              maxMonths={project.maxInstallmentMonths ?? 36}
              project={project.id}
            />
          </div>
        </div>
      </section>

      {project.progress && project.progress.length > 0 && (
        <section id="progress" className="section section--tight anchor">
          <div className="container">
            <div className="panel">
              <h2 className="panel__title">{dict.project.progress}</h2>
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
                        <div className="timeline__photos" data-lb-group>
                          {p.photos.map((photo, i) => (
                            <Img key={i} media={photo} size="thumb" className="timeline__photo" sizes="200px" zoom />
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      <section className="section section--tight">
        <div className="container">
          <div className="standard">
            <Img media={project.cover} alt="" size="hero" className="standard__bg" sizes="100vw" />
            <div className="standard__shade" />
            <div className="standard__body">
              <h2 className="panel__title">{settings.standardTitle || dict.project.standardTitle}</h2>
              <p>{dict.project.standardLead}</p>
              <ScrollStrip labels={arrows}>
                {standardItems.map((a, i) => (
                  <div key={a.title} className="standard__tile">
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <h3>{a.title}</h3>
                    {a.text && <p>{a.text}</p>}
                  </div>
                ))}
              </ScrollStrip>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="panel subscribe-panel">
            <div>
              <h2 className="panel__title">{dict.subscribe.title}</h2>
              <p>{dict.subscribe.lead}</p>
            </div>
            <SubscribeForm locale={locale} dict={dict.subscribe} project={project.id} />
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.nav.blog} link={{ href: `/${locale}/about/news`, label: dict.common.allNews }} />
            <ScrollStrip labels={arrows} className="strip--news">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} dict={dict} />
              ))}
            </ScrollStrip>
            <Link href={`/${locale}/documents`} className="docs-link">
              <FileIcon /> {dict.nav.documents} <ArrowIcon width={18} height={18} />
            </Link>
          </div>
        </section>
      )}

      {otherProjects.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <SectionHead title={dict.project.otherProjects} link={{ href: `/${locale}/projects`, label: dict.common.allProjects }} />
            <div className="grid grid--3">
              {otherProjects.map((p) => (
                <ProjectCard key={p.id} project={p} locale={locale} dict={dict} priceFrom={stats[p.id]?.priceFrom} available={stats[p.id]?.available} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaSection locale={locale} dict={dict} hidden={{ type: 'consultation', project: project.id }} />
    </>
  )
}
