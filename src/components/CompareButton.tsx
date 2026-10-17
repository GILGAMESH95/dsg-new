'use client'

import { useEffect, useState } from 'react'

import { COMPARE_EVENT, readCompare, toggleCompare } from '@/lib/compare'

import { CompareIcon } from './icons'

export function CompareButton({
  id,
  labels,
  className = '',
}: {
  id: number
  labels: { add: string; remove: string; max: string }
  className?: string
}) {
  const [active, setActive] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    const sync = () => setActive(readCompare().includes(id))
    sync()
    window.addEventListener(COMPARE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [id])

  const label = active ? labels.remove : labels.add

  return (
    <button
      type="button"
      className={`cmp-btn ${active ? 'is-active' : ''} ${className}`}
      aria-pressed={active}
      aria-label={label}
      title={note || label}
      onClick={() => {
        const result = toggleCompare(id)
        setNote(result === 'replaced' ? labels.max : '')
        if (result === 'replaced') setTimeout(() => setNote(''), 3000)
      }}
    >
      <CompareIcon />
    </button>
  )
}
