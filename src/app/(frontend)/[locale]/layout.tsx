import type { Metadata } from 'next'
import { Manrope, Noto_Sans_Georgian } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { FloatingContacts } from '@/components/FloatingContacts'
import { AccountSyncer } from '@/components/AccountSyncer'
import { BottomNav } from '@/components/BottomNav'
import { CompareBar } from '@/components/CompareBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { ImageLightbox } from '@/components/ImageLightbox'
import { LeadModalProvider } from '@/components/LeadModal'
import { htmlLang, isLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n'
import { getClient, getUnreadCount } from '@/lib/clientAuth'
import { mediaUrl } from '@/lib/media'
import { getSettings } from '@/lib/payload'
import { telegramHref, whatsappHref } from '@/lib/format'
import { buildMenu } from '@/lib/menu'
import { getPaymentMethods, getProjects } from '@/lib/queries'
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
  const [menuProjects, buyMethods] = await Promise.all([getProjects(locale), getPaymentMethods(locale)])
  const menu = buildMenu({ locale, settings, nav: dict.nav, projects: menuProjects, methods: buyMethods })
  const socials = [
    settings.instagram && { href: settings.instagram, kind: 'instagram' as const, label: 'Instagram' },
    settings.facebook && { href: settings.facebook, kind: 'facebook' as const, label: 'Facebook' },
    settings.youtube && { href: settings.youtube, kind: 'youtube' as const, label: 'YouTube' },
    settings.telegram && { href: telegramHref(settings.telegram), kind: 'telegram' as const, label: 'Telegram' },
    settings.whatsapp && { href: whatsappHref(settings.whatsapp), kind: 'whatsapp' as const, label: 'WhatsApp' },
  ].filter(Boolean) as { href: string; kind: 'instagram' | 'facebook' | 'youtube' | 'telegram' | 'whatsapp'; label: string }[]
  const client = await getClient()
  const account = client
    ? {
        initials:
          (client.name ?? '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]!.toUpperCase())
            .join('') || client.email[0]!.toUpperCase(),
        unread: await getUnreadCount(client.id),
        menu: dict.cabinet.menu,
      }
    : null

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
          <Header locale={locale} menu={menu} callMe={dict.common.callMe} phone={settings.phone} favLabel={dict.nav.favorites} accountLabel={dict.account.title} account={account} authDict={dict.account} mobileLabels={{ title: dict.common.menu, login: dict.account.loginTab, favorites: dict.nav.favorites, back: dict.project.prev, choose: dict.project.chooseApartment, callMe: dict.common.callMe, consultTitle: dict.common.consultation, consultLead: dict.home.ctaLead, phone: dict.contacts.phone, email: dict.contacts.email }} mobileContacts={{ phone: settings.phone, email: settings.email, socials }} />
          <main>{children}</main>
          <Footer locale={locale} dict={dict} settings={settings} />
          <FloatingContacts dict={dict.floating} settings={settings} />
          <BottomNav
            locale={locale}
            labels={{
              apartments: dict.nav.apartments,
              projects: dict.nav.projects,
              home: dict.nav.home,
              promotions: dict.nav.promotions,
              menu: dict.common.menu,
            }}
          />
          <ImageLightbox />
          {client && <AccountSyncer />}
          <CompareBar locale={locale} labels={dict.compare} />
        </LeadModalProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  )
}
