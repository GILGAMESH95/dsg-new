'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { logoutClient } from '@/actions/account'

export type AccountMenuLabels = {
  home: string
  favorites: string
  notifications: string
  faq: string
  support: string
  settings: string
  logout: string
}

/** Аватар с инициалами и выпадающим меню кабинета, как у fsk.ru */
export function AccountMenu({
  locale,
  initials,
  unread,
  labels,
}: {
  locale: string
  initials: string
  unread: number
  labels: AccountMenuLabels
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items = [
    { href: `/${locale}/account`, label: labels.home },
    { href: `/${locale}/favorites`, label: labels.favorites },
    { href: `/${locale}/account/notifications`, label: labels.notifications, badge: unread },
    { href: `/${locale}/account/faq`, label: labels.faq },
    { href: `/${locale}/account/support`, label: labels.support },
    { href: `/${locale}/account/settings`, label: labels.settings },
  ]

  return (
    <div className="acc-menu" ref={ref}>
      <button type="button" className="acc-menu__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>{initials}</span>
        {unread > 0 && <i aria-hidden />}
      </button>
      {open && (
        <div className="acc-menu__drop" role="menu">
          {items.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem">
              {i.label}
              {i.badge ? <b>{i.badge}</b> : null}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            className="acc-menu__logout"
            onClick={async () => {
              await logoutClient()
              try {
                localStorage.removeItem('dsg:favorites')
                localStorage.removeItem('dsg:searches')
              } catch {
                // нет доступа к хранилищу
              }
              router.push(`/${locale}/account`)
              router.refresh()
            }}
          >
            {labels.logout}
          </button>
        </div>
      )}
    </div>
  )
}
