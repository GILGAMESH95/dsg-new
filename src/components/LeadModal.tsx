'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import type { Dictionary } from '@/i18n/dictionaries/ru'
import type { Locale } from '@/i18n/config'

import { CloseIcon } from './icons'
import { LeadForm, type LeadHidden } from './LeadForm'

type OpenOptions = LeadHidden & { title?: string; subtitle?: string }

const LeadModalContext = createContext<(options?: OpenOptions) => void>(() => {})

export const useLeadModal = () => useContext(LeadModalContext)

export function LeadModalProvider({
  children,
  locale,
  dict,
}: {
  children: ReactNode
  locale: Locale
  dict: Dictionary['form']
}) {
  const [options, setOptions] = useState<OpenOptions | null>(null)
  const open = useCallback((o?: OpenOptions) => setOptions(o ?? {}), [])
  const close = () => setOptions(null)

  useEffect(() => {
    if (!options) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOptions(null)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [options])

  return (
    <LeadModalContext.Provider value={open}>
      {children}
      {options && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
          <div className="modal__backdrop" onClick={close} />
          <div className="modal__panel">
            <button type="button" className="modal__close" onClick={close} aria-label="Close">
              <CloseIcon />
            </button>
            <h2 id="lead-modal-title" className="modal__title">
              {options.title ?? dict.title}
            </h2>
            {options.subtitle && <p className="modal__subtitle">{options.subtitle}</p>}
            <LeadForm locale={locale} dict={dict} hidden={options} autoFocus />
          </div>
        </div>
      )}
    </LeadModalContext.Provider>
  )
}

export function LeadButton({
  children,
  className = 'btn btn--accent',
  ...options
}: OpenOptions & { children: ReactNode; className?: string }) {
  const open = useLeadModal()
  return (
    <button type="button" className={className} onClick={() => open(options)}>
      {children}
    </button>
  )
}
