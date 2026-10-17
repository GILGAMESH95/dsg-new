'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BuildingIcon, FlameIcon, HomeIcon, KeyIcon, MenuIcon } from './icons'

export const MENU_EVENT = 'dsg:menu-toggle'

/** Нижняя панель на телефоне, как у fsk.ru: Квартиры · Проекты · Главная · Акции · Меню */
export function BottomNav({
  locale,
  labels,
}: {
  locale: string
  labels: { apartments: string; projects: string; home: string; promotions: string; menu: string }
}) {
  const pathname = usePathname()
  const is = (path: string) => (path === '' ? pathname === `/${locale}` : pathname.startsWith(`/${locale}/${path}`))

  const items = [
    { href: `/${locale}/apartments`, label: labels.apartments, icon: <KeyIcon />, active: is('apartments') },
    { href: `/${locale}/projects`, label: labels.projects, icon: <BuildingIcon />, active: is('projects') },
    { href: `/${locale}`, label: labels.home, icon: <HomeIcon />, active: is('') },
    { href: `/${locale}/promo`, label: labels.promotions, icon: <FlameIcon />, active: is('promo') },
  ]

  return (
    <nav className="bottom-nav" aria-label="Main">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`bottom-nav__item ${i.active ? 'is-active' : ''}`} aria-current={i.active ? 'page' : undefined}>
          {i.icon}
          <span>{i.label}</span>
        </Link>
      ))}
      <button type="button" className="bottom-nav__item" onClick={() => window.dispatchEvent(new Event(MENU_EVENT))}>
        <MenuIcon />
        <span>{labels.menu}</span>
      </button>
    </nav>
  )
}
