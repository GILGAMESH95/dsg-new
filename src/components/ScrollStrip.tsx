'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { ArrowIcon } from './icons'

/**
 * Горизонтальная лента (карусель как у fsk.ru).
 * variant="overlay": круглые стрелки по бокам поверх ленты (скрываются на краях) и точки-страницы под ней;
 * по умолчанию стрелки лежат под лентой справа.
 */
export function ScrollStrip({
  children,
  labels,
  className = '',
  variant = 'below',
}: {
  children: ReactNode
  labels: { prev: string; next: string }
  className?: string
  variant?: 'below' | 'overlay'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ prev: false, next: false, pages: 1, page: 0 })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const pages = max > 4 ? Math.ceil(el.scrollWidth / el.clientWidth) : 1
    const page = max > 4 ? Math.min(pages - 1, Math.round((el.scrollLeft / max) * (pages - 1))) : 0
    setState({ prev: el.scrollLeft > 4, next: el.scrollLeft < max - 4, pages, page })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      ro.disconnect()
    }
  }, [measure])

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const arrow = (dir: 1 | -1) => (
    <button type="button" onClick={() => scroll(dir)} aria-label={dir === 1 ? labels.next : labels.prev}>
      <ArrowIcon style={dir === -1 ? { transform: 'rotate(180deg)' } : undefined} />
    </button>
  )

  if (variant === 'overlay') {
    return (
      <div className={`strip strip--overlay ${className}`}>
        <div className="strip__stage">
          <div className="strip__track" ref={ref}>
            {children}
          </div>
          {state.prev && <div className="strip__edge strip__edge--prev">{arrow(-1)}</div>}
          {state.next && <div className="strip__edge strip__edge--next">{arrow(1)}</div>}
        </div>
        {state.pages > 1 && (
          <div className="strip__dots" aria-hidden>
            {Array.from({ length: state.pages }, (_, i) => (
              <i key={i} className={i === state.page ? 'is-active' : ''} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`strip ${className}`}>
      <div className="strip__track" ref={ref}>
        {children}
      </div>
      <div className="slider-arrows strip__arrows">
        {arrow(-1)}
        {arrow(1)}
      </div>
    </div>
  )
}
