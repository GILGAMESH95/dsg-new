import type { Metadata } from 'next'

import { defaultLocale, htmlLang, locales, type Locale } from '@/i18n/config'

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dsg.ge').replace(/\/$/, '')

/** Путь без префикса языка, например "/projects/ds-tower" */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
}: {
  locale: Locale
  path: string
  title: string
  description?: string | null
  image?: string | null
}): Metadata {
  const clean = path === '/' ? '' : path
  const languages: Record<string, string> = {}
  for (const l of locales) languages[htmlLang[l]] = `${siteUrl}/${l}${clean}`
  languages['x-default'] = `${siteUrl}/${defaultLocale}${clean}`

  return {
    title,
    description: description ?? undefined,
    alternates: { canonical: `${siteUrl}/${locale}${clean}`, languages },
    openGraph: {
      title,
      description: description ?? undefined,
      url: `${siteUrl}/${locale}${clean}`,
      siteName: 'DS Group',
      locale: htmlLang[locale].replace('-', '_'),
      type: 'website',
      images: image ? [{ url: image.startsWith('http') ? image : `${siteUrl}${image}` }] : undefined,
    },
  }
}
