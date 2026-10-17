'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/** Липкая панель-навигатор по разделам страницы проекта */
export function ProjectNav({
  title,
  items,
  cta,
}: {
  title: string
  items: { id: string; label: string }[]
  cta: { href: string; label: string }
}) {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const targets = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    if (!targets.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-140px 0px -55% 0px' },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [items])

  return (
    <div className="pnav">
      <div className="container pnav__inner">
        <strong className="pnav__title">{title}</strong>
        <nav className="pnav__links" aria-label={title}>
          {items.map((i) => (
            <a key={i.id} href={`#${i.id}`} className={active === i.id ? 'is-active' : ''}>
              {i.label}
            </a>
          ))}
        </nav>
        <Link href={cta.href} className="btn btn--accent btn--sm pnav__cta">
          {cta.label}
        </Link>
      </div>
    </div>
  )
}
