import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Where } from 'payload'

import { ApartmentCard } from '@/components/Cards'
import { CtaSection } from '@/components/CtaSection'
import { LeadButton } from '@/components/LeadModal'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'
import { getProjects } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

type SearchParams = Record<string, string | string[] | undefined>
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }

const PER_PAGE = 12
const sorts = ['price', '-price', 'area', '-area', 'floor'] as const
const roomOptions = ['0', '1', '2', '3'] as const

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : [])
const num = (v: string) => {
  const n = Number(v)
  return v !== '' && Number.isFinite(n) ? n : undefined
}

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
    rooms: many(sp.rooms).filter((r) => (roomOptions as readonly string[]).includes(r)),
    priceFrom: one(sp.priceFrom),
    priceTo: one(sp.priceTo),
    areaFrom: one(sp.areaFrom),
    areaTo: one(sp.areaTo),
    floorFrom: one(sp.floorFrom),
    floorTo: one(sp.floorTo),
    available: one(sp.available) === '1',
    promo: one(sp.promo) === '1',
    sort: (sorts as readonly string[]).includes(one(sp.sort)) ? one(sp.sort) : 'price',
    page: Math.max(1, Number(one(sp.page)) || 1),
  }

  const and: Where[] = [
    filters.available ? { status: { equals: 'available' } } : { status: { not_equals: 'sold' } },
  ]
  if (num(filters.project)) and.push({ project: { equals: num(filters.project) } })
  if (filters.promo) and.push({ promo: { equals: true } })
  if (filters.rooms.length) {
    and.push({
      or: filters.rooms.map((r) => (r === '3' ? { rooms: { greater_than_equal: 3 } } : { rooms: { equals: Number(r) } })),
    })
  }
  const range = (field: string, from?: number, to?: number) => {
    if (from !== undefined) and.push({ [field]: { greater_than_equal: from } })
    if (to !== undefined) and.push({ [field]: { less_than_equal: to } })
  }
  range('price', num(filters.priceFrom), num(filters.priceTo))
  range('area', num(filters.areaFrom), num(filters.areaTo))
  range('floor', num(filters.floorFrom), num(filters.floorTo))

  const payload = await getPayloadClient()
  const [result, projects] = await Promise.all([
    payload.find({
      collection: 'apartments',
      locale,
      depth: 1,
      limit: PER_PAGE,
      page: filters.page,
      sort: filters.sort,
      where: { and },
    }),
    getProjects(locale),
  ])

  const pageHref = (page: number) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) for (const item of many(v)) if (k !== 'page') q.append(k, item)
    if (page > 1) q.set('page', String(page))
    const s = q.toString()
    return `/${locale}/apartments${s ? `?${s}` : ''}`
  }

  const c = dict.catalog
  return (
    <>
      <PageHero title={c.title} lead={c.lead} crumbs={[{ href: `/${locale}`, label: dict.common.breadcrumbsHome }]} />
      <section className="section section--tight">
        <div className="container catalog">
          <form className="filters" method="get" action={`/${locale}/apartments`}>
            <label className="field">
              <span className="field__label">{c.project}</span>
              <select name="project" defaultValue={filters.project}>
                <option value="">{c.any}</option>
                {projects
                  .filter((p) => p.status !== 'completed')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
            </label>

            <fieldset className="filters__rooms">
              <legend className="field__label">{c.rooms}</legend>
              {roomOptions.map((r) => (
                <label key={r} className="chip">
                  <input type="checkbox" name="rooms" value={r} defaultChecked={filters.rooms.includes(r)} />
                  <span>{r === '0' ? dict.common.studio : r === '3' ? '3+' : r}</span>
                </label>
              ))}
            </fieldset>

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
            <label className="field">
              <span className="field__label">{c.sort}</span>
              <select name="sort" defaultValue={filters.sort}>
                {sorts.map((s) => (
                  <option key={s} value={s}>
                    {c.sortOptions[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" name="available" value="1" defaultChecked={filters.available} />
              <span>{c.onlyAvailable}</span>
            </label>
            <div className="filters__actions">
              <button type="submit" className="btn btn--accent btn--block">
                {c.apply}
              </button>
              <Link href={`/${locale}/apartments`} className="btn btn--outline btn--block">
                {c.reset}
              </Link>
            </div>
          </form>

          <div className="catalog__results">
            <p className="catalog__count">
              {c.found}: <strong>{result.totalDocs}</strong>
            </p>
            {result.docs.length > 0 ? (
              <div className="grid grid--3">
                {result.docs.map((a) => (
                  <ApartmentCard key={a.id} apartment={a} locale={locale} dict={dict} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <p>{c.empty}</p>
                <LeadButton type="consultation">{dict.common.consultation}</LeadButton>
              </div>
            )}
            {result.totalPages > 1 && (
              <nav className="pagination" aria-label={c.page}>
                {result.hasPrevPage && (
                  <Link href={pageHref(result.page! - 1)} className="pagination__item" rel="prev">
                    ← {c.prev}
                  </Link>
                )}
                {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={pageHref(p)} className={`pagination__item ${p === result.page ? 'is-active' : ''}`}>
                    {p}
                  </Link>
                ))}
                {result.hasNextPage && (
                  <Link href={pageHref(result.page! + 1)} className="pagination__item" rel="next">
                    {c.next} →
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </section>
      <CtaSection locale={locale} dict={dict} />
    </>
  )
}
