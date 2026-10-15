export const locales = ['ka', 'ru', 'en'] as const
export type Locale = (typeof locales)[number]

// Контент пока наполняется на русском. При запуске переключить на 'ka'.
export const defaultLocale: Locale = 'ru'

export const localeLabels: Record<Locale, string> = {
  ka: 'ქართ',
  ru: 'Рус',
  en: 'Eng',
}

export const htmlLang: Record<Locale, string> = {
  ka: 'ka-GE',
  ru: 'ru-RU',
  en: 'en-US',
}

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}
