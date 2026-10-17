import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'

export type CabinetTab = 'home' | 'favorites' | 'notifications' | 'faq' | 'support' | 'settings'

/** Каркас личного кабинета: приветствие, вкладки разделов и содержимое */
export function CabinetShell({
  locale,
  dict,
  name,
  active,
  unread = 0,
  children,
}: {
  locale: Locale
  dict: Dictionary
  name: string
  active: CabinetTab
  unread?: number
  children: ReactNode
}) {
  const m = dict.cabinet.menu
  const tabs: { id: CabinetTab; href: string; label: string }[] = [
    { id: 'home', href: `/${locale}/account`, label: m.home },
    { id: 'favorites', href: `/${locale}/favorites`, label: m.favorites },
    { id: 'notifications', href: `/${locale}/account/notifications`, label: m.notifications },
    { id: 'faq', href: `/${locale}/account/faq`, label: m.faq },
    { id: 'support', href: `/${locale}/account/support`, label: m.support },
    { id: 'settings', href: `/${locale}/account/settings`, label: m.settings },
  ]

  return (
    <section className="section cabinet">
      <div className="container">
        <h1 className="cabinet__name">{name}</h1>
        <nav className="cabinet__tabs" aria-label={dict.account.title}>
          {tabs.map((t) => (
            <Link key={t.id} href={t.href} className={active === t.id ? 'is-active' : ''} aria-current={active === t.id ? 'page' : undefined}>
              {t.label}
              {t.id === 'notifications' && unread > 0 && <b>{unread}</b>}
            </Link>
          ))}
        </nav>
        <div className="cabinet__body">{children}</div>
      </div>
    </section>
  )
}
