'use client'

import { useEffect, useRef } from 'react'

import { replaceAccountData, syncAccount, type SyncPayload } from '@/actions/account'
import { readSearches, SEARCH_EVENT, writeSearches } from '@/lib/compare'
import { FAV_EVENT, readFavorites, writeFavorites } from '@/lib/favorites'

const snapshot = (): SyncPayload => ({
  a: readFavorites().a,
  p: readFavorites().p,
  searches: readSearches().map((s) => ({ name: s.name, query: s.query })),
})

/**
 * Для вошедшего клиента: при загрузке сливает избранное и поиски из браузера с аккаунтом,
 * затем отправляет на сервер каждое изменение (с небольшой задержкой).
 */
export function AccountSyncer() {
  const ready = useRef(false)
  const applying = useRef(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const push = () => {
      if (!ready.current || applying.current) return
      clearTimeout(timer)
      timer = setTimeout(() => void replaceAccountData(snapshot()), 800)
    }

    ;(async () => {
      const merged = await syncAccount(snapshot())
      if (cancelled) return
      if (merged) {
        applying.current = true
        writeFavorites({ a: merged.a, p: merged.p })
        const current = readSearches()
        writeSearches(
          merged.searches.map((s) => ({
            id: current.find((c) => c.query === s.query)?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: s.name,
            query: s.query,
            createdAt: current.find((c) => c.query === s.query)?.createdAt ?? Date.now(),
          })),
        )
        applying.current = false
      }
      ready.current = true
    })()

    window.addEventListener(FAV_EVENT, push)
    window.addEventListener(SEARCH_EVENT, push)
    return () => {
      cancelled = true
      clearTimeout(timer)
      window.removeEventListener(FAV_EVENT, push)
      window.removeEventListener(SEARCH_EVENT, push)
    }
  }, [])

  return null
}
