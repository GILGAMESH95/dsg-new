'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

import { ArrowIcon } from './icons'

export type GalleryItem = { url: string; full?: string; alt: string; category?: string | null }

/** Галерея с вкладками-категориями и горизонтальной лентой */
export function ProjectGallery({
  items,
  labels,
}: {
  items: GalleryItem[]
  labels: { all: string; prev: string; next: string }
}) {
  const categories = [...new Set(items.map((i) => i.category).filter((c): c is string => !!c))]
  const [cat, setCat] = useState('')
  const stripRef = useRef<HTMLDivElement>(null)
  const shown = cat ? items.filter((i) => i.category === cat) : items

  const scroll = (dir: 1 | -1) => {
    const el = stripRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <div className="pgallery">
      <div className="pgallery__bar">
        {categories.length > 0 && (
          <div className="pgallery__tabs">
            {['', ...categories].map((c) => (
              <button
                key={c || 'all'}
                type="button"
                className={`layouts__chip ${cat === c ? 'is-active' : ''}`}
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
              >
                {c || labels.all}
              </button>
            ))}
          </div>
        )}
        <div className="slider-arrows">
          <button type="button" onClick={() => scroll(-1)} aria-label={labels.prev}>
            <ArrowIcon style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label={labels.next}>
            <ArrowIcon />
          </button>
        </div>
      </div>
      <div className="pgallery__strip" ref={stripRef} data-lb-group>
        {shown.map((g, i) => (
          <figure
            key={`${g.url}-${i}`}
            className="pgallery__item is-zoomable"
            data-lb-src={g.full ?? g.url}
            data-lb-alt={g.category ?? g.alt}
            role="button"
            tabIndex={0}
            aria-label={g.alt}
          >
            <Image src={g.url} alt={g.alt} fill sizes="(max-width: 720px) 85vw, 45vw" />
            {g.category && <figcaption>{g.category}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  )
}
