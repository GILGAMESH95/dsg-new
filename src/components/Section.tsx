import Link from 'next/link'
import type { ReactNode } from 'react'

import { ArrowIcon } from './icons'

export function SectionHead({
  title,
  lead,
  link,
  as: Tag = 'h2',
}: {
  title: string
  lead?: string
  link?: { href: string; label: string }
  as?: 'h1' | 'h2'
}) {
  return (
    <div className="section-head">
      <div>
        <Tag className="section-head__title">{title}</Tag>
        {lead && <p className="section-head__lead">{lead}</p>}
      </div>
      {link && (
        <Link href={link.href} className="link-arrow">
          {link.label} <ArrowIcon width={18} height={18} />
        </Link>
      )}
    </div>
  )
}

export function PageHero({
  title,
  lead,
  crumbs,
  children,
}: {
  title: string
  lead?: string | null
  crumbs: { href: string; label: string }[]
  children?: ReactNode
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <Breadcrumbs items={crumbs} current={title} />
        <h1 className="page-hero__title">{title}</h1>
        {lead && <p className="page-hero__lead">{lead}</p>}
        {children}
      </div>
    </section>
  )
}

export function Breadcrumbs({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [...items, { href: '', label: current }].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  }
  return (
    <nav className="crumbs" aria-label="Breadcrumbs">
      {items.map((item) => (
        <span key={item.href}>
          <Link href={item.href}>{item.label}</Link>
          <span className="crumbs__sep">/</span>
        </span>
      ))}
      <span aria-current="page">{current}</span>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  )
}
