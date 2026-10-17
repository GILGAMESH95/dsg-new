'use client'

import { useEffect, useRef, useState } from 'react'

import type { Dictionary } from '@/i18n/dictionaries/ru'
import { phoneHref, telegramHref, whatsappHref } from '@/lib/format'
import type { SiteSetting } from '@/payload-types'

import { CloseIcon, PhoneIcon, TelegramIcon, WhatsappIcon } from './icons'

/**
 * Плавающая кнопка связи как у fsk.ru: одна круглая кнопка, по нажатию раскрывается в WhatsApp, Telegram и звонок.
 * Так она не закрывает контент (особенно на телефоне над нижней панелью).
 */
export function FloatingContacts({ dict, settings }: { dict: Dictionary['floating']; settings: SiteSetting }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  if (!settings.whatsapp && !settings.telegram && !settings.phone) return null

  return (
    <div ref={ref} className={`floating ${open ? 'is-open' : ''}`}>
      <div className="floating__list" aria-hidden={!open}>
        {settings.whatsapp && (
          <a
            href={whatsappHref(settings.whatsapp, 'Здравствуйте! Интересуют квартиры DS Group.')}
            target="_blank"
            rel="noopener"
            className="floating__btn floating__btn--wa"
            aria-label={dict.whatsapp}
            tabIndex={open ? 0 : -1}
          >
            <WhatsappIcon width={24} height={24} />
          </a>
        )}
        {settings.telegram && (
          <a href={telegramHref(settings.telegram)} target="_blank" rel="noopener" className="floating__btn floating__btn--tg" aria-label={dict.telegram} tabIndex={open ? 0 : -1}>
            <TelegramIcon width={22} height={22} />
          </a>
        )}
        {settings.phone && (
          <a href={phoneHref(settings.phone)} className="floating__btn floating__btn--tel" aria-label={dict.call} tabIndex={open ? 0 : -1}>
            <PhoneIcon width={22} height={22} />
          </a>
        )}
      </div>
      <button type="button" className="floating__btn floating__btn--call floating__toggle" aria-expanded={open} aria-label={dict.call} onClick={() => setOpen((v) => !v)}>
        {open ? <CloseIcon width={22} height={22} /> : <PhoneIcon width={22} height={22} />}
      </button>
    </div>
  )
}
