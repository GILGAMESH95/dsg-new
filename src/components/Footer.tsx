import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import { phoneHref, telegramHref, whatsappHref } from '@/lib/format'
import type { SiteSetting } from '@/payload-types'

import { FacebookIcon, InstagramIcon, TelegramIcon, WhatsappIcon, YoutubeIcon } from './icons'
import { Logo } from './Logo'

export function Footer({
  locale,
  dict,
  settings,
}: {
  locale: Locale
  dict: Dictionary
  settings: SiteSetting
}) {
  const nav = ['projects', 'apartments', 'promotions', 'about', 'blog', 'contacts'] as const
  const socials = [
    { href: settings.instagram, icon: InstagramIcon, label: 'Instagram' },
    { href: settings.facebook, icon: FacebookIcon, label: 'Facebook' },
    { href: settings.youtube, icon: YoutubeIcon, label: 'YouTube' },
  ].filter((s) => s.href)

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo />
          <p>{dict.footer.about}</p>
          {socials.length > 0 && (
            <div className="footer__socials">
              {socials.map(({ href, icon: Icon, label }) => (
                <a key={label} href={href!} target="_blank" rel="noopener" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="footer__title">{dict.footer.navigation}</h3>
          <ul className="footer__list">
            {nav.map((key) => (
              <li key={key}>
                <Link href={`/${locale}/${key}`}>{dict.nav[key]}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="footer__title">{dict.footer.contacts}</h3>
          <ul className="footer__list">
            {settings.phone && (
              <li>
                <a href={phoneHref(settings.phone)} className="footer__phone">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
            )}
            {settings.address && <li>{settings.address}</li>}
            {settings.workingHours && <li>{settings.workingHours}</li>}
          </ul>
          <div className="footer__messengers">
            {settings.whatsapp && (
              <a href={whatsappHref(settings.whatsapp)} target="_blank" rel="noopener" className="btn btn--ghost btn--sm">
                <WhatsappIcon /> WhatsApp
              </a>
            )}
            {settings.telegram && (
              <a href={telegramHref(settings.telegram)} target="_blank" rel="noopener" className="btn btn--ghost btn--sm">
                <TelegramIcon /> Telegram
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>
          © {new Date().getFullYear()} DS Group. {dict.footer.rights}
        </span>
        <span>dsg.ge</span>
      </div>
    </footer>
  )
}
