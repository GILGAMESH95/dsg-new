'use client'

import Image from 'next/image'
import { useState } from 'react'

import { ArrowIcon } from './icons'

export type LivingSlide = { text: string; imageUrl: string | null; fullUrl?: string | null }

/** Слайдер «Жить здесь — это…»: слева фраза, справа фото */
export function LivingSlider({
  slides,
  prefix,
  labels,
}: {
  slides: LivingSlide[]
  prefix: string
  labels: { prev: string; next: string }
}) {
  const [i, setI] = useState(0)
  const go = (d: number) => setI((v) => (v + d + slides.length) % slides.length)
  const slide = slides[i]

  return (
    <div className="living-slider">
      <div className="living-slider__text">
        <span>{prefix}</span>
        <p key={i}>{slide.text}</p>
        <div className="living-slider__nav">
          <div className="living-slider__dots">
            {slides.map((_, k) => (
              <i key={k} className={k === i ? 'is-active' : ''} />
            ))}
          </div>
          {slides.length > 1 && (
            <div className="slider-arrows">
              <button type="button" onClick={() => go(-1)} aria-label={labels.prev}>
                <ArrowIcon style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={labels.next}>
                <ArrowIcon />
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`living-slider__img ${slide.imageUrl ? 'is-zoomable' : ''}`}
        {...(slide.imageUrl
          ? { 'data-lb-src': slide.fullUrl ?? slide.imageUrl, 'data-lb-alt': slide.text, role: 'button', tabIndex: 0 }
          : {})}
      >
        {slide.imageUrl ? (
          <Image key={slide.imageUrl} src={slide.imageUrl} alt={slide.text} fill sizes="(max-width: 960px) 100vw, 50vw" />
        ) : (
          <div className="img img--placeholder">
            <span>DS GROUP</span>
          </div>
        )}
      </div>
    </div>
  )
}
