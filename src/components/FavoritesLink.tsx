'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { countFavorites, FAV_EVENT, readFavorites } from '@/lib/favorites'

import { HeartIcon } from './icons'

/** Сердечко в шапке со счётчиком */
export function FavoritesLink({ href, label }: { href: string; label: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const sync = () => setCount(countFavorites(readFavorites()))
    sync()
    window.addEventListener(FAV_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAV_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <Link href={href} className="header__fav" aria-label={label} title={label}>
      <HeartIcon />
      {count > 0 && <span>{count}</span>}
    </Link>
  )
}
