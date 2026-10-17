'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { clearCompare, COMPARE_EVENT, readCompare } from '@/lib/compare'

/** Плавающая панель «Сравнение: N квартир» */
export function CompareBar({
  locale,
  labels,
}: {
  locale: string
  labels: { bar: string; open: string; clear: string }
}) {
  const [ids, setIds] = useState<number[]>([])
  const pathname = usePathname()

  useEffect(() => {
    const sync = () => setIds(readCompare())
    sync()
    window.addEventListener(COMPARE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (ids.length === 0 || pathname.endsWith('/compare')) return null

  return (
    <div className="cmp-bar" role="region" aria-label={labels.bar}>
      <span>
        {labels.bar}: <b>{ids.length}</b>
      </span>
      <Link href={`/${locale}/compare?ids=${ids.join(',')}`} className="btn btn--accent btn--sm">
        {labels.open}
      </Link>
      <button type="button" className="cmp-bar__clear" onClick={clearCompare}>
        {labels.clear}
      </button>
    </div>
  )
}
