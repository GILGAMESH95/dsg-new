'use client'

import 'leaflet/dist/leaflet.css'

import { useEffect, useRef, useState } from 'react'

export type InfraItem = {
  name: string
  minutes: number
  modeLabel: string
  category: string
  lat?: number | null
  lng?: number | null
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/**
 * Инфраструктура как у fsk.ru: слева панель категорий поверх карты, на карте метка проекта и объекты выбранной категории.
 * Карта — Leaflet + OpenStreetMap; объекты без координат показываются только в списке под картой.
 */
export function InfraMap({
  center,
  items,
  categories,
  allLabel,
}: {
  center: { lat: number; lng: number; title: string }
  items: InfraItem[]
  categories: { value: string; label: string }[]
  allLabel: string
}) {
  const [cat, setCat] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const shown = items.filter((i) => !cat || i.category === cat)

  useEffect(() => {
    let map: import('leaflet').Map | null = null
    let cancelled = false
    let ro: ResizeObserver | null = null
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return
      map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: false, attributionControl: true })
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const bounds = L.latLngBounds([[center.lat, center.lng]])
      L.marker([center.lat, center.lng], {
        icon: L.divIcon({ className: 'map-pin-wrap', html: `<span class="map-pin"><b>${esc(center.title)}</b></span>`, iconSize: [0, 0] }),
        zIndexOffset: 1000,
      }).addTo(map)
      for (const p of shown) {
        if (p.lat == null || p.lng == null) continue
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({ className: 'infra-pin-wrap', html: '<span class="infra-pin"></span>', iconSize: [18, 18] }),
        })
          .addTo(map)
          .bindTooltip(`${esc(p.name)} · ${p.minutes} ${esc(p.modeLabel)}`, { direction: 'top', offset: [0, -8] })
        bounds.extend([p.lat, p.lng])
      }
      const fit = () => {
        if (!map) return
        if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.setView([center.lat, center.lng], 15)
        else map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
      }
      fit()
      // Карта может создаваться в скрытой вкладке (нулевой размер): при показе пересчитываем размер и вписываем метки
      ro = new ResizeObserver(() => {
        map?.invalidateSize()
        fit()
      })
      ro.observe(ref.current)
      map.once('focus', () => map?.scrollWheelZoom.enable())
    })()
    return () => {
      cancelled = true
      ro?.disconnect()
      map?.remove()
    }
  }, [center.lat, center.lng, center.title, cat]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="infra-map">
      <div className="infra-map__cats" role="group">
        {[{ value: '', label: allLabel }, ...categories].map((c) => (
          <button key={c.value} type="button" className={cat === c.value ? 'is-active' : ''} aria-pressed={cat === c.value} onClick={() => setCat(c.value)}>
            <i aria-hidden />
            {c.label}
          </button>
        ))}
      </div>
      <div ref={ref} className="cat-map infra-map__map" />
      <ul className="infra infra-map__list">
        {shown.map((p, i) => (
          <li key={`${p.name}-${i}`} className="infra__item">
            <strong>{p.name}</strong>
            <span>
              <b>{p.minutes}</b> {p.modeLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
