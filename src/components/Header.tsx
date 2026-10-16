'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { localeLabels, locales, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import { phoneHref } from '@/lib/format'

import { CloseIcon, MenuIcon, PhoneIcon } from './icons'
import { LeadButton } from './LeadModal'
import { Logo } from './Logo'

const navKeys = ['projects', 'apartments', 'about', 'blog', 'contacts'] as const

export function Header({
  locale,
  nav,
  callMe,
  phone,
}: {
  locale: Locale
  nav: Dictionary['nav']
  callMe: string
  phone?: string | null
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const rest = pathname.split('/').slice(2).join('/')
  const switchHref = (l: Locale) => `/${l}${rest ? `/${rest}` : ''}`
  const isActive = (key: string) => pathname.startsWith(`/${locale}/${key}`)

  return (
    <header className={`header ${scrolled || open ? 'header--solid' : ''}`}>
      <div className="container header__inner">
        <Link href={`/${locale}`} className="header__logo" aria-label="DS Group">
          <Logo />
        </Link>

        <nav className={`header__nav ${open ? 'is-open' : ''}`} aria-label="Main">
          {navKeys.map((key) => (
            <Link
              key={key}
              href={`/${locale}/${key}`}
              className={`header__link ${isActive(key) ? 'is-active' : ''}`}
            >
              {nav[key]}
            </Link>
          ))}
          <div className="header__mobile-extra">
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
          <LeadButton className="btn btn--accent btn--sm header__cta">{callMe}</LeadButton>
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
    </header>
  )
}
