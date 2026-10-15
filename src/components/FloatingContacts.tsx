import type { Dictionary } from '@/i18n/dictionaries/ru'
import { phoneHref, telegramHref, whatsappHref } from '@/lib/format'
import type { SiteSetting } from '@/payload-types'

import { PhoneIcon, TelegramIcon, WhatsappIcon } from './icons'

/** Плавающие кнопки связи: на мобильных — нижняя панель, на десктопе — справа внизу */
export function FloatingContacts({ dict, settings }: { dict: Dictionary['floating']; settings: SiteSetting }) {
  return (
    <div className="floating">
      {settings.whatsapp && (
        <a
          href={whatsappHref(settings.whatsapp, 'Здравствуйте! Интересуют квартиры DS Group.')}
          target="_blank"
          rel="noopener"
          className="floating__btn floating__btn--wa"
          aria-label={dict.whatsapp}
        >
          <WhatsappIcon width={24} height={24} />
          <span>{dict.whatsapp}</span>
        </a>
      )}
      {settings.telegram && (
        <a
          href={telegramHref(settings.telegram)}
          target="_blank"
          rel="noopener"
          className="floating__btn floating__btn--tg"
          aria-label={dict.telegram}
        >
          <TelegramIcon width={22} height={22} />
          <span>{dict.telegram}</span>
        </a>
      )}
      {settings.phone && (
        <a href={phoneHref(settings.phone)} className="floating__btn floating__btn--call" aria-label={dict.call}>
          <PhoneIcon width={22} height={22} />
          <span>{dict.call}</span>
        </a>
      )}
    </div>
  )
}
