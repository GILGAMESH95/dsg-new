import type { Metadata } from 'next'
import { Manrope, Noto_Sans_Georgian } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { FloatingContacts } from '@/components/FloatingContacts'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LeadModalProvider } from '@/components/LeadModal'
import { htmlLang, isLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n'
import { mediaUrl } from '@/lib/media'
import { getSettings } from '@/lib/payload'
import { buildMetadata, siteUrl } from '@/lib/seo'

import '../styles.css'

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-main', display: 'swap' })
const georgian = Noto_Sans_Georgian({
  subsets: ['georgian'],
  variable: '--font-georgian',
  display: 'swap',
})

export const generateStaticParams = () => locales.map((locale) => ({ locale }))

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)
  const settings = await getSettings(locale)
  const title = settings.seoTitle || dict.meta.defaultTitle
  return {
    metadataBase: new URL(siteUrl),
    ...buildMetadata({
      locale,
      path: '/',
      title,
      description: settings.seoDescription || dict.meta.defaultDescription,
      image: mediaUrl(settings.ogImage),
    }),
    title: { default: title, template: '%s — DS Group' },
    icons: { icon: '/favicon.svg' },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const settings = await getSettings(locale)

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'DS Group',
    url: siteUrl,
    telephone: settings.phone,
    email: settings.email ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address ?? undefined,
      addressLocality: 'Batumi',
      addressCountry: 'GE',
    },
    areaServed: 'Batumi',
  }

  return (
    <html lang={htmlLang[locale]} className={`${manrope.variable} ${georgian.variable} lang-${locale}`}>
      <body>
        <LeadModalProvider locale={locale} dict={dict.form}>
          <Header locale={locale} nav={dict.nav} callMe={dict.common.callMe} phone={settings.phone} />
          <main>{children}</main>
          <Footer locale={locale} dict={dict} settings={settings} />
          <FloatingContacts dict={dict.floating} settings={settings} />
        </LeadModalProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  )
}
