'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { ArrowIcon } from './icons'

/** Слайдер фона в шапке проекта: смена по таймеру, стрелки и точки */
export function HeroSlides({
  slides,
  labels,
}: {
  slides: { url: string; alt: string }[]
  labels: { prev: string; next: string }
}) {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6000)
    return () => clearInterval(t)
  }, [slides.length, i])

  const go = (d: number) => setI((v) => (v + d + slides.length) % slides.length)

  return (
    <>
      <div className="hero-slides" aria-hidden>
        {slides.map((s, k) => (
          <div key={s.url} className={`hero-slides__item ${k === i ? 'is-active' : ''}`}>
            <Image src={s.url} alt={s.alt} fill sizes="100vw" priority={k === 0} />
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="hero-slides__nav">
          <div className="living-slider__dots">
            {slides.map((_, k) => (
              <i key={k} className={k === i ? 'is-active' : ''} />
            ))}
          </div>
          <div className="slider-arrows">
            <button type="button" onClick={() => go(-1)} aria-label={labels.prev}>
              <ArrowIcon style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={labels.next}>
              <ArrowIcon />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
