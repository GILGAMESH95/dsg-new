'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { deleteSearch, normalizeQuery, readSearches, saveSearch, SEARCH_EVENT, type SavedSearch } from '@/lib/compare'

import { CloseIcon } from './icons'

/** Кнопка «Сохранить поиск» и список сохранённых поисков (в браузере) */
export function SavedSearches({
  locale,
  summary,
  hasFilters,
  labels,
}: {
  locale: string
  summary: string
  hasFilters: boolean
  labels: { save: string; saved: string; done: string; remove: string; all: string; hint: string }
}) {
  const params = useSearchParams()
  const [list, setList] = useState<SavedSearch[]>([])
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    const sync = () => setList(readSearches())
    sync()
    window.addEventListener(SEARCH_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SEARCH_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const query = params.toString()
  const alreadySaved = list.some((s) => normalizeQuery(s.query) === normalizeQuery(query))

  return (
    <div className="saved-searches">
      {hasFilters && (
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={alreadySaved}
          onClick={() => {
            if (saveSearch(summary || labels.all, query)) {
              setJustSaved(true)
              setTimeout(() => setJustSaved(false), 2500)
            }
          }}
        >
          {alreadySaved || justSaved ? `✓ ${labels.done}` : labels.save}
        </button>
      )}
      {list.length > 0 && (
        <div className="saved-searches__list">
          <span className="field__label">{labels.saved}</span>
          <ul>
            {list.map((s) => (
              <li key={s.id}>
                <Link href={`/${locale}/apartments${s.query ? `?${s.query}` : ''}`}>{s.name}</Link>
                <button type="button" onClick={() => deleteSearch(s.id)} aria-label={labels.remove} title={labels.remove}>
                  <CloseIcon width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
