'use client'

import 'leaflet/dist/leaflet.css'

import { useEffect, useRef } from 'react'

export type MapProject = {
  id: number
  href: string
  title: string
  subtitle?: string | null
  priceLabel?: string | null
  imageUrl?: string | null
  statusLabel?: string | null
  lat: number
  lng: number
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** Интерактивная карта новостроек: Leaflet + тайлы OpenStreetMap (данные © OpenStreetMap contributors) */
export function ProjectsMap({ projects, labels }: { projects: MapProject[]; labels: { open: string } }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: import('leaflet').Map | null = null
    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return

      map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true })
      // Стандартные тайлы OpenStreetMap; тёмный вид даётся CSS-фильтром (.cat-map .leaflet-tile-pane)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const bounds = L.latLngBounds([])
      for (const p of projects) {
        const pin = L.divIcon({
          className: 'map-pin-wrap',
          html: `<span class="map-pin"><b>${esc(p.title)}</b>${p.priceLabel ? `<i>${esc(p.priceLabel)}</i>` : ''}</span>`,
          iconSize: [0, 0],
        })
        const popup = `
          <a class="map-card" href="${esc(p.href)}">
            ${p.imageUrl ? `<span class="map-card__img" style="background-image:url('${esc(p.imageUrl)}')"></span>` : ''}
            <span class="map-card__body">
              ${p.statusLabel ? `<em>${esc(p.statusLabel)}</em>` : ''}
              <strong>${esc(p.title)}</strong>
              ${p.subtitle ? `<span>${esc(p.subtitle)}</span>` : ''}
              ${p.priceLabel ? `<b>${esc(p.priceLabel)}</b>` : ''}
              <u>${esc(labels.open)} →</u>
            </span>
          </a>`
        L.marker([p.lat, p.lng], { icon: pin }).addTo(map).bindPopup(popup, { closeButton: false, minWidth: 240, maxWidth: 280 })
        bounds.extend([p.lat, p.lng])
      }

      if (projects.length === 1) map.setView([projects[0].lat, projects[0].lng], 15)
      else if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
      else map.setView([41.6453, 41.6330], 12)

      map.once('focus', () => map?.scrollWheelZoom.enable())
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [projects, labels.open])

  return <div ref={ref} className="cat-map" />
}
