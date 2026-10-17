'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { localeLabels, locales, type Locale } from '@/i18n/config'
import type { MenuItem } from '@/lib/menu'

import { ArrowIcon, CloseIcon, FacebookIcon, HeartIcon, InstagramIcon, TelegramIcon, UserIcon, WhatsappIcon, YoutubeIcon } from './icons'
import { LeadButton } from './LeadModal'

export type MobileMenuLabels = {
  title: string
  login: string
  favorites: string
  back: string
  choose: string
  callMe: string
  consultTitle: string
  consultLead: string
  phone: string
  email: string
}
export type MobileContacts = { phone?: string | null; email?: string | null; socials: { href: string; kind: 'instagram' | 'facebook' | 'youtube' | 'telegram' | 'whatsapp'; label: string }[] }

const socialIcon = { instagram: InstagramIcon, facebook: FacebookIcon, youtube: YoutubeIcon, telegram: TelegramIcon, whatsapp: WhatsappIcon } as const

/**
 * Мобильное меню как у fsk.ru: шторка снизу с заголовком «Меню», плитками «Войти / Избранное»,
 * фото-плитками проектов и списком разделов; раздел с подпунктами открывается второй шторкой со стрелкой «назад».
 */
export function MobileMenu({
  open,
  onClose,
  items,
  labels,
  locale,
  contacts,
  accountHref,
  accountLabel,
  switchHref,
  chooseHref,
}: {
  open: boolean
  onClose: () => void
  items: MenuItem[]
  labels: MobileMenuLabels
  locale: Locale
  contacts: MobileContacts
  accountHref: string
  accountLabel: string
  switchHref: (l: Locale) => string
  chooseHref: string
}) {
  const [sub, setSub] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSub(null)
      return
    }
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (sub ? setSub(null) : onClose())
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, sub, onClose])

  const tilesItem = items.find((i) => i.kind === 'tiles')
  const current = items.find((i) => i.id === sub)
  const hasSub = (i: MenuItem) => i.kind === 'columns' || i.kind === 'tiles'

  return (
    <div className={`msheet ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="msheet__backdrop" onClick={onClose} />
      <div className="msheet__panel" role="dialog" aria-label={labels.title}>
        <header className="msheet__bar">
          <span />
          <h2>{labels.title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <div className="msheet__body">
          <div className="msheet__quick">
            <Link href={accountHref} className="msheet__qbtn" tabIndex={open ? 0 : -1}>
              <span>
                <UserIcon />
              </span>
              {accountLabel}
            </Link>
            <Link href={`/${locale}/favorites`} className="msheet__qbtn" tabIndex={open ? 0 : -1}>
              <span>
                <HeartIcon />
              </span>
              {labels.favorites}
            </Link>
          </div>

          {tilesItem?.tiles && tilesItem.tiles.length > 0 && (
            <div className="msheet__card msheet__photos">
              <div className="msheet__tiles">
                {tilesItem.tiles.map((t, i) => (
                  <Link key={t.href + t.label} href={t.href} className={`msheet__tile ${i === 0 ? 'is-big' : ''}`} tabIndex={open ? 0 : -1}>
                    {t.image && <img src={t.image} alt="" loading="lazy" />}
                    <span>{t.label}</span>
                  </Link>
                ))}
              </div>
              <Link href={chooseHref} className="btn btn--accent btn--block" tabIndex={open ? 0 : -1}>
                {labels.choose}
              </Link>
            </div>
          )}

          <nav className="msheet__card msheet__list">
            {items.map((it) =>
              hasSub(it) ? (
                <button key={it.id} type="button" className="msheet__row" onClick={() => setSub(it.id)} tabIndex={open ? 0 : -1}>
                  <span>{it.label}</span>
                  <ArrowIcon width={18} height={18} />
                </button>
              ) : (
                <Link key={it.id} href={it.href} className="msheet__row" tabIndex={open ? 0 : -1}>
                  <span>{it.label}</span>
                </Link>
              ),
            )}
          </nav>

          <div className="msheet__card msheet__consult">
            <h3>{labels.consultTitle}</h3>
            <p>{labels.consultLead}</p>
            <LeadButton className="msheet__gray">{labels.callMe}</LeadButton>
          </div>

          <div className="msheet__card msheet__contacts">
            {contacts.phone && (
              <div>
                <span>{labels.phone}</span>
                <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} tabIndex={open ? 0 : -1}>
                  {contacts.phone}
                </a>
              </div>
            )}
            {contacts.email && (
              <div>
                <span>{labels.email}</span>
                <a href={`mailto:${contacts.email}`} tabIndex={open ? 0 : -1}>
                  {contacts.email}
                </a>
              </div>
            )}
            {contacts.socials.length > 0 && (
              <div className="msheet__socials">
                {contacts.socials.map((so) => {
                  const Icon = socialIcon[so.kind]
                  return (
                    <a key={so.href} href={so.href} target="_blank" rel="noopener" aria-label={so.label} tabIndex={open ? 0 : -1}>
                      <Icon width={20} height={20} />
                    </a>
                  )
                })}
              </div>
            )}
            <div className="drawer-lang" aria-label="Language">
              {locales.map((l) => (
                <Link
                  key={l}
                  href={switchHref(l)}
                  className={l === locale ? 'is-active' : ''}
                  hrefLang={l}
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    document.cookie = `locale=${l};path=/;max-age=31536000`
                  }}
                >
                  {localeLabels[l]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Вторая шторка: подпункты выбранного раздела */}
      <div className={`msheet__panel msheet__panel--sub ${current ? 'is-open' : ''}`} role="dialog" aria-label={current?.label}>
        <header className="msheet__bar">
          <button type="button" onClick={() => setSub(null)} aria-label={labels.back}>
            <ArrowIcon style={{ transform: 'rotate(180deg)' }} />
          </button>
          <h2>{current?.label}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <div className="msheet__body">
          {current?.kind === 'columns' &&
            current.columns?.map((col) => (
              <div key={col.head.href + col.head.label} className="msheet__group">
                <Link href={col.head.href} className="msheet__head" tabIndex={current ? 0 : -1}>
                  {col.head.label}
                </Link>
                {col.links.map((l) => (
                  <Link key={l.href + l.label} href={l.href} className="msheet__sublink" tabIndex={current ? 0 : -1}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          {current?.kind === 'tiles' && (
            <div className="msheet__group">
              <Link href={current.href} className="msheet__head">
                {current.label}
              </Link>
              {current.tiles?.map((t) => (
                <Link key={t.href + t.label} href={t.href} className="msheet__head">
                  {t.label}
                </Link>
              ))}
              {current.sideLinks?.map((l) => (
                <Link key={l.href + l.label} href={l.href} className="msheet__sublink">
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
