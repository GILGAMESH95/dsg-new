'use client'

import { useEffect, useState } from 'react'

import { FAV_EVENT, readFavorites, toggleFavorite, type FavKind } from '@/lib/favorites'

import { HeartIcon } from './icons'

export function FavoriteButton({
  kind,
  id,
  labels,
}: {
  kind: FavKind
  id: number
  labels: { add: string; remove: string }
}) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => setActive(readFavorites()[kind].includes(id))
    sync()
    window.addEventListener(FAV_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAV_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [kind, id])

  return (
    <button
      type="button"
      className={`fav-btn ${active ? 'is-active' : ''}`}
      aria-pressed={active}
      aria-label={active ? labels.remove : labels.add}
      title={active ? labels.remove : labels.add}
      onClick={() => toggleFavorite(kind, id)}
    >
      <HeartIcon fill={active ? 'currentColor' : 'none'} />
    </button>
  )
}
