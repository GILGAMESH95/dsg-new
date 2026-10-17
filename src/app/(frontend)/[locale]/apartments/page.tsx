import type { Metadata } from 'next'
import Link from 'next/link'
import { BuildingIcon, CheckIcon, FlameIcon, LayersIcon, WaveIcon } from '@/components/icons'
import { LiveFilters } from '@/components/LiveFilters'
import { notFound } from 'next/navigation'
import type { Where } from 'payload'
import { Suspense } from 'react'

import { AutoSubmitSelect } from '@/components/AutoSubmitSelect'
import { ApartmentCard, ApartmentRow } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { UiSelect } from '@/components/ui/Select'
import { RangeField } from '@/components/RangeField'
import { LeadButton } from '@/components/LeadModal'
import { SavedSearches } from '@/components/SavedSearches'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { featureValues, finishValues } from '@/lib/apartmentOptions'
import { getPayloadClient } from '@/lib/payload'
import { getProjects } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type SearchParams = Record<string, string | string[] | undefined>
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }

const STEP = 12
const MAX_SHOWN = 240
const sorts = ['price', '-price', 'area', '-area', 'floor'] as const
const roomOptions = ['0', '1', '2', '3', '4'] as const
const viewOptions = ['sea', 'mountains', 'city'] as const

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : [])
const num = (v: string) => {
  const n = Number(v)
  return v !== '' && Number.isFinite(n) ? n : undefined
}
const pick = <T extends string>(values: string[], allowed: readonly T[]) =>
  values.filter((v): v is T => (allowed as readonly string[]).includes(v))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  const sp = await searchParams
  return {
    ...buildMetadata({ locale, path: '/apartments', title: dict.catalog.title, description: dict.catalog.lead }),
    // Страницы с фильтрами не индексируем, чтобы не плодить дубли
    robots: Object.keys(sp).length > 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function ApartmentsPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const sp = await searchParams

  const filters = {
    project: one(sp.project),
    rooms: pick(many(sp.rooms), roomOptions),
    priceFrom: one(sp.priceFrom),
    priceTo: one(sp.priceTo),
    areaFrom: one(sp.areaFrom),
    areaTo: one(sp.areaTo),
    floorFrom: one(sp.floorFrom),
    floorTo: one(sp.floorTo),
    finish: pick(many(sp.finish), finishValues),
    features: pick(many(sp.features), featureValues),
    view: pick(many(sp.view), viewOptions),
    available: one(sp.available) === '1',
    discount: one(sp.discount) === '1',
    trim: one(sp.trim) === '1',
    hasView: one(sp.hasView) === '1',
    tab: one(sp.tab) === 'layouts' ? 'layouts' : 'all',
    sort: (sorts as readonly string[]).includes(one(sp.sort)) ? one(sp.sort) : 'price',
    mode: one(sp.mode) === 'list' ? 'list' : 'tile',
    shown: Math.min(MAX_SHOWN, Math.max(STEP, Math.round(Number(one(sp.shown))) || STEP)),
  }

  const and: Where[] = [
    filters.available ? { status: { equals: 'available' } } : { status: { not_equals: 'sold' } },
  ]
  if (num(filters.project)) and.push({ project: { equals: num(filters.project) } })
  if (filters.discount) and.push({ or: [{ promo: { equals: true } }, { oldPrice: { greater_than: 0 } }] })
  if (filters.rooms.length) {
    and.push({
      or: filters.rooms.map((r) => (r === '4' ? { rooms: { greater_than_equal: 4 } } : { rooms: { equals: Number(r) } })),
    })
  }
  if (filters.finish.length) and.push({ finish: { in: filters.finish } })
  if (filters.trim) and.push({ finish: { in: ['whiteFrame', 'renovated', 'furnished'] } })
  if (filters.hasView) and.push({ view: { in: [...viewOptions] } })
  if (filters.view.length) and.push({ view: { in: filters.view } })
  const range = (field: string, from?: number, to?: number) => {
    if (from !== undefined) and.push({ [field]: { greater_than_equal: from } })
    if (to !== undefined) and.push({ [field]: { less_than_equal: to } })
  }
  range('price', num(filters.priceFrom), num(filters.priceTo))
  range('area', num(filters.areaFrom), num(filters.areaTo))
  range('floor', num(filters.floorFrom), num(filters.floorTo))

  const payload = await getPayloadClient()

  // Несколько особенностей = квартира должна иметь все: пересекаем id по каждой
  if (filters.features.length > 0) {
    const idSets = await Promise.all(
      filters.features.map(async (f) => {
        const { docs } = await payload.find({
          collection: 'apartments',
          where: { features: { equals: f } },
          select: {},
          depth: 0,
          limit: 0,
          pagination: false,
        })
        return new Set(docs.map((d) => d.id))
      }),
    )
    const ids = [...idSets[0]].filter((id) => idSets.every((s) => s.has(id)))
    and.push({ id: { in: ids.length ? ids : [0] } })
  }

  // Границы ползунков — по всем квартирам в продаже
  const bounds = await payload.find({
    collection: 'apartments',
    where: { status: { not_equals: 'sold' } },
    select: { price: true, area: true },
    depth: 0,
    limit: 0,
    pagination: false,
  })
  const prices = bounds.docs.map((d) => d.price).filter((n): n is number => typeof n === 'number')
  const areas = bounds.docs.map((d) => d.area).filter((n): n is number => typeof n === 'number')
  const priceRange = prices.length ? { min: Math.floor(Math.min(...prices) / 1000) * 1000, max: Math.ceil(Math.max(...prices) / 1000) * 1000 } : null
  const areaRange = areas.length ? { min: Math.floor(Math.min(...areas)), max: Math.ceil(Math.max(...areas)) } : null

  const [result, projects] = await Promise.all([
    payload.find({
      collection: 'apartments',
      locale,
      depth: 1,
      limit: filters.tab === 'layouts' ? 0 : filters.shown,
      pagination: filters.tab !== 'layouts',
      sort: filters.sort,
      where: { and },
    }),
    getProjects(locale),
  ])

  // Вкладка «Виды планировок»: одинаковые по комплексу, комнатности и площади квартиры сворачиваем в одну плитку
  const groups = new Map<string, { apartment: (typeof result.docs)[number]; count: number }>()
  for (const a of result.docs) {
    const pid = typeof a.project === 'object' ? a.project?.id : a.project
    const key = `${pid}|${a.rooms}|${Math.round(a.area)}`
    const g = groups.get(key)
    if (!g) groups.set(key, { apartment: a, count: 1 })
    else {
      g.count += 1
      if (a.price < g.apartment.price) g.apartment = a
    }
  }
  const layoutGroups = [...groups.values()]
  // Для счётчиков во вкладках считаем виды планировок по всем найденным квартирам
  let layoutsCount = layoutGroups.length
  if (filters.tab !== 'layouts') {
    const all = await payload.find({ collection: 'apartments', where: { and }, select: { project: true, rooms: true, area: true }, depth: 0, limit: 0, pagination: false })
    layoutsCount = new Set(all.docs.map((a) => `${a.project}|${a.rooms}|${Math.round(a.area)}`)).size
  }
  const allCount = filters.tab === 'layouts' ? layoutGroups.reduce((n, g) => n + g.count, 0) : result.totalDocs

  /** Ссылка с текущими фильтрами и изменёнными параметрами */
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) for (const item of many(v)) q.append(k, item)
    for (const [k, v] of Object.entries(patch)) {
      q.delete(k)
      if (v) q.set(k, v)
    }
    const s = q.toString()
    return `/${locale}/apartments${s ? `?${s}` : ''}`
  }

  const c = dict.catalog
  const advancedActive =
    filters.finish.length > 0 ||
    filters.features.length > 0 ||
    filters.view.length > 0 ||
    !!(filters.floorFrom || filters.floorTo) ||
    filters.available ||
    filters.discount ||
    filters.trim ||
    filters.hasView

  const hasFilters = Boolean(
    filters.project ||
      filters.rooms.length ||
      filters.priceFrom ||
      filters.priceTo ||
      filters.areaFrom ||
      filters.areaTo ||
      advancedActive,
  )
  const projectTitle = projects.find((p) => String(p.id) === filters.project)?.title
  const summary = [
    projectTitle,
    filters.rooms.length ? filters.rooms.map((r) => (r === '0' ? dict.common.studio : r === '4' ? '4+' : r)).join(', ') : null,
    filters.priceFrom || filters.priceTo ? `$${filters.priceFrom || '0'}–${filters.priceTo || '∞'}` : null,
    filters.areaFrom || filters.areaTo ? `${filters.areaFrom || '0'}–${filters.areaTo || '∞'} ${dict.common.sqm}` : null,
    ...filters.finish.map((f) => c.finishOptions[f]),
    ...filters.features.map((f) => c.featureOptions[f]),
    ...filters.view.map((v) => dict.views[v]),
    filters.discount ? c.onlyDiscount : null,
    filters.available ? c.onlyAvailable : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const chip = (name: string, value: string, label: string, checked: boolean) => (
    <label key={`${name}-${value}`} className="chip">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  )

  const tileFeatures = ['twoLevel', 'panoramic', 'corner']
  const tile = (name: string, value: string, label: string, icon: React.ReactNode, checked: boolean) => (
    <label key={`${name}-${value}`} className="tile-check">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} />
      <span className="tile-check__icon">{icon}</span>
      <span className="tile-check__label">{label}</span>
      <i aria-hidden />
    </label>
  )

  return (
    <>
      <PageHero title={c.title} lead={c.lead} crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]} />
      <section className="section section--tight">
        <div className="container">
          <form id="catalog-form" className="panel cat-filters" method="get" action={`/${locale}/apartments`}>
            <input type="hidden" name="mode" value={filters.mode} />
            {filters.tab === 'layouts' && <input type="hidden" name="tab" value="layouts" />}
            <LiveFilters />
            <div className="cat-filters__main">
              <div className="field">
                <span className="field__label">{c.project}</span>
                <UiSelect
                  name="project"
                  defaultValue={filters.project}
                  ariaLabel={c.project}
                  options={[
                    { value: '', label: c.any },
                    ...projects.filter((p) => p.status !== 'completed').map((p) => ({ value: String(p.id), label: p.title })),
                  ]}
                />
              </div>

              <fieldset className="filters__rooms">
                <legend className="field__label">{c.rooms}</legend>
                {roomOptions.map((r) =>
                  chip('rooms', r, r === '0' ? dict.common.studio : r === '4' ? '4+' : r, filters.rooms.includes(r)),
                )}
              </fieldset>

              {priceRange && priceRange.max > priceRange.min ? (
                <RangeField label={c.price} nameFrom="priceFrom" nameTo="priceTo" min={priceRange.min} max={priceRange.max} step={1000} initialFrom={num(filters.priceFrom)} initialTo={num(filters.priceTo)} unit="$" />
              ) : (
              <div className="filters__pair">
                <label className="field">
                  <span className="field__label">{c.priceFrom}</span>
                  <input type="number" name="priceFrom" min={0} step={1000} defaultValue={filters.priceFrom} inputMode="numeric" />
                </label>
                <label className="field">
                  <span className="field__label">{c.priceTo}</span>
                  <input type="number" name="priceTo" min={0} step={1000} defaultValue={filters.priceTo} inputMode="numeric" />
                </label>
              </div>
              )}
              {areaRange && areaRange.max > areaRange.min ? (
                <RangeField label={c.area} nameFrom="areaFrom" nameTo="areaTo" min={areaRange.min} max={areaRange.max} step={1} initialFrom={num(filters.areaFrom)} initialTo={num(filters.areaTo)} unit={dict.common.sqm} />
              ) : (
              <div className="filters__pair">
                <label className="field">
                  <span className="field__label">{c.areaFrom}</span>
                  <input type="number" name="areaFrom" min={0} defaultValue={filters.areaFrom} inputMode="numeric" />
                </label>
                <label className="field">
                  <span className="field__label">{c.areaTo}</span>
                  <input type="number" name="areaTo" min={0} defaultValue={filters.areaTo} inputMode="numeric" />
                </label>
              </div>
              )}
            </div>

            <div className="cat-switches">
              <label className="switch">
                <input type="checkbox" name="trim" value="1" defaultChecked={filters.trim} />
                <i aria-hidden />
                <span>{c.withFinish}</span>
              </label>
              <label className="switch">
                <input type="checkbox" name="hasView" value="1" defaultChecked={filters.hasView} />
                <i aria-hidden />
                <span>{c.viewApartment}</span>
              </label>
            </div>

            <div className="cat-tiles">
              <div>
                <span className="field__label">{c.offers}</span>
                <div className="cat-tiles__row">
                  {tile('discount', '1', c.onlyDiscount, <FlameIcon />, filters.discount)}
                  {tile('available', '1', c.onlyAvailable, <CheckIcon />, filters.available)}
                </div>
              </div>
              <div>
                <span className="field__label">{c.planAdvantages}</span>
                <div className="cat-tiles__row">
                  {tile('features', 'twoLevel', c.featureOptions.twoLevel, <LayersIcon />, filters.features.includes('twoLevel'))}
                  {tile('features', 'panoramic', c.featureOptions.panoramic, <WaveIcon />, filters.features.includes('panoramic'))}
                  {tile('features', 'corner', c.featureOptions.corner, <BuildingIcon />, filters.features.includes('corner'))}
                </div>
              </div>
            </div>

            <details className="cat-filters__more" open={advancedActive}>
              <summary>{c.allFilters}</summary>
              <div className="cat-filters__grid">
                <div className="filters__pair">
                  <label className="field">
                    <span className="field__label">{c.floorFrom}</span>
                    <input type="number" name="floorFrom" min={1} defaultValue={filters.floorFrom} inputMode="numeric" />
                  </label>
                  <label className="field">
                    <span className="field__label">{c.floorTo}</span>
                    <input type="number" name="floorTo" min={1} defaultValue={filters.floorTo} inputMode="numeric" />
                  </label>
                </div>
                <fieldset className="filters__rooms">
                  <legend className="field__label">{c.finish}</legend>
                  {finishValues.map((f) => chip('finish', f, c.finishOptions[f], filters.finish.includes(f)))}
                </fieldset>
                <fieldset className="filters__rooms">
                  <legend className="field__label">{c.views}</legend>
                  {viewOptions.map((v) => chip('view', v, dict.views[v], filters.view.includes(v)))}
                </fieldset>
                <fieldset className="filters__rooms cat-filters__wide">
                  <legend className="field__label">{c.features}</legend>
                  {featureValues.filter((f) => !tileFeatures.includes(f)).map((f) => chip('features', f, c.featureOptions[f], filters.features.includes(f)))}
                </fieldset>
              </div>
            </details>

            <div className="cat-filters__actions">
              <button type="submit" className="btn btn--accent">
                {c.apply}
              </button>
              <Link href={`/${locale}/apartments`} className="btn btn--ghost" data-reset>
                {c.reset}
              </Link>
              <Suspense fallback={null}>
                <SavedSearches locale={locale} summary={summary} hasFilters={hasFilters} labels={dict.savedSearch} />
              </Suspense>
            </div>

            <div className="cat-toolbar">
              <div className="cat-tabs" role="tablist">
                <Link href={href({ tab: undefined, shown: undefined })} role="tab" aria-selected={filters.tab === 'all'} className={filters.tab === 'all' ? 'is-active' : ''} scroll={false}>
                  {c.tabAll} <em>{allCount}</em>
                </Link>
                <Link href={href({ tab: 'layouts', shown: undefined })} role="tab" aria-selected={filters.tab === 'layouts'} className={filters.tab === 'layouts' ? 'is-active' : ''} scroll={false}>
                  {c.tabLayouts} <em>{layoutsCount}</em>
                </Link>
              </div>
              <div className="cat-toolbar__right">
                <AutoSubmitSelect
                  name="sort"
                  defaultValue={filters.sort}
                  label={c.sort}
                  options={sorts.map((s) => ({ value: s, label: c.sortOptions[s] }))}
                />
                <div className="view-toggle" role="group" aria-label={c.viewTile + ' / ' + c.viewList}>
                  <Link href={href({ mode: undefined })} className={filters.mode === 'tile' ? 'is-active' : ''} aria-current={filters.mode === 'tile'}>
                    {c.viewTile}
                  </Link>
                  <Link href={href({ mode: 'list' })} className={filters.mode === 'list' ? 'is-active' : ''} aria-current={filters.mode === 'list'}>
                    {c.viewList}
                  </Link>
                </div>
              </div>
            </div>
          </form>

          {filters.tab === 'layouts' && layoutGroups.length > 0 ? (
            <div className="grid grid--4">
              {layoutGroups.map((g) => (
                <ApartmentCard key={g.apartment.id} apartment={g.apartment} locale={locale} dict={dict} groupCount={g.count} groupLabel={c.groupCount(g.count)} />
              ))}
            </div>
          ) : result.docs.length > 0 ? (
            filters.mode === 'list' ? (
              <div className="apt-list">
                {result.docs.map((a) => (
                  <ApartmentRow key={a.id} apartment={a} locale={locale} dict={dict} />
                ))}
              </div>
            ) : (
              <div className="grid grid--4">
                {result.docs.map((a) => (
                  <ApartmentCard key={a.id} apartment={a} locale={locale} dict={dict} />
                ))}
              </div>
            )
          ) : (
            <div className="empty">
              <p>{c.empty}</p>
              <LeadButton type="consultation">{dict.common.consultation}</LeadButton>
            </div>
          )}

          {filters.tab !== 'layouts' && result.totalDocs > result.docs.length && filters.shown < MAX_SHOWN && (
            <div className="news-more">
              <p className="catalog__count">
                {c.shown} {result.docs.length} {c.of} {result.totalDocs}
              </p>
              <Link href={href({ shown: String(filters.shown + STEP) })} scroll={false} className="btn btn--ghost">
                {dict.blog.showMore}
              </Link>
            </div>
          )}
        </div>
      </section>
      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
