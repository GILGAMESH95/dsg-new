import { Fragment } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import type { Project } from '@/payload-types'

import { formatPrice } from '@/lib/format'
import { mediaUrl } from '@/lib/media'

import { ProjectCard } from './Cards'
import { ProjectFilter, type MapItem } from './ProjectFilter'

const yearOf = (p: Project) => p.completion?.match(/\d{4}/)?.[0] ?? ''

/** Сетка карточек ЖК с фильтрами по статусу и году сдачи */
export function ProjectGrid({
  projects,
  locale,
  dict,
  stats,
  cols = 3,
  extra,
  pageSize,
}: {
  projects: Project[]
  locale: Locale
  dict: Dictionary
  stats: Record<number, { priceFrom: number | null; available: number }>
  cols?: 2 | 3
  /** Рекламная плитка внутри сетки (скрывается при включённых фильтрах) */
  extra?: React.ReactNode
  /** Показывать сразу столько карточек, остальные — по кнопке «Показать ещё» */
  pageSize?: number
}) {
  const statuses = [...new Set(projects.map((p) => p.status))].map((value) => ({
    value,
    label: dict.statuses.project[value],
  }))
  const years = [...new Set(projects.map(yearOf).filter(Boolean))].sort()

  const mapItems: MapItem[] = projects.flatMap((p) =>
    p.lat != null && p.lng != null
      ? [
          {
            id: p.id,
            href: `/${locale}/projects/${p.slug}`,
            title: p.title,
            subtitle: p.district ?? p.address,
            priceLabel: stats[p.id]?.priceFrom ? `${dict.common.from} ${formatPrice(stats[p.id]!.priceFrom, locale)}` : null,
            imageUrl: mediaUrl(p.cover, 'card'),
            statusLabel: dict.statuses.project[p.status],
            lat: p.lat,
            lng: p.lng,
            status: p.status,
            year: yearOf(p),
          },
        ]
      : [],
  )

  return (
    <ProjectFilter
      statuses={statuses}
      years={years}
      prices={Object.values(stats).map((s) => s.priceFrom).filter((n): n is number => n != null)}
      priceUnit="₾"
      labels={{ ...dict.filters, more: dict.blog.showMore }}
      pageSize={pageSize}
      mapItems={mapItems}
      mapLabels={{ list: dict.filters.list, map: dict.filters.onMap, open: dict.common.more }}
    >
      <div className={`grid grid--${cols}`}>
        {projects.map((p, i) => (
          <Fragment key={p.id}>
            <div data-status={p.status} data-year={yearOf(p)} data-price={stats[p.id]?.priceFrom ?? undefined} className="filter-item">
              <ProjectCard
                project={p}
                locale={locale}
                dict={dict}
                priceFrom={stats[p.id]?.priceFrom}
                available={stats[p.id]?.available}
              />
            </div>
            {/* Рекламная плитка занимает шестое место в сетке, как у fsk.ru (или последнее, если проектов меньше) */}
            {extra && i === Math.min(4, projects.length - 1) && (
              <div data-status="__extra" data-year="__extra" className="filter-item">
                {extra}
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </ProjectFilter>
  )
}
