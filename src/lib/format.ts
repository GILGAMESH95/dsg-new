import type { Locale } from '@/i18n/config'
import { htmlLang } from '@/i18n/config'

export const formatPrice = (value: number | null | undefined, locale: Locale) =>
  value == null
    ? ''
    : `$${new Intl.NumberFormat(htmlLang[locale], { maximumFractionDigits: 0 }).format(value)}`

export const formatNumber = (value: number, locale: Locale) =>
  new Intl.NumberFormat(htmlLang[locale], { maximumFractionDigits: 1 }).format(value)

export const formatDate = (value: string | null | undefined, locale: Locale) =>
  value
    ? new Intl.DateTimeFormat(htmlLang[locale], { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(value),
      )
    : ''

export const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
export const whatsappHref = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`
export const telegramHref = (username: string) => `https://t.me/${username.replace(/^@/, '')}`
