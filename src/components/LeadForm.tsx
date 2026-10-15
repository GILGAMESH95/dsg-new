'use client'

import { useActionState, useEffect, useState } from 'react'

import { submitLead, type LeadState } from '@/actions/submitLead'
import type { Dictionary } from '@/i18n/dictionaries/ru'
import type { Locale } from '@/i18n/config'

import { CheckIcon } from './icons'

export type LeadHidden = {
  type?: 'callback' | 'consultation' | 'apartment' | 'installment' | 'promotion'
  project?: number | string
  apartment?: number | string
  details?: string
}

const UTM_KEY = 'dsg_utm'

function readUtm(): string {
  try {
    const params = new URLSearchParams(window.location.search)
    const utm = [...params.entries()]
      .filter(([k]) => k.startsWith('utm_') || k === 'gclid' || k === 'fbclid')
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    if (utm) sessionStorage.setItem(UTM_KEY, utm)
    return utm || sessionStorage.getItem(UTM_KEY) || ''
  } catch {
    return ''
  }
}

export function LeadForm({
  locale,
  dict,
  hidden = {},
  withMessage = false,
  variant = 'light',
  autoFocus = false,
}: {
  locale: Locale
  dict: Dictionary['form']
  hidden?: LeadHidden
  withMessage?: boolean
  variant?: 'light' | 'dark'
  autoFocus?: boolean
}) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: 'idle' })
  const [utm, setUtm] = useState('')
  const [page, setPage] = useState('')

  useEffect(() => {
    setUtm(readUtm())
    setPage(window.location.pathname)
  }, [])

  if (state.status === 'success') {
    return (
      <div className={`lead-form lead-form--${variant} lead-form__success`} role="status">
        <span className="lead-form__success-icon">
          <CheckIcon width={28} height={28} />
        </span>
        <p>{dict.success}</p>
      </div>
    )
  }

  return (
    <form action={action} className={`lead-form lead-form--${variant}`}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="type" value={hidden.type ?? 'callback'} />
      {hidden.project && <input type="hidden" name="project" value={hidden.project} />}
      {hidden.apartment && <input type="hidden" name="apartment" value={hidden.apartment} />}
      {hidden.details && <input type="hidden" name="details" value={hidden.details} />}
      <input type="hidden" name="utm" value={utm} />
      <input type="hidden" name="page" value={page} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="visually-hidden"
        aria-hidden
      />

      <div className="lead-form__row">
        <label className="field">
          <span className="field__label">{dict.name}</span>
          <input name="name" type="text" autoComplete="name" maxLength={120} autoFocus={autoFocus} />
        </label>
        <label className="field">
          <span className="field__label">{dict.phone} *</span>
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="+995 5__ ___ ___"
            maxLength={40}
          />
        </label>
      </div>

      <fieldset className="lead-form__methods">
        <legend className="field__label">{dict.contactMethod}</legend>
        {Object.entries(dict.methods).map(([value, label], i) => (
          <label key={value} className="chip">
            <input type="radio" name="contactMethod" value={label} defaultChecked={i === 0} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      {withMessage && (
        <label className="field">
          <span className="field__label">{dict.message}</span>
          <textarea name="message" rows={3} maxLength={2000} />
        </label>
      )}

      {state.status === 'error' && (
        <p className="lead-form__error" role="alert">
          {state.message === 'phone' ? dict.phoneInvalid : dict.error}
        </p>
      )}

      <button type="submit" className="btn btn--accent btn--block" disabled={pending}>
        {pending ? dict.sending : dict.submit}
      </button>
      <p className="lead-form__privacy">{dict.privacy}</p>
    </form>
  )
}
