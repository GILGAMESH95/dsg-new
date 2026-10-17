'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { COMPARE_EVENT, readCompare } from '@/lib/compare'

/** Приводит адрес страницы сравнения (?ids=1,2) в соответствие с localStorage */
export function CompareSync({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const sync = () => {
      const ids = readCompare().join(',')
      if (ids === current) return
      router.replace(ids ? `${pathname}?ids=${ids}` : pathname, { scroll: false })
    }
    sync()
    window.addEventListener(COMPARE_EVENT, sync)
    return () => window.removeEventListener(COMPARE_EVENT, sync)
  }, [current, pathname, router])

  return null
}
