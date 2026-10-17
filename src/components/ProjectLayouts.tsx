'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export type LayoutItem = {
  id: string
  rooms: number
  area: number
  building?: string | null
  priceFrom?: number | null
  planUrl: string | null
  planFullUrl?: string | null
  roomsLabel: string
  priceLabel?: string
}

type Labels = {
  title: string
  rooms: string
  area: string
  reset: string
  empty: string
  sqm: string
  building: string
  price: string
  showApartments: string
}

/** Планировки: фильтры, лента миниатюр и большая карточка выбранной планировки */
export function ProjectLayouts({
  items,
  labels,
  apartmentsHref,
}: {
  items: LayoutItem[]
  labels: Labels
  apartmentsHref: string
}) {
  const roomOptions = useMemo(
    () => [...new Map(items.map((i) => [i.rooms, i.roomsLabel])).entries()].sort((a, b) => a[0] - b[0]),
    [items],
  )
  const minArea = Math.floor(Math.min(...items.map((i) => i.area)))
  const maxArea = Math.ceil(Math.max(...items.map((i) => i.area)))

  const [rooms, setRooms] = useState<number[]>([])
  const [from, setFrom] = useState(minArea)
  const [to, setTo] = useState(maxArea)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const shown = items
    .filter((i) => (rooms.length ? rooms.includes(i.rooms) : true) && i.area >= from && i.area <= to)
    .sort((a, b) => a.area - b.area)
  const selected = shown.find((i) => i.id === selectedId) ?? shown[0]

  const dirty = rooms.length > 0 || from !== minArea || to !== maxArea
  const toggle = (r: number) => setRooms((v) => (v.includes(r) ? v.filter((x) => x !== r) : [...v, r]))
  const reset = () => {
    setRooms([])
    setFrom(minArea)
    setTo(maxArea)
  }

  return (
    <div className="layouts">
      <div className="pf layouts__pf">
        <div className="pf__fields">
          {maxArea > minArea && (
            <div className="pf__field pf__field--range">
              <span>{labels.area}</span>
              <div className="pf__range">
                <div className="pf__values">
                  <b>
                    {from} {labels.sqm}
                  </b>
                  <b>
                    {to} {labels.sqm}
                  </b>
                </div>
                <div className="pf__track">
                  <i style={{ left: `${((from - minArea) / (maxArea - minArea)) * 100}%`, right: `${100 - ((to - minArea) / (maxArea - minArea)) * 100}%` }} />
                  <input type="range" min={minArea} max={maxArea} value={from} aria-label={`${labels.area} min`} onChange={(e) => setFrom(Math.min(Number(e.target.value), to))} />
                  <input type="range" min={minArea} max={maxArea} value={to} aria-label={`${labels.area} max`} onChange={(e) => setTo(Math.max(Number(e.target.value), from))} />
                </div>
              </div>
            </div>
          )}
          <div className="pf__field">
            <span>{labels.rooms}</span>
            <div className="seg" role="group" aria-label={labels.rooms}>
              {roomOptions.map(([r, label]) => (
                <button key={r} type="button" className={rooms.includes(r) ? 'is-active' : ''} aria-pressed={rooms.includes(r)} onClick={() => toggle(r)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="button" className="pf__reset" onClick={reset} disabled={!dirty}>
          {labels.reset}
        </button>
      </div>

      <p className="layouts__count">
        {labels.title} <strong>({shown.length})</strong>
      </p>

      {shown.length === 0 || !selected ? (
        <p className="empty">{labels.empty}</p>
      ) : (
        <>
          <div className="layouts__thumbs" role="tablist">
            {shown.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={l.id === selected.id}
                className={`layouts__thumb ${l.id === selected.id ? 'is-active' : ''}`}
                onClick={() => setSelectedId(l.id)}
              >
                <span className="layouts__thumb-img">
                  {l.planUrl && <Image src={l.planUrl} alt="" fill sizes="120px" />}
                </span>
                <span>
                  {l.area} {labels.sqm}
                </span>
              </button>
            ))}
          </div>

          <article className="layout-detail">
            <div className="layout-detail__info">
              <h3>
                {selected.roomsLabel}, {selected.area} {labels.sqm}
              </h3>
              {selected.building && <p className="layout-detail__sub">{selected.building}</p>}
              <dl>
                <div>
                  <dt>{labels.area}</dt>
                  <dd>
                    {selected.area} {labels.sqm}
                  </dd>
                </div>
                {selected.building && (
                  <div>
                    <dt>{labels.building}</dt>
                    <dd>{selected.building}</dd>
                  </div>
                )}
                {selected.priceLabel && (
                  <div>
                    <dt>{labels.price}</dt>
                    <dd>{selected.priceLabel}</dd>
                  </div>
                )}
              </dl>
              <Link href={apartmentsHref} className="btn btn--accent">
                {labels.showApartments}
              </Link>
            </div>
            <div
              className={`layout-detail__plan ${selected.planUrl ? 'is-zoomable' : ''}`}
              {...(selected.planUrl
                ? {
                    'data-lb-src': selected.planFullUrl ?? selected.planUrl,
                    'data-lb-alt': `${selected.roomsLabel}, ${selected.area} ${labels.sqm}`,
                    role: 'button',
                    tabIndex: 0,
                  }
                : {})}
            >
              {selected.planUrl && (
                <Image src={selected.planUrl} alt={`${selected.roomsLabel}, ${selected.area} ${labels.sqm}`} fill sizes="(max-width: 960px) 100vw, 50vw" />
              )}
            </div>
          </article>
        </>
      )}
    </div>
  )
}
