import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import { mediaUrl } from '@/lib/media'
import type { PaymentMethod, Project, SiteSetting } from '@/payload-types'

export type MenuLink = { label: string; href: string }
export type MenuColumn = { head: MenuLink; links: MenuLink[] }
export type MenuTile = MenuLink & { image: string | null }
export type MenuItem = {
  id: string
  label: string
  href: string
  kind: 'link' | 'columns' | 'tiles'
  columns?: MenuColumn[]
  tiles?: MenuTile[]
  sideLinks?: MenuLink[]
}

/** Путь без языка превращаем в ссылку с языком; внешние ссылки и якоря оставляем как есть */
export function menuHref(locale: Locale, href: string): string {
  const h = (href ?? '').trim()
  if (!h) return `/${locale}`
  if (/^(https?:|mailto:|tel:|#)/i.test(h)) return h
  const path = h.startsWith('/') ? h : `/${h}`
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/**
 * Меню шапки: если в админке («Настройки сайта → Меню») пункты заданы — берём их,
 * иначе стандартное меню (проекты, квартиры, способы покупки, акции, о компании, контакты).
 */
export function buildMenu({
  locale,
  settings,
  nav,
  projects,
  methods,
}: {
  locale: Locale
  settings: SiteSetting
  nav: Dictionary['nav']
  projects: Project[]
  methods: PaymentMethod[]
}): MenuItem[] {
  const methodLinks: MenuLink[] = methods.map((m) => ({ label: m.title, href: `/${locale}/buy/${m.slug ?? m.id}` }))
  const covers = projects.map((p) => mediaUrl(p.cover, 'card')).filter((u): u is string => Boolean(u))
  const L = (path: string) => `/${locale}${path}`

  const custom = settings.menuItems ?? []
  if (custom.length > 0) {
    return custom.map((it, i) => {
      const kind = it.kind ?? 'link'
      const item: MenuItem = { id: it.id ?? String(i), label: it.label, href: menuHref(locale, it.href), kind }
      if (kind === 'columns') {
        item.columns = (it.columns ?? []).map((c) => ({
          head: { label: c.label, href: menuHref(locale, c.href) },
          links: [
            ...(c.links ?? []).map((l) => ({ label: l.label, href: menuHref(locale, l.href) })),
            ...(c.autoMethods ? methodLinks : []),
          ],
        }))
      }
      if (kind === 'tiles') {
        item.tiles = (it.tiles ?? []).map((t, j) => ({
          label: t.label,
          href: menuHref(locale, t.href),
          image: mediaUrl(t.image, 'card') ?? covers[j] ?? null,
        }))
        item.sideLinks = (it.sideLinks ?? []).map((l) => ({ label: l.label, href: menuHref(locale, l.href) }))
      }
      return item
    })
  }

  return [
    {
      id: 'projects',
      label: nav.projects,
      href: L('/projects'),
      kind: 'tiles',
      tiles: [
        { label: nav.projects, href: L('/projects'), image: covers[0] ?? null },
        { label: nav.apartments, href: L('/apartments'), image: covers[1] ?? null },
        { label: nav.promotions, href: L('/promo'), image: covers[2] ?? null },
      ],
      sideLinks: [
        { label: nav.buy, href: L('/buy') },
        { label: nav.onlineBooking, href: L('/online-booking') },
        { label: nav.blog, href: L('/about/news') },
        { label: nav.support, href: L('/support') },
        { label: nav.documents, href: L('/documents') },
      ],
    },
    { id: 'apartments', label: nav.apartments, href: L('/apartments'), kind: 'link' },
    {
      id: 'buy',
      label: nav.buy,
      href: L('/buy'),
      kind: 'columns',
      columns: [
        { head: { label: nav.buy, href: L('/buy') }, links: methodLinks },
        { head: { label: nav.onlineBooking, href: L('/online-booking') }, links: [] },
        { head: { label: nav.support, href: L('/support') }, links: [] },
      ],
    },
    { id: 'promo', label: nav.promotions, href: L('/promo'), kind: 'link' },
    {
      id: 'about',
      label: nav.about,
      href: L('/about'),
      kind: 'columns',
      columns: [
        {
          head: { label: nav.about, href: L('/about') },
          links: [
            { label: nav.blog, href: L('/about/news') },
            { label: nav.documents, href: L('/documents') },
          ],
        },
        { head: { label: nav.contacts, href: L('/contacts') }, links: [] },
        { head: { label: nav.support, href: L('/support') }, links: [] },
      ],
    },
    { id: 'contacts', label: nav.contacts, href: L('/contacts'), kind: 'link' },
  ]
}
