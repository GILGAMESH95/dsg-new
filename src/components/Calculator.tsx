'use client'

import { useMemo, useState } from 'react'

import type { Dictionary } from '@/i18n/dictionaries/ru'

import { useLeadModal } from './LeadModal'

const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

export function Calculator({
  dict,
  initialPrice = 85000,
  minDown = 20,
  maxMonths = 36,
  project,
}: {
  dict: Dictionary['calculator']
  initialPrice?: number
  minDown?: number
  maxMonths?: number
  project?: number
}) {
  const [price, setPrice] = useState(initialPrice)
  const [down, setDown] = useState(Math.max(minDown, 30))
  const [months, setMonths] = useState(Math.min(24, maxMonths))
  const open = useLeadModal()

  const { downAmount, rest, monthly } = useMemo(() => {
    const downAmount = (price * down) / 100
    const rest = price - downAmount
    return { downAmount, rest, monthly: rest / months }
  }, [price, down, months])

  const details = `${dict.price}: ${fmt(price)}; ${dict.downPayment}: ${down}% (${fmt(downAmount)}); ${dict.months}: ${months}; ${dict.monthly}: ${fmt(monthly)}`

  return (
    <div className="calc">
      <div className="calc__controls">
        <label className="range">
          <span className="range__head">
            <span>{dict.price}</span>
            <strong>{fmt(price)}</strong>
          </span>
          <input
            type="range"
            min={30000}
            max={400000}
            step={1000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </label>
        <label className="range">
          <span className="range__head">
            <span>{dict.downPayment}</span>
            <strong>
              {down}% · {fmt(downAmount)}
            </strong>
          </span>
          <input
            type="range"
            min={minDown}
            max={90}
            step={5}
            value={down}
            onChange={(e) => setDown(Number(e.target.value))}
          />
        </label>
        <label className="range">
          <span className="range__head">
            <span>{dict.months}</span>
            <strong>
              {months} {dict.monthsUnit}
            </strong>
          </span>
          <input
            type="range"
            min={3}
            max={maxMonths}
            step={1}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="calc__result">
        <span className="calc__label">{dict.monthly}</span>
        <output className="calc__monthly">{fmt(monthly)}</output>
        <span className="calc__label">
          {dict.total}: {fmt(rest)}
        </span>
        <button
          type="button"
          className="btn btn--accent btn--block"
          onClick={() => open({ type: 'installment', details, project, title: dict.cta })}
        >
          {dict.cta}
        </button>
        <p className="calc__note">{dict.note}</p>
      </div>
    </div>
  )
}
