'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { localeLabels, locales, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import { phoneHref } from '@/lib/format'

import { AuthModal } from './AuthModal'
import { AccountMenu, type AccountMenuLabels } from './AccountMenu'
import { MENU_EVENT } from './BottomNav'
import { FavoritesLink } from './FavoritesLink'
import { ArrowIcon, CloseIcon, MenuIcon, PhoneIcon } from './icons'
import type { MenuItem } from '@/lib/menu'

import { LeadButton } from './LeadModal'
import { MobileMenu, type MobileContacts, type MobileMenuLabels } from './MobileMenu'
import { Logo } from './Logo'

export function Header({
  locale,
  menu: menuItems,
  callMe,
  phone,
  favLabel,
  accountLabel,
  account,
  authDict,
  mobileLabels,
  mobileContacts,
}: {
  locale: Locale
  /** Меню шапки (из админки или стандартное) */
  menu: MenuItem[]
  callMe: string
  phone?: string | null
  favLabel: string
  accountLabel: string
  /** Данные вошедшего клиента (null — гость) */
  account: { initials: string; unread: number; menu: AccountMenuLabels } | null
  /** Тексты формы входа для всплывающего окна */
  authDict: Dictionary['account']
  /** Подписи мобильного меню */
  mobileLabels: MobileMenuLabels
  mobileContacts: MobileContacts
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Какое выпадающее меню открыто (как у fsk.ru: проекты, способы покупки, о компании)
  const [menu, setMenu] = useState<string | null>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setOpen(false)
    setMenu(null)
  }, [pathname])
  // Выпадающее меню закрывается по Esc и по клику вне шапки
  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null)
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenu(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [menu])
  // Вкладка «Меню» в нижней панели телефона открывает то же меню
  useEffect(() => {
    const toggle = () => setOpen((v) => !v)
    window.addEventListener(MENU_EVENT, toggle)
    return () => window.removeEventListener(MENU_EVENT, toggle)
  }, [])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const rest = pathname.split('/').slice(2).join('/')
  const switchHref = (l: Locale) => `/${l}${rest ? `/${rest}` : ''}`
  const isActive = (href: string) => pathname === href || (href !== `/${locale}` && pathname.startsWith(`${href}/`))

  const dropdown = (it: MenuItem) => it.kind === 'columns' || it.kind === 'tiles'

  return (
    <header ref={headerRef} className={`header ${scrolled || open || menu ? 'header--solid' : ''}`}>
      <div className="container header__inner">
        <Link href={`/${locale}`} className="header__logo" aria-label="DS Group">
          <Logo />
        </Link>

        <nav className={`header__nav ${open ? 'is-open' : ''}`} aria-label="Main">
          {menuItems.map((it) =>
            dropdown(it) ? (
              <span key={it.id} className="header__mega-wrap">
                <Link href={it.href} className={`header__link header__link--plain ${isActive(it.href) ? 'is-active' : ''}`}>
                  {it.label}
                </Link>
                <button
                  type="button"
                  className={`header__link header__link--mega ${menu === it.id || isActive(it.href) ? 'is-active' : ''}`}
                  aria-expanded={menu === it.id}
                  onClick={() => setMenu((v) => (v === it.id ? null : it.id))}
                >
                  {it.label}
                </button>
              </span>
            ) : (
              <Link key={it.id} href={it.href} className={`header__link ${isActive(it.href) ? 'is-active' : ''}`}>
                {it.label}
              </Link>
            ),
          )}
          <div className="header__mobile-extra">
            <div className="drawer-lang" aria-label="Language">
              {locales.map((l) => (
                <Link
                  key={l}
                  href={switchHref(l)}
                  className={l === locale ? 'is-active' : ''}
                  hrefLang={l}
                  onClick={() => {
                    document.cookie = `locale=${l};path=/;max-age=31536000`
                  }}
                >
                  {localeLabels[l]}
                </Link>
              ))}
            </div>
            {phone && (
              <a href={phoneHref(phone)} className="header__phone">
                <PhoneIcon /> {phone}
              </a>
            )}
            <LeadButton className="btn btn--accent btn--block">{callMe}</LeadButton>
          </div>
        </nav>

        <div className="header__actions">
          <div className="lang" aria-label="Language">
            {locales.map((l) => (
              <Link
                key={l}
                href={switchHref(l)}
                className={`lang__item ${l === locale ? 'is-active' : ''}`}
                hrefLang={l}
                onClick={() => {
                  document.cookie = `locale=${l};path=/;max-age=31536000`
                }}
              >
                {localeLabels[l]}
              </Link>
            ))}
          </div>
          {phone && (
            <a href={phoneHref(phone)} className="header__phone header__phone--desktop">
              <PhoneIcon /> <span>{phone}</span>
            </a>
          )}
          <FavoritesLink href={`/${locale}/favorites`} label={favLabel} />
          {account ? (
            <AccountMenu locale={locale} initials={account.initials} unread={account.unread} labels={account.menu} />
          ) : (
            <AuthModal locale={locale} dict={authDict} />
          )}
          <button
            type="button"
            className="header__burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {menuItems.filter((it) => it.kind === 'tiles').map((it) => (
        <div key={it.id} className={`mega ${menu === it.id ? 'is-open' : ''}`} aria-hidden={menu !== it.id}>
          <div className="mega__tiles">
            {it.tiles?.map((t) => (
              <Link key={t.href + t.label} href={t.href} className="mega__tile" tabIndex={menu === it.id ? 0 : -1}>
                {t.image && <img src={t.image} alt="" loading="lazy" />}
                <span>{t.label}</span>
              </Link>
            ))}
          </div>
          <div className="mega__links">
            {it.sideLinks?.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="mega__link" tabIndex={menu === it.id ? 0 : -1}>
                {l.label}
                <ArrowIcon width={16} height={16} />
              </Link>
            ))}
          </div>
        </div>
      ))}
      {menuItems.filter((it) => it.kind === 'columns').map((it) => (
        <div key={it.id} className={`dd ${menu === it.id ? 'is-open' : ''}`} aria-hidden={menu !== it.id}>
          {it.columns?.map((col) => (
            <div key={col.head.href + col.head.label} className="dd__col">
              <Link href={col.head.href} className="dd__head" tabIndex={menu === it.id ? 0 : -1}>
                {col.head.label}
              </Link>
              {col.links.map((l) => (
                <Link key={l.href + l.label} href={l.href} className="dd__link" tabIndex={menu === it.id ? 0 : -1}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      ))}
      <div className={`menu-dim ${menu ? 'is-open' : ''}`} aria-hidden onClick={() => setMenu(null)} />
      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        items={menuItems}
        labels={mobileLabels}
        locale={locale}
        contacts={mobileContacts}
        accountHref={`/${locale}/account`}
        accountLabel={account ? accountLabel : mobileLabels.login}
        switchHref={switchHref}
        chooseHref={`/${locale}/apartments`}
      />
    </header>
  )
}
