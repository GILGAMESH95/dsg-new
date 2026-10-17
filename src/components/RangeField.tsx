'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Двойной ползунок «от — до» как у fsk.ru. В форму уходят скрытые поля nameFrom/nameTo —
 * и только когда значение сдвинуто с границы, чтобы адрес оставался чистым.
 * Событие change от ползунка всплывает до формы, там его ловит LiveFilters.
 */
export function RangeField({
  label,
  nameFrom,
  nameTo,
  min,
  max,
  step,
  initialFrom,
  initialTo,
  unit,
}: {
  label: string
  nameFrom: string
  nameTo: string
  min: number
  max: number
  step: number
  initialFrom?: number
  initialTo?: number
  unit: string
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const [from, setFrom] = useState(clamp(initialFrom ?? min))
  const [to, setTo] = useState(clamp(initialTo ?? max))
  const root = useRef<HTMLDivElement>(null)
  // Кнопка «Сбросить» (LiveFilters) шлёт live-reset — возвращаем ползунки на границы
  useEffect(() => {
    const form = root.current?.closest('form')
    const reset = () => {
      setFrom(min)
      setTo(max)
    }
    form?.addEventListener('live-reset', reset)
    return () => form?.removeEventListener('live-reset', reset)
  }, [min, max])
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/ /g, ' ')

  return (
    <div ref={root} className="pf__field pf__field--range">
      <span>{label}</span>
      <div className="pf__range">
        <div className="pf__values">
          <b>
            {fmt(from)} {unit}
          </b>
          <b>
            {fmt(to)} {unit}
          </b>
        </div>
        <div className="pf__track">
          <i style={{ left: `${pct(from)}%`, right: `${100 - pct(to)}%` }} />
          <input type="range" min={min} max={max} step={step} value={from} aria-label={`${label} min`} onChange={(e) => setFrom(Math.min(Number(e.target.value), to))} />
          <input type="range" min={min} max={max} step={step} value={to} aria-label={`${label} max`} onChange={(e) => setTo(Math.max(Number(e.target.value), from))} />
        </div>
      </div>
      {from > min && <input type="hidden" name={nameFrom} value={from} />}
      {to < max && <input type="hidden" name={nameTo} value={to} />}
    </div>
  )
}
