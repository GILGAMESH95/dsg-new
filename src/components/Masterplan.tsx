'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export type MasterplanBuilding = {
  id: string
  name: string
  x: number
  y: number
  completion?: string | null
  units?: string | null
}

/** Генплан с кликабельными метками корпусов */
export function Masterplan({
  imageUrl,
  fullUrl,
  alt,
  buildings,
  labels,
  href,
}: {
  imageUrl: string
  fullUrl: string
  alt: string
  buildings: MasterplanBuilding[]
  labels: { zoom: string; show: string }
  href: string
}) {
  const [active, setActive] = useState<string | null>(null)
  const current = buildings.find((b) => b.id === active)

  return (
    <div className="masterplan" onClick={() => setActive(null)}>
      <Image src={imageUrl} alt={alt} fill sizes="(max-width: 1392px) 100vw, 1392px" />
      <button
        type="button"
        className="masterplan__zoom"
        data-lb-src={fullUrl}
        data-lb-alt={alt}
        aria-label={labels.zoom}
        title={labels.zoom}
      >
        ⤢
      </button>
      {buildings.map((b) => (
        <button
          key={b.id}
          type="button"
          className={`masterplan__mark ${b.id === active ? 'is-active' : ''}`}
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
          aria-pressed={b.id === active}
          onClick={(e) => {
            e.stopPropagation()
            setActive(b.id === active ? null : b.id)
          }}
        >
          {b.name}
        </button>
      ))}
      {current && (
        <div
          className={`masterplan__pop ${current.x > 60 ? 'masterplan__pop--left' : ''}`}
          style={{ left: `${current.x}%`, top: `${current.y}%` }}
          onClick={(e) => e.stopPropagation()}
        >
          <strong>{current.name}</strong>
          {current.completion && <span>{current.completion}</span>}
          {current.units && <span>{current.units}</span>}
          <Link href={href}>{labels.show}</Link>
        </div>
      )}
    </div>
  )
}
