'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'

import { AuthPanel } from './AccountForms'
import { CloseIcon, UserIcon } from './icons'

/** Иконка входа в шапке: форма входа/регистрации открывается всплывающим окном, как у fsk.ru */
export function AuthModal({ locale, dict }: { locale: Locale; dict: Dictionary['account'] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button type="button" className="header__fav header__account" aria-label={dict.title} title={dict.title} onClick={() => setOpen(true)}>
        <UserIcon />
      </button>
      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <div className="modal__backdrop" onClick={() => setOpen(false)} />
          <div className="modal__panel modal__panel--auth">
            <button type="button" className="modal__close" onClick={() => setOpen(false)} aria-label="Close">
              <CloseIcon />
            </button>
            <h2 id="auth-modal-title" className="modal__title">
              {dict.title}
            </h2>
            <AuthPanel locale={locale} dict={dict} />
          </div>
        </div>
      )}
    </>
  )
}
