'use client'

import { useActionState, useEffect, useState } from 'react'

import { bookApartment, type BookingState } from '@/actions/bookApartment'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries/ru'

import { CheckIcon } from './icons'

export function BookingForm({
  locale,
  apartmentId,
  dict,
  formDict,
}: {
  locale: Locale
  apartmentId: number
  dict: Dictionary['booking']
  formDict: Dictionary['form']
}) {
  const [state, action, pending] = useActionState<BookingState, FormData>(bookApartment, { status: 'idle' })
  const [page, setPage] = useState('')
  const [utm, setUtm] = useState('')

  useEffect(() => {
    setPage(window.location.pathname)
    try {
      const q = new URLSearchParams(window.location.search)
      const found = [...q.entries()].filter(([k]) => k.startsWith('utm_') || k === 'gclid' || k === 'fbclid').map(([k, v]) => `${k}=${v}`).join('&')
      setUtm(found || sessionStorage.getItem('dsg_utm') || '')
    } catch {
      setUtm('')
    }
  }, [])

  if (state.status === 'success') {
    const until = state.holdUntil
      ? new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : locale === 'en' ? 'en-GB' : 'ru-RU', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(state.holdUntil))
      : null
    return (
      <div className="lead-form__success" role="status">
        <span className="lead-form__success-icon">
          <CheckIcon width={28} height={28} />
        </span>
        <p>
          <strong>{dict.successTitle}</strong>
        </p>
        <p>{dict.successText}</p>
        {until && (
          <p className="booking-until">
            {dict.holdUntil}: <b>{until}</b>
          </p>
        )}
      </div>
    )
  }

  const errors: Record<string, string> = {
    name: dict.errName,
    phone: formDict.phoneInvalid,
    email: dict.errEmail,
    consent: dict.errConsent,
    unavailable: dict.errUnavailable,
    taken: dict.errTaken,
  }
  const error = state.status === 'error' ? (state.message ? errors[state.message] : formDict.error) : null

  return (
    <form action={action} className="lead-form">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="apartment" value={apartmentId} />
      <input type="hidden" name="page" value={page} />
      <input type="hidden" name="utm" value={utm} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden />

      <div className="lead-form__row">
        <label className="field">
          <span className="field__label">{formDict.name} *</span>
          <input name="name" type="text" required autoComplete="name" maxLength={120} />
        </label>
        <label className="field">
          <span className="field__label">{formDict.phone} *</span>
          <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="+995 5__ ___ ___" maxLength={40} />
        </label>
      </div>
      <label className="field">
        <span className="field__label">Email</span>
        <input name="email" type="email" autoComplete="email" maxLength={200} />
      </label>

      <fieldset className="lead-form__methods">
        <legend className="field__label">{formDict.contactMethod}</legend>
        {Object.entries(formDict.methods).map(([value, label], i) => (
          <label key={value} className="chip">
            <input type="radio" name="contactMethod" value={label} defaultChecked={i === 0} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span className="field__label">{formDict.message}</span>
        <textarea name="message" rows={2} maxLength={2000} />
      </label>

      <label className="checkbox">
        <input type="checkbox" name="consent" required />
        <span>{dict.consent}</span>
      </label>

      {error && (
        <p className="lead-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn--accent btn--block" disabled={pending}>
        {pending ? formDict.sending : dict.submit}
      </button>
    </form>
  )
}
