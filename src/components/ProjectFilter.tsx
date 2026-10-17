'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { UiSelect } from './ui/Select'
import { ProjectsMap, type MapProject } from './ProjectsMap'

type Labels = { status: string; year: string; all: string; empty: string; reset: string; price: string; more?: string }
export type MapItem = MapProject & { status: string; year: string }
type MapLabels = { list: string; map: string; open: string }

/**
 * Фильтры каталога как у fsk.ru: подписи над полями, выпадающие списки,
 * двойной ползунок стоимости, «Сбросить фильтры» и оранжевая кнопка «На карте».
 * Карточки отрисованы на сервере — здесь только состояние; скрытие по data-атрибутам.
 */
export function ProjectFilter({
  statuses,
  years,
  prices,
  priceUnit,
  labels,
  mapItems = [],
  mapLabels,
  pageSize = 0,
  children,
}: {
  statuses: { value: string; label: string }[]
  years: string[]
  /** Стартовые цены «от» по всем проектам — задают границы ползунка */
  prices: number[]
  /** Валюта для подписей ползунка, например «₾» */
  priceUnit: string
  labels: Labels
  /** Проекты с координатами для режима «На карте» (если пусто — кнопка скрыта) */
  mapItems?: MapItem[]
  mapLabels?: MapLabels
  /** Сколько карточек показывать сразу; остальные открывает «Показать ещё» (0 — все) */
  pageSize?: number
  children: ReactNode
}) {
  const lo = prices.length ? Math.min(...prices) : 0
  const hi = prices.length ? Math.max(...prices) : 0
  const step = Math.max(1000, Math.round((hi - lo) / 100 / 1000) * 1000)
  const [status, setStatus] = useState('')
  const [year, setYear] = useState('')
  const [min, setMin] = useState(lo)
  const [max, setMax] = useState(hi)
  const [mode, setMode] = useState<'list' | 'map'>('list')
  const [visible, setVisible] = useState(-1)
  const [expanded, setExpanded] = useState(false)
  const [matched, setMatched] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  const priceActive = hi > lo && (min > lo || max < hi)
  const dirty = Boolean(status || year || priceActive)

  const mapVisible = useMemo(
    () => mapItems.filter((m) => (!status || m.status === status) && (!year || m.year === year)),
    [mapItems, status, year],
  )

  useEffect(() => {
    const items = Array.from(gridRef.current?.querySelectorAll<HTMLElement>('[data-status]') ?? [])
    let shown = 0
    let matches = 0
    for (const el of items) {
      const price = el.dataset.price ? Number(el.dataset.price) : null
      const okPrice = !priceActive || (price != null && price >= min && price <= max)
      const ok = (!status || el.dataset.status === status) && (!year || el.dataset.year === year) && okPrice
      const isExtra = el.dataset.status === '__extra'
      if (ok && !isExtra) matches += 1
      const show = ok && (isExtra || !pageSize || expanded || matches <= pageSize)
      el.hidden = !show
      if (show) shown += 1
    }
    setVisible(shown)
    setMatched(matches)
  }, [status, year, min, max, priceActive, pageSize, expanded])

  const reset = () => {
    setStatus('')
    setYear('')
    setMin(lo)
    setMax(hi)
  }

  const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/ /g, ' ')
  const pct = (v: number) => (hi > lo ? ((v - lo) / (hi - lo)) * 100 : 0)

  return (
    <div className="project-filter">
      <div className="pf">
        <div className="pf__fields">
          {statuses.length > 1 && (
            <div className="pf__field">
              <span>{labels.status}</span>
              <UiSelect value={status} onValueChange={setStatus} ariaLabel={labels.status} options={[{ value: '', label: labels.all }, ...statuses]} />
            </div>
          )}
          {years.length > 1 && (
            <div className="pf__field">
              <span>{labels.year}</span>
              <UiSelect value={year} onValueChange={setYear} ariaLabel={labels.year} options={[{ value: '', label: labels.all }, ...years.map((y) => ({ value: y, label: y }))]} />
            </div>
          )}
          {hi > lo && (
            <div className="pf__field pf__field--range">
              <span>{labels.price}</span>
              <div className="pf__range">
                <div className="pf__values">
                  <b>
                    {fmt(min)} {priceUnit}
                  </b>
                  <b>
                    {fmt(max)} {priceUnit}
                  </b>
                </div>
                <div className="pf__track">
                  <i style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
                  <input
                    type="range"
                    min={lo}
                    max={hi}
                    step={step}
                    value={min}
                    aria-label={`${labels.price} min`}
                    onChange={(e) => setMin(Math.min(Number(e.target.value), max))}
                  />
                  <input
                    type="range"
                    min={lo}
                    max={hi}
                    step={step}
                    value={max}
                    aria-label={`${labels.price} max`}
                    onChange={(e) => setMax(Math.max(Number(e.target.value), min))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="pf__actions">
          <button type="button" className="pf__reset" onClick={reset} disabled={!dirty}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z" />
            </svg>
            {labels.reset}
          </button>
          {mapItems.length > 0 && mapLabels && (
            <button type="button" className="pf__map" aria-pressed={mode === 'map'} onClick={() => setMode((m) => (m === 'map' ? 'list' : 'map'))}>
              {mode === 'map' ? mapLabels.list : mapLabels.map}
            </button>
          )}
        </div>
      </div>
      {mode === 'map' && mapLabels && mapVisible.length > 0 && <ProjectsMap projects={mapVisible} labels={{ open: mapLabels.open }} />}
      <div ref={gridRef} hidden={mode === 'map' && mapVisible.length > 0}>
        {children}
      </div>
      {pageSize > 0 && !expanded && matched > pageSize && labels.more && (
        <div className="pf__more">
          <button type="button" onClick={() => setExpanded(true)}>
            {labels.more}
          </button>
        </div>
      )}
      {visible === 0 && <p className="empty">{labels.empty}</p>}
    </div>
  )
}
