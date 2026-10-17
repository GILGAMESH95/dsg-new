import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import { phoneHref, telegramHref, whatsappHref } from '@/lib/format'
import { getPaymentMethods, getProjects } from '@/lib/queries'
import type { SiteSetting } from '@/payload-types'

import { FacebookIcon, InstagramIcon, TelegramIcon, WhatsappIcon, YoutubeIcon } from './icons'
import { Logo } from './Logo'

/** Подвал в стиле fsk.ru: логотип и телефон слева, три колонки ссылок, внизу контакты и соцсети */
export async function Footer({
  locale,
  dict,
  settings,
}: {
  locale: Locale
  dict: Dictionary
  settings: SiteSetting
}) {
  const [projects, methods] = await Promise.all([getProjects(locale), getPaymentMethods(locale)])

  const realty = [
    { label: dict.nav.apartments, href: `/${locale}/apartments` },
    { label: dict.nav.projects, href: `/${locale}/projects` },
    { label: dict.nav.onlineBooking, href: `/${locale}/online-booking` },
    { label: dict.nav.promotions, href: `/${locale}/promo` },
    { label: dict.nav.blog, href: `/${locale}/about/news` },
    { label: dict.nav.favorites, href: `/${locale}/favorites` },
  ]
  const terms = [
    ...methods.map((m) => ({ label: m.title, href: `/${locale}/buy/${m.slug ?? m.id}` })),
    { label: dict.nav.buy, href: `/${locale}/buy` },
    { label: dict.nav.about, href: `/${locale}/about` },
    { label: dict.nav.contacts, href: `/${locale}/contacts` },
    { label: dict.nav.documents, href: `/${locale}/documents` },
    { label: dict.nav.support, href: `/${locale}/support` },
  ]
  const socials = [
    { href: settings.instagram, icon: InstagramIcon, label: 'Instagram' },
    { href: settings.facebook, icon: FacebookIcon, label: 'Facebook' },
    { href: settings.youtube, icon: YoutubeIcon, label: 'YouTube' },
  ].filter((s) => s.href)

  return (
    <footer className="ft">
      <div className="container ft__top">
        <div className="ft__brand">
          <Link href={`/${locale}`} aria-label="DS Group">
            <Logo />
          </Link>
          {settings.phone && (
            <>
              <span className="ft__divider" aria-hidden />
              <a href={phoneHref(settings.phone)} className="ft__phone">
                {settings.phone}
              </a>
            </>
          )}
        </div>

        <nav className="ft__col ft__col--projects" aria-label={dict.footer.projects}>
          <h3>{dict.footer.projects}</h3>
          <ul>
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/${locale}/projects/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="ft__col" aria-label={dict.footer.realty}>
          <h3>{dict.footer.realty}</h3>
          <ul>
            {realty.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="ft__col" aria-label={dict.footer.terms}>
          <h3>{dict.footer.terms}</h3>
          <ul>
            {terms.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="container ft__bottom">
        <div className="ft__legal">
          <span>
            © {new Date().getFullYear()} DS Group. {dict.footer.rights}
          </span>
          <span className="ft__contacts">
            {settings.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
            {settings.address && <span>{settings.address}</span>}
            {settings.workingHours && <span>{settings.workingHours}</span>}
          </span>
        </div>
        <div className="ft__social">
          {settings.whatsapp && (
            <a href={whatsappHref(settings.whatsapp)} target="_blank" rel="noopener" aria-label="WhatsApp">
              <WhatsappIcon />
            </a>
          )}
          {settings.telegram && (
            <a href={telegramHref(settings.telegram)} target="_blank" rel="noopener" aria-label="Telegram">
              <TelegramIcon />
            </a>
          )}
          {socials.map(({ href, icon: Icon, label }) => (
            <a key={label} href={href!} target="_blank" rel="noopener" aria-label={label}>
              <Icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
