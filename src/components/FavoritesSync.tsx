'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { FAV_EVENT, readFavorites } from '@/lib/favorites'

/**
 * Страница избранного рендерится на сервере по параметрам ?a=1,2&p=3.
 * Этот компонент приводит адрес в соответствие с localStorage: при заходе и при каждом изменении списка.
 */
export function FavoritesSync({ current }: { current: { a: string; p: string } }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const sync = () => {
      const f = readFavorites()
      const a = f.a.join(',')
      const p = f.p.join(',')
      if (a === current.a && p === current.p) return
      const q = new URLSearchParams()
      if (a) q.set('a', a)
      if (p) q.set('p', p)
      router.replace(`${pathname}${q.size ? `?${q}` : ''}`, { scroll: false })
    }
    sync()
    window.addEventListener(FAV_EVENT, sync)
    return () => window.removeEventListener(FAV_EVENT, sync)
  }, [current.a, current.p, pathname, router])

  return null
}
