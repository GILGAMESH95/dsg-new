'use client'

import { useState, type ReactNode } from 'react'

/** Вкладки «Расположение / Инфраструктура / Офис продаж» (панели приходят с сервера) */
export function LocationTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id)

  return (
    <div className="loc-tabs">
      {tabs.length > 1 && (
        <div className="loc-tabs__bar" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              className={`layouts__chip ${active === t.id ? 'is-active' : ''}`}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </div>
  )
}
