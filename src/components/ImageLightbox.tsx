'use client'

import { useCallback, useEffect, useState } from 'react'

import { ArrowIcon, CloseIcon } from './icons'

type Item = { src: string; alt: string }

/**
 * Просмотр фото на весь экран. Работает на всём сайте через делегирование кликов:
 * достаточно элемента с data-lb-src (и необязательно data-lb-alt).
 * Элементы внутри общего предка с data-lb-group листаются как одна галерея.
 */
export function ImageLightbox() {
  const [items, setItems] = useState<Item[]>([])
  const [index, setIndex] = useState(0)
  const open = items.length > 0

  const close = useCallback(() => setItems([]), [])
  const go = useCallback(
    (d: number) => setIndex((i) => (items.length ? (i + d + items.length) % items.length : 0)),
    [items.length],
  )

  useEffect(() => {
    const activate = (el: HTMLElement) => {
      const scope = el.closest<HTMLElement>('[data-lb-group]')
      const nodes = scope ? [...scope.querySelectorAll<HTMLElement>('[data-lb-src]')] : [el]
      const list: Item[] = []
      let start = 0
      for (const n of nodes) {
        const src = n.dataset.lbSrc
        if (!src) continue
        if (list.some((i) => i.src === src)) {
          if (n === el) start = list.findIndex((i) => i.src === src)
          continue
        }
        if (n === el) start = list.length
        list.push({ src, alt: n.dataset.lbAlt ?? '' })
      }
      if (list.length) {
        setItems(list)
        setIndex(start)
      }
    }
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-lb-src]')
      if (el) activate(el)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-lb-src]')
      if (el && el === e.target) {
        e.preventDefault()
        activate(el)
      }
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close, go])

  if (!open) return null
  const item = items[index]

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={close}>
      <button type="button" className="lightbox__close" onClick={close} aria-label="Close">
        <CloseIcon />
      </button>
      {items.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            aria-label="Previous"
          >
            <ArrowIcon style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            aria-label="Next"
          >
            <ArrowIcon />
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt={item.alt} className="lightbox__img" onClick={(e) => e.stopPropagation()} />
      <div className="lightbox__bar" onClick={(e) => e.stopPropagation()}>
        {item.alt && <span>{item.alt}</span>}
        {items.length > 1 && (
          <em>
            {index + 1} / {items.length}
          </em>
        )}
      </div>
    </div>
  )
}
