import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { apartmentFacts } from '@/components/Cards'
import { CompareButton } from '@/components/CompareButton'
import { CompareSync } from '@/components/CompareSync'
import { Img } from '@/components/Img'
import { PageHero } from '@/components/Section'
import { getDictionary } from '@/i18n'
import { isLocale } from '@/i18n/config'
import { formatNumber, formatPrice } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ ids?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  return { ...buildMetadata({ locale, path: '/compare', title: dict.compare.title, description: dict.compare.lead }), robots: { index: false } }
}

export default async function ComparePage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const { ids: idsParam } = await searchParams

  const ids = [...new Set((idsParam ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 4)

  const payload = await getPayloadClient()
  const found = ids.length
    ? (await payload.find({ collection: 'apartments', locale, depth: 1, limit: 4, where: { id: { in: ids } } })).docs
    : []
  // сохраняем порядок добавления
  const apartments = ids.map((id) => found.find((a) => a.id === id)).filter((a): a is (typeof found)[number] => !!a)

  type Row = { label: string; values: string[]; same: boolean }
  const row = (label: string, values: string[]): Row => ({ label, values, same: new Set(values).size <= 1 })
  const dash = '—'

  const rows: Row[] = apartments.length
    ? [
        row(dict.common.price, apartments.map((a) => formatPrice(a.price, locale))),
        row(dict.apartment.pricePerSqm, apartments.map((a) => (a.pricePerSqm ? formatPrice(a.pricePerSqm, locale) : dash))),
        row(dict.apartment.discount, apartments.map((a) => (apartmentFacts(a, dict).discount ? `−${apartmentFacts(a, dict).discount}%` : dash))),
        row(dict.common.area, apartments.map((a) => `${formatNumber(a.area, locale)} ${dict.common.sqm}`)),
        row(dict.common.rooms, apartments.map((a) => (a.rooms === 0 ? dict.common.studio : String(a.rooms)))),
        row(
          dict.common.floor,
          apartments.map((a) => {
            const p = typeof a.project === 'object' ? a.project : null
            return p?.floors ? dict.apartment.floorOf(a.floor, p.floors) : String(a.floor)
          }),
        ),
        row(dict.apartment.building, apartments.map((a) => a.building || dash)),
        row(dict.apartment.finish, apartments.map((a) => (a.finish ? dict.catalog.finishOptions[a.finish] : dash))),
        row(dict.common.view, apartments.map((a) => (a.view?.length ? a.view.map((v) => dict.views[v]).join(', ') : dash))),
        row(dict.apartment.features, apartments.map((a) => (a.features?.length ? a.features.map((f) => dict.catalog.featureOptions[f]).join(', ') : dash))),
        row(dict.common.completion, apartments.map((a) => (typeof a.project === 'object' && a.project?.completion) || dash)),
        row('', apartments.map((a) => dict.statuses.apartment[a.status])),
      ]
    : []

  return (
    <>
      <CompareSync current={ids.join(',')} />
      <PageHero
        title={dict.compare.title}
        lead={dict.compare.lead}
        crumbs={[
          { href: `/${locale}`, label: dict.common.breadcrumbsHome },
          { href: `/${locale}/apartments`, label: dict.nav.apartments },
        ]}
      />
      <section className="section section--tight">
        <div className="container">
          {apartments.length === 0 ? (
            <div className="empty">
              <p>{dict.compare.empty}</p>
              <Link href={`/${locale}/apartments`} className="btn btn--accent">
                {dict.compare.toCatalog}
              </Link>
            </div>
          ) : (
            <div className="cmp-wrap panel">
              <input type="checkbox" id="cmp-onlydiff" className="visually-hidden" />
              <label htmlFor="cmp-onlydiff" className="cmp-toggle">
                <span /> {dict.compare.onlyDiff}
              </label>
              <div className="cmp-scroll">
                <table className="cmp-table">
                  <thead>
                    <tr>
                      <th />
                      {apartments.map((a) => {
                        const project = typeof a.project === 'object' ? a.project : null
                        return (
                          <th key={a.id}>
                            <div className="cmp-card">
                              <div className="cmp-card__plan">
                                <Img media={a.plan} alt={dict.apartment.plan} size="card" sizes="260px" zoom />
                              </div>
                              <Link href={`/${locale}/apartments/${a.id}`} className="cmp-card__title">
                                {dict.apartment.title(a.rooms, a.area)}
                              </Link>
                              {project && <span className="cmp-card__project">{project.title}</span>}
                              <CompareButton id={a.id} labels={dict.compare} className="cmp-btn--inline" />
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={r.same ? 'cmp-row--same' : ''}>
                        <th scope="row">{r.label}</th>
                        {r.values.map((v, j) => (
                          <td key={j}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
