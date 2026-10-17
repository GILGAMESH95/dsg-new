'use client'

import Image from 'next/image'
import { useState } from 'react'

export type PlanTab = { id: string; label: string; url: string; fullUrl?: string | null; alt: string }

/** Вкладки над планировкой квартиры: «Планировка / Вид из окон / На этаже / С размерами / Генплан» как у fsk.ru */
export function PlanTabs({ tabs }: { tabs: PlanTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const current = tabs.find((t) => t.id === active) ?? tabs[0]
  if (!current) return null

  return (
    <div className="plan-tabs">
      {tabs.length > 1 && (
        <div className="plan-tabs__bar" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={t.id === current.id} className={t.id === current.id ? 'is-active' : ''} onClick={() => setActive(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="apt-page__plan plan-tabs__view" data-lb-src={current.fullUrl ?? current.url} data-lb-alt={current.alt} role="button" tabIndex={0}>
        <Image key={current.id} src={current.url} alt={current.alt} fill sizes="(max-width: 960px) 100vw, 60vw" priority />
      </div>
    </div>
  )
}
